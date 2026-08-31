"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

type VehicleType = "bus" | "van";

type TripResult = {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TripResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("active_trips")
          .select(
            "id, company_id, origin, destination, distance_km, price_per_km, companies(name, vehicle_type)"
          )
          .eq("status", "active")
          .ilike("destination", `%${query.trim()}%`)
      );

      if (!cancelled) {
        if (fetchError) {
          setError("Couldn't search destinations. Check your connection and try again.");
        } else {
          setResults((data as unknown as TripResult[]) ?? []);
        }
        setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, refreshKey]);

  function selectTrip(trip: TripResult) {
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
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button
            onClick={() => router.push("/home")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <div className="flex h-12 flex-1 items-center gap-3 rounded-card border border-border bg-surface px-4">
            <Search className="h-5 w-5 text-text-secondary" />
            <input
              autoFocus
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4">
          {loading && (
            <>
              <div className="h-16 w-full animate-pulse rounded-card bg-surface" />
              <div className="h-16 w-full animate-pulse rounded-card bg-surface" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && results.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">
              No destinations found for &quot;{query}&quot;.
            </p>
          )}

          {!loading &&
            !error &&
            results.map((trip) => (
              <button
                key={trip.id}
                onClick={() => selectTrip(trip)}
                className="flex items-center gap-3 rounded-card border border-border bg-white p-4 text-left"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-text-primary">
                    {trip.destination}
                  </span>
                  <span className="text-[13px] text-text-secondary">
                    {trip.companies?.name ?? "Unknown company"} · {trip.distance_km} km
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              </button>
            ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
