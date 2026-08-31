"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Button from "@/components/Button";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

type VehicleType = "bus" | "van";
type TabMode = "active" | "past";

type BookingRow = {
  id: string;
  ticket_id: string;
  seat_number: number;
  total_price: number;
  status: string;
  distance_remaining_km: number;
  active_trips: {
    origin: string;
    destination: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
};

export default function BookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabMode>("active");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_user_id");
    if (!stored) {
      router.replace("/");
      return;
    }
    setUserId(stored);
  }, [router]);

  const loadBookings = useCallback(
    async (currentTab: TabMode, uid: string) => {
      setLoading(true);
      setError(null);
      const query = supabase
        .from("bookings")
        .select(
          "id, ticket_id, seat_number, total_price, status, distance_remaining_km, active_trips(origin, destination, companies(name, vehicle_type))"
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const { data, error: fetchError } = await safeQuery(
        currentTab === "active"
          ? query.eq("status", "confirmed").gt("distance_remaining_km", 0)
          : query.or("status.eq.cancelled,distance_remaining_km.eq.0")
      );

      if (fetchError) {
        setError("Couldn't load your bookings. Check your connection and try again.");
      } else {
        setBookings((data as unknown as BookingRow[]) ?? []);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!userId) return;
    loadBookings(tab, userId);
  }, [tab, userId, loadBookings]);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setCancelError(null);
    const { error: cancelErr } = await safeQuery(
      supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)
    );

    if (cancelErr) {
      setCancelError("Couldn't cancel this booking. Please try again.");
    } else if (userId) {
      await loadBookings(tab, userId);
    }
    setCancellingId(null);
  }

  if (!userId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="bg-white px-4 pt-6 pb-4">
          <h1 className="text-lg font-bold text-text-primary">My Bookings</h1>
        </div>

        <div className="flex gap-1 px-4 pt-4">
          {(["active", "past"] as TabMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTab(mode)}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold capitalize transition-colors ${
                tab === mode
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-surface"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {loading && (
            <>
              <div className="h-32 w-full animate-pulse rounded-card bg-white" />
              <div className="h-32 w-full animate-pulse rounded-card bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => userId && loadBookings(tab, userId)} />
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <TicketIcon className="h-10 w-10 text-text-secondary" />
              <p className="text-[14px] text-text-secondary">
                {tab === "active" ? "No active bookings yet." : "No past bookings yet."}
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
                onTrack={() => router.push(`/tracking/${booking.id}`)}
                onCancel={() => handleCancel(booking.id)}
              />
            ))}
        </div>
      </div>

      <BottomNav />
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
    <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[13px] font-bold text-text-primary">
            {booking.ticket_id}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-text-primary">
              {company?.name ?? "Unknown company"}
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
              {company?.vehicle_type ?? "bus"}
            </span>
          </div>
          <span className="text-[13px] text-text-secondary">
            {booking.active_trips?.origin} → {booking.active_trips?.destination} · Seat{" "}
            {booking.seat_number}
          </span>
        </div>

        {tab === "past" ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isCancelled ? "bg-error/10 text-error" : "bg-border text-text-secondary"
            }`}
          >
            {isCancelled ? "Cancelled" : "Completed"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            Confirmed
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[13px] text-text-secondary">Total paid</span>
        <span className="text-[15px] font-bold text-text-primary">
          ${booking.total_price.toFixed(2)}
        </span>
      </div>

      {tab === "active" && !confirmingCancel && (
        <div className="flex gap-2">
          <Button onClick={onTrack}>Track</Button>
          <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
            Cancel
          </Button>
        </div>
      )}

      {tab === "active" && confirmingCancel && (
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
