"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DistanceLabel from "@/components/DistanceLabel";
import Price from "@/components/Price";
import VehicleBadge from "@/components/VehicleBadge";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";

type VehicleType = "bus" | "van";

type StoredTrip = {
  destination: string;
};

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

type SortMode = "soonest" | "cheapest" | "seats";

export default function BusesPage() {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("soonest");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const tripStored = sessionStorage.getItem("booklan_trip");
    const pickupStored = sessionStorage.getItem("booklan_pickup");
    if (!tripStored) {
      router.replace("/search");
      return;
    }
    if (!pickupStored) {
      router.replace("/booking/pickup");
      return;
    }
    const trip = JSON.parse(tripStored) as StoredTrip;
    setDestination(trip.destination);
  }, [router]);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;

    async function loadTrips() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("active_trips")
          .select(
            "id, company_id, origin, destination, distance_km, seats_available, price_per_km, companies(name, vehicle_type)"
          )
          .eq("status", "active")
          .gt("seats_available", 0)
          .eq("destination", destination)
      );

      if (!cancelled) {
        if (fetchError) {
          setError("Couldn't load buses for this route. Check your connection and try again.");
        } else {
          setTrips((data as unknown as ActiveTrip[]) ?? []);
        }
        setLoading(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, [destination, refreshKey]);

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    if (sortMode === "soonest") {
      list.sort((a, b) => a.distance_km - b.distance_km);
    } else if (sortMode === "cheapest") {
      list.sort((a, b) => a.distance_km * a.price_per_km - b.distance_km * b.price_per_km);
    } else {
      list.sort((a, b) => b.seats_available - a.seats_available);
    }
    return list;
  }, [trips, sortMode]);

  function selectTrip(trip: ActiveTrip) {
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
    router.push(`/booking/${trip.id}`);
  }

  if (!destination) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pt-6 pb-2">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-semibold text-text-primary">Buses to {destination}</h1>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 pb-4 text-[13px] text-text-secondary">
          <span className="font-semibold text-text-primary">
            {sortedTrips[0]?.origin ?? "Your location"}
          </span>
          <span>→</span>
          <span className="font-semibold text-primary">{destination}</span>
        </div>

        <div className="flex items-center justify-center gap-1 px-4 pt-4 pb-3">
          <div className="flex w-full items-center gap-1 rounded-pill bg-white p-1 shadow-sm">
            {(
              [
                { mode: "soonest", label: "Soonest" },
                { mode: "cheapest", label: "Cheapest" },
                { mode: "seats", label: "Most seats" },
              ] as { mode: SortMode; label: string }[]
            ).map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex-1 rounded-pill px-2 py-1.5 text-xs font-semibold transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4">
          {loading && (
            <>
              <div className="h-28 w-full animate-pulse rounded-[12px] bg-white" />
              <div className="h-28 w-full animate-pulse rounded-[12px] bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && sortedTrips.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">
              No active buses to {destination} right now.
            </p>
          )}

          {!loading &&
            !error &&
            sortedTrips.map((trip) => {
              const lowSeats = trip.seats_available < 3;
              const price = (trip.distance_km * trip.price_per_km).toFixed(2);
              const etaMinutes = Math.round((trip.distance_km / AVG_SPEED_KMH) * 60);

              return (
                <div
                  key={trip.id}
                  className="flex flex-col gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="truncate text-[16px] font-semibold text-text-primary">
                        {trip.origin} → {trip.destination}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] text-text-secondary">
                          {trip.companies?.name ?? "Unknown company"}
                        </span>
                        <VehicleBadge type={trip.companies?.vehicle_type ?? "bus"} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <DistanceLabel km={trip.distance_km} suffix="away" />
                        <span className="text-[12px] text-text-secondary">~{etaMinutes} min</span>
                        <span
                          className={`text-[12px] ${
                            lowSeats ? "font-medium text-error" : "text-text-secondary"
                          }`}
                        >
                          {trip.seats_available} seats left
                        </span>
                      </div>
                    </div>
                    <Price amount={Number(price)} />
                  </div>

                  <button
                    onClick={() => selectTrip(trip)}
                    className="h-11 w-full rounded-[12px] bg-primary text-[14px] font-semibold text-white hover:brightness-110"
                  >
                    Select
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
