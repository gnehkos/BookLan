"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MapPin, Ticket as TicketIcon } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import Button from "@/components/Button";
import BookingExtras from "@/components/BookingExtras";
import BookingReceipt from "@/components/BookingReceipt";
import FareBreakdown from "@/components/FareBreakdown";
import ErrorState from "@/components/ErrorState";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { releaseScheduleSeats, releaseTripSeats } from "@/lib/seats";

type VehicleType = "bus" | "van";
type TabMode = "current" | "past";

type BookingRow = {
  id: string;
  trip_id: string;
  ticket_id: string;
  seat_numbers: number[];
  total_price: number;
  status: string;
  distance_remaining_km: number;
  created_at: string;
  pickup_name: string | null;
  boarded_at: string | null;
  completed_at: string | null;
  active_trips: {
    origin: string;
    destination: string;
    distance_km: number;
    price_per_km: number;
    company_id: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
  stations: { name: string } | null;
};

type AdvancedBookingRow = {
  id: string;
  schedule_id: string;
  ticket_id: string;
  seat_numbers: number[];
  travel_date: string;
  total_price: number;
  status: string;
  created_at: string;
  schedules: {
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    company_id: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
  stations: { name: string } | null;
};

const TABS: { mode: TabMode; label: string }[] = [
  { mode: "current", label: "Current Bookings" },
  { mode: "past", label: "History" },
];

export default function BookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Landing here from a finished trip should open History, not Current — the
   * trip that was just completed is no longer a current booking, so the
   * default tab would look empty. `?tab=past` is read from the URL rather than
   * via useSearchParams so the page needs no Suspense boundary.
   */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "past") setTab("past");
  }, []);
  const [tab, setTab] = useState<TabMode>("current");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [scheduled, setScheduled] = useState<AdvancedBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // Booking ids this passenger has already rated, so history offers the
  // form only where it can still be used.
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("booklan_user_id");
    if (!stored) {
      router.replace("/");
      return;
    }
    setUserId(stored);
  }, [router]);

  const loadBookings = useCallback(async (currentTab: TabMode, uid: string) => {
    setLoading(true);
    setError(null);

    const roadQuery = supabase
      .from("bookings")
      .select(
        "id, trip_id, ticket_id, seat_numbers, total_price, status, distance_remaining_km, created_at, pickup_name, boarded_at, completed_at, active_trips(origin, destination, distance_km, price_per_km, company_id, companies(name, vehicle_type)), stations(name)"
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const scheduledQuery = supabase
      .from("advanced_bookings")
      .select(
        "id, schedule_id, ticket_id, seat_numbers, travel_date, total_price, status, created_at, schedules(origin, destination, departure_time, arrival_time, company_id, companies(name, vehicle_type)), stations:dropoff_station_id(name)"
      )
      .eq("user_id", uid)
      .order("travel_date", { ascending: true });

    // Both kinds of booking share a tab, so both are fetched together.
    const [road, sched] = await Promise.all([
      safeQuery(
        // 'confirmed' covers both waiting for pickup and riding; a finished
        // trip is marked 'completed' and drops into History.
        currentTab === "current"
          ? roadQuery.eq("status", "confirmed")
          : roadQuery.in("status", ["completed", "cancelled"])
      ),
      safeQuery(
        currentTab === "current"
          ? scheduledQuery.eq("status", "confirmed")
          : scheduledQuery.in("status", ["completed", "cancelled"])
      ),
    ]);

    if (road.error || sched.error) {
      setError("Couldn't load your bookings. Check your connection and try again.");
    } else {
      setBookings((road.data as unknown as BookingRow[]) ?? []);
      setScheduled((sched.data as unknown as AdvancedBookingRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await safeQuery(
        supabase.from("reviews").select("booking_id").eq("user_id", userId)
      );
      if (cancelled || !data) return;
      setReviewedIds(
        new Set(
          (data as { booking_id: string | null }[])
            .map((row) => row.booking_id)
            .filter((id): id is string => Boolean(id))
        )
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, tab]);

  const markReviewed = useCallback((bookingId: string) => {
    setReviewedIds((current) => new Set(current).add(bookingId));
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadBookings(tab, userId);
  }, [tab, userId, loadBookings]);

  async function handleCancel(booking: BookingRow) {
    setCancellingId(booking.id);
    setCancelError(null);
    const { error: cancelErr } = await safeQuery(
      supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id)
    );

    if (cancelErr) {
      setCancelError("Couldn't cancel this booking. Please try again.");
    } else {
      await releaseTripSeats(booking.trip_id, booking.seat_numbers.length);
      if (userId) await loadBookings(tab, userId);
    }
    setCancellingId(null);
  }

  async function handleCancelScheduled(booking: AdvancedBookingRow) {
    setCancellingId(booking.id);
    setCancelError(null);
    const { error: cancelErr } = await safeQuery(
      supabase.from("advanced_bookings").update({ status: "cancelled" }).eq("id", booking.id)
    );

    if (cancelErr) {
      setCancelError("Couldn't cancel this booking. Please try again.");
    } else {
      await releaseScheduleSeats(booking.schedule_id, booking.seat_numbers.length);
      if (userId) await loadBookings(tab, userId);
    }
    setCancellingId(null);
  }

  if (!userId) return null;

  const isEmpty = !loading && !error && bookings.length === 0 && scheduled.length === 0;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-28">
        {/* The tabs sit inside the header rather than being pulled up over it
            with a negative margin, which was overlapping the title. */}
        <div className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-primary to-primary-dark px-5 pb-5 pt-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl"
          />
          <h1 className="relative text-[26px] font-extrabold tracking-[-0.6px] text-white">
            My bookings
          </h1>
          <p className="relative mt-1 text-[13px] text-white/60">
            Your tickets, past and present.
          </p>

          <div className="relative mt-5 flex gap-1 rounded-pill bg-white/10 p-1">
            {TABS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setTab(mode)}
                className={`flex-1 rounded-pill py-2 text-[13px] font-bold transition-colors ${
                  tab === mode ? "bg-white text-primary" : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {loading && (
            <>
              <div className="h-32 w-full animate-pulse rounded-[12px] bg-white" />
              <div className="h-32 w-full animate-pulse rounded-[12px] bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => userId && loadBookings(tab, userId)} />
          )}

          {isEmpty && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              {tab === "current" ? (
                <TicketIcon className="h-10 w-10 text-text-muted" />
              ) : (
                <CalendarClock className="h-10 w-10 text-text-muted" />
              )}
              <p className="text-[14px] text-text-secondary">
                {tab === "current" ? "No current bookings yet." : "No past bookings yet."}
              </p>
            </div>
          )}

          {!loading && !error && cancelError && (
            <p className="text-center text-sm text-error">{cancelError}</p>
          )}

          {!loading &&
            !error &&
            bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                tab={tab}
                reviewed={reviewedIds.has(booking.id)}
                onReviewed={markReviewed}
                cancelling={cancellingId === booking.id}
                onTrack={() =>
                  // Already boarded? Go to the live trip, not the pickup handover.
                  router.push(
                    booking.distance_remaining_km > 0
                      ? `/tracking/${booking.id}`
                      : `/trip/${booking.id}`
                  )
                }
                onCancel={() => handleCancel(booking)}
              />
            ))}

          {!loading &&
            !error &&
            scheduled.map((booking) => (
              <ScheduledCard
                key={booking.id}
                booking={booking}
                tab={tab}
                cancelling={cancellingId === booking.id}
                onCancel={() => handleCancelScheduled(booking)}
                reviewed={reviewedIds.has(booking.id)}
                onReviewed={markReviewed}
              />
            ))}
        </div>
      </div>

      <ActiveTripBanner />
    </div>
  );
}

/** Which booking flow produced this ticket — the two behave differently. */
function TypeBadge({ kind }: { kind: "pickup" | "scheduled" }) {
  const pickup = kind === "pickup";
  return (
    <span
      className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-medium ${
        pickup ? "bg-[#E8EEF4] text-primary" : "bg-[#EDE9FE] text-[#7C3AED]"
      }`}
    >
      {pickup ? "Roadside pickup" : "Scheduled"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cancelled = status === "cancelled";
  return (
    <span
      className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold capitalize ${
        cancelled ? "bg-error/10 text-error" : "bg-success/10 text-success"
      }`}
    >
      {status}
    </span>
  );
}

function ScheduledCard({
  booking,
  tab,
  cancelling,
  onCancel,
  reviewed,
  onReviewed,
}: {
  booking: AdvancedBookingRow;
  tab: TabMode;
  cancelling: boolean;
  onCancel: () => void;
  reviewed: boolean;
  onReviewed: (bookingId: string) => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const schedule = booking.schedules;
  const company = schedule?.companies;
  const cancelled = booking.status === "cancelled";

  return (
    <BookingReceipt
      company={company?.name ?? "Unknown company"}
      vehicleBadge={<VehicleBadge type={company?.vehicle_type ?? "bus"} />}
      typeTag={<TypeBadge kind="scheduled" />}
      origin={schedule?.origin}
      destination={schedule?.destination}
      rows={[
        { label: "Travel date", value: booking.travel_date },
        {
          label: "Departure",
          value: `${schedule?.departure_time ?? "--"} – ${schedule?.arrival_time ?? "--"}`,
        },
        {
          label: booking.seat_numbers.length > 1 ? "Seats" : "Seat",
          value: booking.seat_numbers.join(", "),
        },
      ]}
      ticketId={booking.ticket_id}
      total={booking.total_price}
      statusSlot={<StatusBadge status={booking.status} />}
      actions={
        cancelled ? undefined : confirmingCancel ? (
          <div className="flex flex-col gap-2 rounded-[12px] bg-surface p-3">
            <p className="text-center text-[13px] text-text-secondary">Cancel this booking?</p>
            <div className="flex gap-2">
              <Button variant="outline" loading={cancelling} onClick={onCancel}>
                Yes, cancel
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
                Keep
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
            Cancel Booking
          </Button>
        )
      }
      extras={
        tab === "past" && !cancelled ? (
          <BookingExtras
            bookingId={booking.id}
            companyId={schedule?.company_id ?? null}
            reviewed={reviewed}
            onReviewed={onReviewed}
            milestones={{
              bookedAt: booking.created_at,
              travelDate: booking.travel_date,
              departure: `${schedule?.departure_time ?? "--"} - ${schedule?.arrival_time ?? "--"}`,
              dropoffName: booking.stations?.name ?? null,
            }}
          />
        ) : undefined
      }
    />
  );
}

function BookingCard({
  booking,
  tab,
  cancelling,
  onTrack,
  onCancel,
  reviewed,
  onReviewed,
}: {
  booking: BookingRow;
  tab: TabMode;
  cancelling: boolean;
  onTrack: () => void;
  onCancel: () => void;
  reviewed: boolean;
  onReviewed: (bookingId: string) => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const company = booking.active_trips?.companies;
  const isCancelled = booking.status === "cancelled";

  return (
    <BookingReceipt
      company={company?.name ?? "Unknown company"}
      vehicleBadge={<VehicleBadge type={company?.vehicle_type ?? "bus"} />}
      typeTag={<TypeBadge kind="pickup" />}
      origin={booking.active_trips?.origin}
      destination={booking.active_trips?.destination}
      rows={[
        {
          label: "Distance",
          value: `${booking.active_trips?.distance_km ?? 0} km`,
          icon: <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />,
        },
        {
          label: booking.seat_numbers.length > 1 ? "Seats" : "Seat",
          value: booking.seat_numbers.join(", "),
        },
      ]}
      fare={
        // Roadside fares are distance-based, so the receipt shows the sum
        // rather than only the amount that came out of it.
        <FareBreakdown
          distanceKm={booking.active_trips?.distance_km ?? 0}
          pricePerKm={booking.active_trips?.price_per_km ?? 0}
          seats={booking.seat_numbers.length}
          total={booking.total_price}
          compact
        />
      }
      ticketId={booking.ticket_id}
      total={booking.total_price}
      statusSlot={
        tab === "past" ? (
          <span
            className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
              isCancelled ? "bg-error/10 text-error" : "bg-border text-text-secondary"
            }`}
          >
            {isCancelled ? "Cancelled" : "Completed"}
          </span>
        ) : (
          <StatusBadge status="confirmed" />
        )
      }
      actions={
        tab !== "current" ? undefined : confirmingCancel ? (
          <div className="flex flex-col gap-2 rounded-[12px] bg-surface p-3">
            <p className="text-center text-[13px] text-text-secondary">Cancel this booking?</p>
            <div className="flex gap-2">
              <Button variant="outline" loading={cancelling} onClick={onCancel}>
                Yes, cancel
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
                Keep
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={onTrack}>
              {booking.distance_remaining_km > 0 ? "Track" : "View trip"}
            </Button>
            <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
              Cancel Booking
            </Button>
          </div>
        )
      }
      extras={
        tab === "past" && !isCancelled ? (
          <BookingExtras
            bookingId={booking.id}
            companyId={booking.active_trips?.company_id ?? null}
            reviewed={reviewed}
            onReviewed={onReviewed}
            milestones={{
              bookedAt: booking.created_at,
              boardedAt: booking.boarded_at,
              completedAt: booking.completed_at,
              pickupName: booking.pickup_name,
              dropoffName: booking.stations?.name ?? null,
            }}
          />
        ) : undefined
      }
    />
  );
}
