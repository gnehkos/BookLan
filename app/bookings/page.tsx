"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Ticket as TicketIcon } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/Button";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import Price from "@/components/Price";
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
  active_trips: {
    origin: string;
    destination: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
};

type AdvancedBookingRow = {
  id: string;
  schedule_id: string;
  ticket_id: string;
  seat_numbers: number[];
  travel_date: string;
  total_price: number;
  status: string;
  schedules: {
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
};

const TABS: { mode: TabMode; label: string }[] = [
  { mode: "current", label: "Current Bookings" },
  { mode: "past", label: "History" },
];

export default function BookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabMode>("current");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [scheduled, setScheduled] = useState<AdvancedBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
        "id, trip_id, ticket_id, seat_numbers, total_price, status, distance_remaining_km, active_trips(origin, destination, companies(name, vehicle_type))"
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const scheduledQuery = supabase
      .from("advanced_bookings")
      .select(
        "id, schedule_id, ticket_id, seat_numbers, travel_date, total_price, status, schedules(origin, destination, departure_time, arrival_time, companies(name, vehicle_type))"
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
        <div className="bg-white px-4 pt-6 pb-4">
          <h1 className="text-[16px] font-semibold text-text-primary">My Bookings</h1>
        </div>

        <div className="flex gap-1 px-4 pt-4">
          {TABS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setTab(mode)}
              className={`flex-1 rounded-pill py-2 text-[13px] font-semibold transition-colors ${
                tab === mode
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-surface"
              }`}
            >
              {label}
            </button>
          ))}
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
                cancelling={cancellingId === booking.id}
                onCancel={() => handleCancelScheduled(booking)}
              />
            ))}
        </div>
      </div>

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}

function RouteLine({ origin, destination }: { origin?: string; destination?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[15px] font-bold text-text-primary">
      {origin ?? "Unknown"}
      <span className="text-text-muted">→</span>
      {destination ?? "Unknown"}
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
  cancelling,
  onCancel,
}: {
  booking: AdvancedBookingRow;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const schedule = booking.schedules;
  const company = schedule?.companies;
  const cancelled = booking.status === "cancelled";

  return (
    <div className="flex flex-col gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
      <div className="flex items-start gap-3">
        <CompanyLogo name={company?.name ?? "Unknown"} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <RouteLine origin={schedule?.origin} destination={schedule?.destination} />
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">
              {company?.name ?? "Unknown company"}
            </span>
            <VehicleBadge type={company?.vehicle_type ?? "bus"} />
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="flex flex-col gap-1.5 rounded-[12px] bg-surface p-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-text-secondary">Travel date</span>
          <span className="font-semibold text-text-primary">{booking.travel_date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Departure</span>
          <span className="font-semibold text-text-primary">
            {schedule?.departure_time} – {schedule?.arrival_time}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">
            {booking.seat_numbers.length > 1 ? "Seats" : "Seat"}
          </span>
          <span className="font-semibold text-text-primary">
            {booking.seat_numbers.join(", ")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-[12px] border border-dashed border-border px-3 py-2">
        <span className="text-[12px] text-text-secondary">Ticket ID</span>
        <span className="font-mono text-[13px] font-bold text-text-primary">
          {booking.ticket_id}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[13px] text-text-secondary">Total paid</span>
        <Price amount={booking.total_price} />
      </div>

      {!cancelled && !confirmingCancel && (
        <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
          Cancel Booking
        </Button>
      )}

      {!cancelled && confirmingCancel && (
        <div className="flex flex-col gap-2 rounded-card bg-surface p-3">
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
      )}
    </div>
  );
}

function BookingCard({
  booking,
  tab,
  cancelling,
  onTrack,
  onCancel,
}: {
  booking: BookingRow;
  tab: TabMode;
  cancelling: boolean;
  onTrack: () => void;
  onCancel: () => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const company = booking.active_trips?.companies;
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="flex flex-col gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
      <div className="flex items-start gap-3">
        <CompanyLogo name={company?.name ?? "Unknown"} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <RouteLine
            origin={booking.active_trips?.origin}
            destination={booking.active_trips?.destination}
          />
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">
              {company?.name ?? "Unknown company"}
            </span>
            <VehicleBadge type={company?.vehicle_type ?? "bus"} />
          </div>
          <span className="text-[13px] text-text-secondary">
            {booking.seat_numbers.length > 1 ? "Seats" : "Seat"}{" "}
            {booking.seat_numbers.join(", ")}
          </span>
        </div>

        {tab === "past" ? (
          <span
            className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
              isCancelled ? "bg-error/10 text-error" : "bg-border text-text-secondary"
            }`}
          >
            {isCancelled ? "Cancelled" : "Completed"}
          </span>
        ) : (
          <StatusBadge status="confirmed" />
        )}
      </div>

      <div className="flex items-center justify-between rounded-[12px] border border-dashed border-border px-3 py-2">
        <span className="text-[12px] text-text-secondary">Ticket ID</span>
        <span className="font-mono text-[13px] font-bold text-text-primary">
          {booking.ticket_id}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[13px] text-text-secondary">Total paid</span>
        <Price amount={booking.total_price} />
      </div>

      {tab === "current" && !confirmingCancel && (
        <div className="flex gap-2">
          <Button onClick={onTrack}>
            {booking.distance_remaining_km > 0 ? "Track" : "View trip"}
          </Button>
          <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
            Cancel Booking
          </Button>
        </div>
      )}

      {tab === "current" && confirmingCancel && (
        <div className="flex flex-col gap-2 rounded-card bg-surface p-3">
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
      )}
    </div>
  );
}
