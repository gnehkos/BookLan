"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronUp, Inbox, Search, User as UserIcon } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { getActivePickupBooking, type ActivePickupBooking } from "@/lib/activeBooking";
import type { MapVehicle } from "@/components/BusMap";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type VehicleType = "bus" | "van";

type ActiveTrip = {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  distance_km: number;
  seats_available: number;
  price_per_km: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

const COLLAPSED_SHEET_HEIGHT = 84;
// Viewport-relative so the panel still fits on short screens.
const EXPANDED_SHEET_HEIGHT = "min(420px, 58vh)";
const DRAG_THRESHOLD = 40;

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("booklan_user_name") ?? "");

    const userId = localStorage.getItem("booklan_user_id");
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const { data } = await safeQuery(
        supabase.from("users").select("name, profile_photo_url").eq("id", userId).single()
      );
      if (cancelled || !data) return;
      setName(data.name ?? "");
      setPhotoUrl(data.profile_photo_url);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await safeQuery(
      supabase
        .from("active_trips")
        .select(
          "id, company_id, origin, destination, distance_km, seats_available, price_per_km, companies(name, vehicle_type)"
        )
        .eq("status", "active")
        // A fully booked bus isn't bookable, so don't advertise it.
        .gt("seats_available", 0)
    );

    if (fetchError) {
      setError("Couldn't load nearby buses. Check your connection and try again.");
    } else {
      setTrips((data as unknown as ActiveTrip[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Nearest first: this panel is a glance at what's close, not a full search.
  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => a.distance_km - b.distance_km),
    [trips]
  );

  const mapVehicles: MapVehicle[] = useMemo(
    () =>
      sortedTrips.map((trip) => ({
        id: trip.id,
        company: trip.companies?.name ?? "Unknown company",
        vehicleType: trip.companies?.vehicle_type ?? "bus",
        destination: trip.destination,
        distanceKm: trip.distance_km,
        price: trip.distance_km * trip.price_per_km,
      })),
    [sortedTrips]
  );

  async function selectTrip(trip: ActiveTrip) {
    // Only one roadside pickup can be live at a time.
    const userId = localStorage.getItem("booklan_user_id");
    if (userId) {
      const existing = await getActivePickupBooking(userId);
      if (existing) {
        setBlockedBy(existing);
        return;
      }
    }

    sessionStorage.setItem(
      "booklan_trip",
      JSON.stringify({
        id: trip.id,
        company_id: trip.company_id,
        origin: trip.origin,
        destination: trip.destination,
        distance_km: trip.distance_km,
        price_per_km: trip.price_per_km,
        companies: trip.companies,
      })
    );
    router.push("/booking/pickup");
  }

  function handleDragStart(clientY: number) {
    dragStartY.current = clientY;
  }

  function handleDragEnd(clientY: number) {
    const start = dragStartY.current;
    dragStartY.current = null;
    if (start === null) return;

    const delta = start - clientY;
    if (delta > DRAG_THRESHOLD) setExpanded(true);
    else if (delta < -DRAG_THRESHOLD) setExpanded(false);
    else setExpanded((current) => !current);
  }

  return (
    // Same 390px phone shell as every other screen, so the map doesn't sprawl
    // across a laptop viewport while the rest of the app stays a narrow column.
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[390px] overflow-hidden bg-white">
        {/* Within the shell the map is the page — everything else floats over it. */}
        <div className="absolute inset-0 z-0">
          <BusMap vehicles={mapVehicles} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white/95 via-white/80 to-transparent pb-10">
          <div className="pointer-events-auto w-full px-5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-text-secondary">
                  Hi, {name || "there"} 👋
                </span>
                <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-text-primary">
                  Where to today?
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => router.push("/inbox")}
                  aria-label="Inbox"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm"
                >
                  <Inbox className="h-5 w-5 text-text-primary" />
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  aria-label="Your profile"
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-sm"
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => router.push("/search")}
              className="mt-3.5 flex h-[52px] w-full items-center gap-3 rounded-[18px] border border-border bg-white pl-4 pr-1.5 text-left shadow-[0_4px_8px_rgba(13,17,23,0.08)]"
            >
              <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
              <span className="flex-1 truncate text-[14px] font-medium text-text-muted">
                Where are you going?
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-[13px] bg-gradient-to-b from-primary to-primary-dark px-4 py-2.5 text-[13px] font-bold text-white">
                <Search className="h-[13px] w-[13px]" />
                Search
              </span>
            </button>
          </div>
        </div>

        {/* Floating panel: detached from the edges, sitting clear of the nav. */}
        <div
          className="absolute inset-x-4 z-20 flex flex-col overflow-hidden rounded-[16px] bg-white shadow-[var(--shadow-float)] transition-[height] duration-300 ease-out"
          style={{
            bottom: NAV_CLEARANCE + 8,
            height: expanded ? EXPANDED_SHEET_HEIGHT : COLLAPSED_SHEET_HEIGHT,
          }}
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse nearby buses" : "Expand nearby buses"}
            onPointerDown={(e) => handleDragStart(e.clientY)}
            onPointerUp={(e) => handleDragEnd(e.clientY)}
            className="shrink-0 cursor-grab touch-none select-none px-4 pt-2.5 active:cursor-grabbing"
          >
            <span className="mx-auto mb-3 block h-1 w-9 rounded-pill bg-border" />
            <div className="flex items-center gap-2 pb-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
              <span className="text-[16px] font-semibold text-text-primary">Live near you</span>
              <span className="rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.4px] text-success">
                LIVE
              </span>
              <span className="ml-auto text-[12px] text-text-secondary">
                {sortedTrips.length} nearby
              </span>
              <ChevronUp
                className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {expanded && (
            <>

              {/* min-h-0 lets this flex child actually scroll instead of
                  overflowing the panel and getting clipped at the bottom. */}
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
                {loading && (
                  <>
                    <div className="h-[60px] w-full shrink-0 animate-pulse rounded-[12px] bg-surface" />
                    <div className="h-[60px] w-full shrink-0 animate-pulse rounded-[12px] bg-surface" />
                  </>
                )}

                {!loading && error && <ErrorState message={error} onRetry={loadTrips} />}

                {!loading && !error && sortedTrips.length === 0 && (
                  <p className="py-8 text-center text-sm text-text-secondary">
                    No active buses right now. Check back soon.
                  </p>
                )}

                {!loading &&
                  !error &&
                  sortedTrips.map((trip) => {
                    const lowSeats = trip.seats_available < 3;
                    const price = (trip.distance_km * trip.price_per_km).toFixed(2);

                    return (
                      // Compact by design: this panel is a glance at what's
                      // nearby — the full detail lives on the buses list.
                      <button
                        key={trip.id}
                        onClick={() => selectTrip(trip)}
                        className="flex shrink-0 items-center gap-3 rounded-[12px] bg-white p-3 text-left shadow-[var(--shadow-float)]"
                      >
                        <CompanyLogo name={trip.companies?.name ?? "Unknown"} size={36} />

                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-semibold text-text-primary">
                              {trip.companies?.name ?? "Unknown company"}
                            </span>
                            <VehicleBadge type={trip.companies?.vehicle_type ?? "bus"} />
                          </div>
                          <span className="flex items-center gap-1.5 truncate text-[12px] text-text-secondary">
                            <span className="truncate">{trip.destination}</span>
                            <span className="text-text-muted">·</span>
                            <span className="shrink-0">{trip.distance_km} km</span>
                            <span className="text-text-muted">·</span>
                            <span className={`shrink-0 ${lowSeats ? "text-error" : ""}`}>
                              {trip.seats_available} seats
                            </span>
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <span className="text-[15px] font-bold text-primary">${price}</span>
                          <ChevronRight className="h-4 w-4 text-text-muted" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {blockedBy && (
        <ActiveBookingModal booking={blockedBy} onClose={() => setBlockedBy(null)} />
      )}

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}
