"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, ChevronUp, Search } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import DistanceLabel from "@/components/DistanceLabel";
import ErrorState from "@/components/ErrorState";
import Price from "@/components/Price";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";
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

type SortMode = "nearest" | "cheapest";

const COLLAPSED_SHEET_HEIGHT = 84;
// Viewport-relative so the panel still fits on short screens.
const EXPANDED_SHEET_HEIGHT = "min(420px, 58vh)";
const DRAG_THRESHOLD = 40;

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("nearest");
  const [name, setName] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("booklan_user_name") ?? "");
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

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    if (sortMode === "nearest") {
      list.sort((a, b) => a.distance_km - b.distance_km);
    } else {
      list.sort((a, b) => a.distance_km * a.price_per_km - b.distance_km * b.price_per_km);
    }
    return list;
  }, [trips, sortMode]);

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
              <button
                aria-label="Notifications"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white shadow-sm"
              >
                <Bell className="h-5 w-5 text-text-primary" />
              </button>
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
              <div className="shrink-0 px-4 pb-3">
                <div className="flex items-center gap-1 rounded-pill bg-surface p-1">
                  {(["nearest", "cheapest"] as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      className={`flex-1 rounded-pill px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                        sortMode === mode
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:bg-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* min-h-0 lets this flex child actually scroll instead of
                  overflowing the panel and getting clipped at the bottom. */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
                {loading && (
                  <>
                    <div className="h-[74px] w-full shrink-0 animate-pulse rounded-[12px] bg-surface" />
                    <div className="h-[74px] w-full shrink-0 animate-pulse rounded-[12px] bg-surface" />
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
                    const etaMinutes = Math.round((trip.distance_km / AVG_SPEED_KMH) * 60);

                    return (
                      <button
                        key={trip.id}
                        onClick={() => selectTrip(trip)}
                        className="flex shrink-0 items-center gap-3 rounded-[12px] bg-white p-4 text-left shadow-[var(--shadow-float)]"
                      >
                        <CompanyLogo name={trip.companies?.name ?? "Unknown"} size={40} />

                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[16px] font-semibold text-text-primary">
                              {trip.companies?.name ?? "Unknown company"}
                            </span>
                            <VehicleBadge type={trip.companies?.vehicle_type ?? "bus"} />
                          </div>
                          <span className="truncate text-[14px] text-text-secondary">
                            {trip.origin} → {trip.destination}
                          </span>
                          <div className="flex items-center gap-3">
                            <DistanceLabel km={trip.distance_km} />
                            <span className="text-[12px] text-text-secondary">
                              ~{etaMinutes} min
                            </span>
                            <span
                              className={`text-[12px] ${
                                lowSeats ? "font-medium text-error" : "text-text-secondary"
                              }`}
                            >
                              {trip.seats_available} seats
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Price amount={Number(price)} />
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

      <BottomNav />
    </div>
  );
}
