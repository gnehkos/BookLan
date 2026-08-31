"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, Search } from "lucide-react";
import Logo from "@/components/Logo";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

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

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("nearest");

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
    router.push("/booking/pickup");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center justify-between bg-white px-4 py-3">
          <Logo size="sm" />
          <button
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <Bell className="h-6 w-6 text-text-primary" />
          </button>
        </div>

        <div className="bg-white px-4 pb-4">
          <button
            onClick={() => router.push("/search")}
            className="flex h-12 w-full items-center gap-3 rounded-card border border-border bg-surface px-4 text-left"
          >
            <Search className="h-5 w-5 text-text-secondary" />
            <span className="text-[15px] text-text-secondary">Where do you want to go?</span>
          </button>
        </div>

        <div className="h-[50vh] w-full">
          <BusMap />
        </div>

        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h2 className="text-lg font-bold text-text-primary">Nearby Buses</h2>
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
              <div className="h-24 w-full animate-pulse rounded-card bg-white" />
              <div className="h-24 w-full animate-pulse rounded-card bg-white" />
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
                <button
                  key={trip.id}
                  onClick={() => selectTrip(trip)}
                  className="flex items-center gap-3 rounded-card bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-text-primary">
                        {trip.companies?.name ?? "Unknown company"}
                      </span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
                        {trip.companies?.vehicle_type ?? "bus"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-text-secondary">
                      <span>{trip.distance_km} km away</span>
                      <span className={lowSeats ? "font-semibold text-error" : ""}>
                        {trip.seats_available} seats left
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-text-primary">${price}</span>
                    <ChevronRight className="h-5 w-5 text-text-secondary" />
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
