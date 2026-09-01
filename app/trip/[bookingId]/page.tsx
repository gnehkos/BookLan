"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Flag, MapPin, Ticket } from "lucide-react";
import Button from "@/components/Button";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";

const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type VehicleType = "bus" | "van";

type TripBooking = {
  id: string;
  ticket_id: string;
  seat_numbers: number[];
  pickup_lat: number;
  pickup_lng: number;
  active_trips: {
    destination: string;
    distance_km: number;
    companies: { name: string; vehicle_type: VehicleType } | null;
  } | null;
  stations: { name: string; address: string; lat: number; lng: number } | null;
};

/**
 * Trip simulation. With no driver app and no live vehicle feed, the journey is
 * played back client-side: the bus advances along the pickup → station line on
 * a timer. Distances and the destination are real; the movement is simulated.
 */
const TICK_MS = 1200;
const TRIP_TICKS = 24;

/** Roughly how tall the floating panel is, so the map can frame around it. */
const PANEL_HEIGHT = 240;

export default function TripPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<TripBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await safeQuery(
        supabase
          .from("bookings")
          .select(
            "id, ticket_id, seat_numbers, pickup_lat, pickup_lng, active_trips(destination, distance_km, companies(name, vehicle_type)), stations(name, address, lat, lng)"
          )
          .eq("id", bookingId)
          .single()
      );

      if (cancelled) return;
      if (error || !data) {
        setLoadError("Couldn't load your trip. It may no longer exist.");
      } else {
        setBooking(data as unknown as TripBooking);
      }
      setLoading(false);
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, refreshKey]);

  // Advance the simulated journey.
  useEffect(() => {
    if (!booking || progress >= 1) return;
    if (startedAt.current === null) startedAt.current = Date.now();

    const interval = setInterval(() => {
      setProgress((current) => Math.min(1, current + 1 / TRIP_TICKS));
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [booking, progress]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6">
          <div className="h-6 w-40 animate-pulse rounded bg-white" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pt-6">
          <ErrorState message={loadError ?? "Couldn't load your trip."} onRetry={handleRetry} />
        </div>
        <BottomNav />
      </div>
    );
  }

  const company = booking.active_trips?.companies?.name ?? "Your bus";
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
            panelHeight={PANEL_HEIGHT + NAV_CLEARANCE}
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
          className="absolute inset-x-4 z-20 rounded-[16px] bg-white p-4 shadow-[var(--shadow-float)]"
          style={{ bottom: NAV_CLEARANCE + 8 }}
        >
          {arrived ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <span className="text-[16px] font-semibold text-text-primary">
                You&apos;ve arrived
              </span>
              <span className="text-center text-[12px] text-text-secondary">
                Welcome to {destinationName}. Thanks for riding with {company}.
              </span>
              <div className="mt-1 flex w-full gap-3">
                <Button onClick={() => router.push("/bookings")}>My Bookings</Button>
                <Button variant="outline" onClick={() => router.push("/home")}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-success" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[16px] font-semibold text-text-primary">
                    On the way to {destinationName}
                  </span>
                  <span className="truncate text-[12px] text-text-secondary">
                    {company} · Seat{booking.seat_numbers.length > 1 ? "s" : ""}{" "}
                    {booking.seat_numbers.join(", ")}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-surface">
                <div
                  className="h-full rounded-pill bg-primary transition-[width] duration-700 ease-linear"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>

              <div className="mt-4 flex items-stretch gap-3">
                <Stat label="Arriving in" value={`${etaMinutes} min`} emphasis />
                <Stat label="Distance left" value={`${remainingKm} km`} />
                <Stat label="Trip" value={`${Math.round(progress * 100)}%`} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-[12px] bg-surface p-3">
                <MapPin className="h-4 w-4 shrink-0 text-text-secondary" />
                <span className="truncate text-[12px] text-text-secondary">
                  {booking.stations?.address ?? destinationName}
                </span>
              </div>
            </>
          )}
        </div>

        {!arrived && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{ bottom: NAV_CLEARANCE + 8 + PANEL_HEIGHT }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-[var(--shadow-float)]">
              <Flag className="h-3 w-3" />
              Trip in progress
            </span>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-[12px] bg-surface p-3">
      <span className="text-[12px] text-text-secondary">{label}</span>
      <span
        className={
          emphasis
            ? "text-[16px] font-bold text-primary"
            : "text-[14px] font-medium text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}
