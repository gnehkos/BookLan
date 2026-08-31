"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
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

type SortMode = "nearest" | "cheapest";

export default function BusesPage() {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("nearest");
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
    if (sortMode === "nearest") {
      list.sort((a, b) => a.distance_km - b.distance_km);
    } else {
      list.sort((a, b) => a.distance_km * a.price_per_km - b.distance_km * b.price_per_km);
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
    router.push(`/booking/${trip.id}/seats`);
  }

  if (!destination) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Buses to {destination}</h1>
        </div>

        <div className="flex items-center justify-end px-4 pt-4 pb-3">
          <div className="flex items-center gap-1 rounded-full bg-white p-1">
            {(["nearest", "cheapest"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-surface"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4">
          {loading && (
            <>
              <div className="h-28 w-full animate-pulse rounded-card bg-white" />
              <div className="h-28 w-full animate-pulse rounded-card bg-white" />
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
                <div key={trip.id} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-text-primary">
                          {trip.companies?.name ?? "Unknown company"}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
                          {trip.companies?.vehicle_type ?? "bus"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-text-secondary">
                        <span>{trip.distance_km} km away</span>
                        <span>~{etaMinutes} min</span>
                        <span className={lowSeats ? "font-semibold text-error" : ""}>
                          {trip.seats_available} seats left
                        </span>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold text-text-primary">${price}</span>
                  </div>

                  <button
                    onClick={() => selectTrip(trip)}
                    className="h-10 w-full rounded-card bg-primary text-[14px] font-semibold text-white hover:bg-[#15304c]"
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
