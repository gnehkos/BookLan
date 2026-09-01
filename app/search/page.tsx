"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin, Search, X } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { isInsidePhnomPenh } from "@/lib/geo";
import { getActivePickupBooking, type ActivePickupBooking } from "@/lib/activeBooking";
import { POPULAR_DESTINATIONS } from "@/constants/booking";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);

  /**
   * Boarding mode is decided silently from the passenger's location — inside
   * Phnom Penh there is no national road to flag a bus down on, so those
   * passengers get the station picker. The pickup screen can still switch.
   */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const inCity = isInsidePhnomPenh(position.coords.latitude, position.coords.longitude);
        sessionStorage.setItem("booklan_origin_mode", inCity ? "station" : "road");
      },
      () => sessionStorage.setItem("booklan_origin_mode", "road"),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

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
          .gt("seats_available", 0)
          .ilike("destination", `%${trimmed}%`)
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

  async function selectTrip(trip: TripResult) {
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

  const searching = query.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="bg-white px-4 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/home")}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
            <div className="flex h-12 flex-1 items-center gap-3 rounded-[18px] border border-border bg-surface px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
              <input
                autoFocus
                type="text"
                placeholder="Where do you want to go?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
              />
              {searching && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="shrink-0 text-text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {!searching && (
          <div className="px-4 pt-5">
            <span className="text-[12px] font-bold tracking-[0.4px] text-text-muted">
              POPULAR DESTINATIONS
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {POPULAR_DESTINATIONS.map((place) => (
                <button
                  key={place.name}
                  onClick={() => setQuery(place.name)}
                  className="flex items-center gap-2.5 rounded-[12px] bg-white p-3 text-left shadow-[var(--shadow-float)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-semibold text-text-primary">
                      {place.name}
                    </span>
                    <span className="truncate text-[11px] text-text-muted">{place.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searching && (
          <div className="flex flex-col gap-2 px-4 pt-4">
            {loading && (
              <>
                <div className="h-16 w-full animate-pulse rounded-[12px] bg-white" />
                <div className="h-16 w-full animate-pulse rounded-[12px] bg-white" />
              </>
            )}

            {!loading && error && (
              <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
            )}

            {!loading && !error && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-[14px] text-text-secondary">
                  No buses to &quot;{query}&quot; right now.
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="text-[13px] font-semibold text-primary"
                >
                  Browse popular destinations
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              results.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => selectTrip(trip)}
                  className="flex items-center gap-3 rounded-[12px] bg-white p-3.5 text-left shadow-[var(--shadow-float)]"
                >
                  <CompanyLogo name={trip.companies?.name ?? "Unknown"} size={40} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold text-text-primary">
                      {trip.origin} → {trip.destination}
                    </span>
                    <span className="truncate text-[12px] text-text-secondary">
                      {trip.companies?.name ?? "Unknown company"} · {trip.distance_km} km
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
                </button>
              ))}
          </div>
        )}
      </div>

      {blockedBy && (
        <ActiveBookingModal booking={blockedBy} onClose={() => setBlockedBy(null)} />
      )}

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}
