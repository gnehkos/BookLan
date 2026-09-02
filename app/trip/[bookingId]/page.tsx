"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Flag, Loader2, Star, Ticket } from "lucide-react";
import Button from "@/components/Button";
import { NAV_CLEARANCE } from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";
import { useMeasuredHeight } from "@/lib/useMeasuredHeight";
import { completeBooking } from "@/lib/seats";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type VehicleType = "bus" | "van";

type TripBooking = {
  id: string;
  user_id: string;
  ticket_id: string;
  seat_numbers: number[];
  pickup_lat: number;
  pickup_lng: number;
  status: string;
  active_trips: {
    destination: string;
    distance_km: number;
    company_id: string;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
  stations: { name: string; address: string; lat: number; lng: number } | null;
};

/**
 * Trip simulation. With no driver app and no live vehicle feed, the journey is
 * played back client-side. Distances and the destination are real; the movement
 * is simulated.
 *
 * Progress is derived from a start timestamp kept in localStorage, not from a
 * counter in component state — otherwise leaving the screen and coming back
 * remounts the page and restarts the journey from the beginning.
 */
const TRIP_DURATION_MS = 29_000;
const TICK_MS = 500;

function startedAtKey(bookingId: string) {
  return `booklan_trip_started_${bookingId}`;
}

/** First view of a trip stamps its start; later views read it back. */
function readOrStampStart(bookingId: string) {
  const key = startedAtKey(bookingId);
  const existing = Number(localStorage.getItem(key));
  if (existing > 0) return existing;
  const now = Date.now();
  localStorage.setItem(key, String(now));
  return now;
}

/** Starting estimate for the panel; the real height is measured on mount. */
const PANEL_HEIGHT_FALLBACK = 240;

export default function TripPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<TripBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [panelRef, panelHeight] = useMeasuredHeight<HTMLDivElement>(PANEL_HEIGHT_FALLBACK);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await safeQuery(
        supabase
          .from("bookings")
          .select(
            "id, user_id, status, ticket_id, seat_numbers, pickup_lat, pickup_lng, active_trips(destination, distance_km, company_id, companies(name, vehicle_type)), stations(name, address, lat, lng)"
          )
          .eq("id", bookingId)
          .single()
      );

      if (cancelled) return;
      const row = data as unknown as TripBooking | null;
      // The id comes from the URL, so confirm the trip is actually this
      // passenger's before showing it.
      if (error || !row) {
        setLoadError("Couldn't load your trip. It may no longer exist.");
      } else if (row.user_id !== localStorage.getItem("booklan_user_id")) {
        setLoadError("This trip belongs to a different account.");
      } else {
        setBooking(row);
        // A finished trip opens at the end; a running one resumes from when it
        // actually started rather than replaying from zero.
        setStartedAt(row.status === "completed" ? 0 : readOrStampStart(bookingId));
      }
      setLoading(false);
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, refreshKey]);

  // Re-render on a tick; the actual position comes from elapsed wall-clock time.
  useEffect(() => {
    if (!booking || startedAt === null) return;
    if (Date.now() - startedAt >= TRIP_DURATION_MS) return;

    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [booking, startedAt, now]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  // How far along the journey is, measured from when it actually began.
  const progress =
    startedAt === null
      ? 0
      : startedAt === 0
        ? 1
        : Math.min(1, (now - startedAt) / TRIP_DURATION_MS);

  // Arriving ends the booking; without this it stays "confirmed" forever and
  // keeps blocking the next pickup booking.
  useEffect(() => {
    if (!booking || progress < 1) return;
    completeBooking(booking.id);
  }, [booking, progress]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6">
          <div className="h-6 w-40 animate-pulse rounded bg-white" />
        </div>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pt-6">
          <ErrorState message={loadError ?? "Couldn't load your trip."} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  const company = booking.active_trips?.companies?.name ?? "Your bus";
  const companyId = booking.active_trips?.company_id ?? null;
  const destinationName = booking.stations?.name ?? booking.active_trips?.destination ?? "your stop";
  const totalKm = booking.active_trips?.distance_km ?? 0;

  const pickup: [number, number] = [booking.pickup_lat, booking.pickup_lng];
  const destination: [number, number] = booking.stations
    ? [booking.stations.lat, booking.stations.lng]
    : pickup;

  const remainingKm = Math.max(0, Math.round(totalKm * (1 - progress)));
  const etaMinutes = Math.max(0, Math.round((remainingKm / AVG_SPEED_KMH) * 60));
  const arrived = progress >= 1;

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[390px] overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <TripMap
            origin={pickup}
            destination={destination}
            destinationName={destinationName}
            company={company}
            progress={progress}
            remainingKm={remainingKm}
            etaMinutes={etaMinutes}
            panelHeight={panelHeight + NAV_CLEARANCE + 24}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-5">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-pill border border-border bg-white px-3 py-1.5 shadow-[var(--shadow-float)]">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[12px] font-medium text-text-primary">
              {booking.ticket_id}
            </span>
          </span>
        </div>

        {/* Floating trip panel, detached from the edges and clear of the nav. */}
        <div
          ref={panelRef}
          className="absolute inset-x-4 z-20 rounded-[16px] bg-white p-4 shadow-[var(--shadow-float)]"
          style={{ bottom: NAV_CLEARANCE + 8 }}
        >
          {arrived ? (
            <TripRating
              company={company}
              companyId={companyId}
              bookingId={booking.id}
              destinationName={destinationName}
            />
          ) : (
            // Deliberately compact: this floats over the map, so it shows the
            // destination, the ETA and progress and nothing else.
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-success" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-semibold text-text-primary">
                    On the way to {destinationName}
                  </span>
                  <span className="truncate text-[12px] text-text-secondary">
                    {company} · {remainingKm} km left
                  </span>
                </div>
                <span className="shrink-0 rounded-[10px] bg-accent px-2.5 py-1 text-right">
                  <span className="block text-[16px] font-bold leading-tight text-primary">
                    {etaMinutes}
                  </span>
                  <span className="block text-[10px] text-text-secondary">min</span>
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-surface">
                <div
                  className="h-full rounded-pill bg-primary transition-[width] duration-700 ease-linear"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {!arrived && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{ bottom: NAV_CLEARANCE + 16 + panelHeight }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-[var(--shadow-float)]">
              <Flag className="h-3 w-3" />
              Trip in progress
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

/**
 * Post-trip rating. Writes to the `reviews` table, which the bus detail screen
 * reads back so real passenger feedback replaces the demo review pool.
 */
function TripRating({
  company,
  companyId,
  bookingId,
  destinationName,
}: {
  company: string;
  companyId: string | null;
  bookingId: string;
  destinationName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating === 0 || !companyId) return;
    const userId = localStorage.getItem("booklan_user_id");
    if (!userId) return;

    setSaving(true);
    setError(null);

    const { error: saveError } = await safeQuery(
      supabase.from("reviews").insert({
        company_id: companyId,
        user_id: userId,
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      })
    );

    if (saveError) {
      setError("Couldn't save your review. Please try again.");
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <span className="text-[14px] font-semibold text-text-primary">Thanks for the rating</span>
        <div className="mt-1 flex w-full gap-3">
          <Button onClick={() => router.push("/bookings?tab=past")}>My Bookings</Button>
          <Button variant="outline" onClick={() => router.push("/home")}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] font-semibold text-text-primary">
            Arrived at {destinationName}
          </span>
          <span className="truncate text-[12px] text-text-secondary">
            How was your trip with {company}?
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setRating(value)}
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            className="p-1"
          >
            <Star
              className={`h-7 w-7 ${
                value <= rating ? "fill-warning text-warning" : "text-border"
              }`}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={280}
          placeholder="Add a comment (optional)"
          className="h-11 w-full rounded-[12px] border border-border bg-surface px-3 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
        />
      )}

      {error && <p className="text-center text-[12px] text-error">{error}</p>}

      <div className="flex gap-3">
        <Button disabled={rating === 0 || saving} onClick={submit}>
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit rating"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/home")}>
          Skip
        </Button>
      </div>
    </div>
  );
}
