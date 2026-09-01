"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, ChevronRight, MapPin, Search } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { isInsidePhnomPenh } from "@/lib/geo";
import { getActivePickupBooking, type ActivePickupBooking } from "@/lib/activeBooking";

type VehicleType = "bus" | "van";

/**
 * Where the passenger boards. Inside Phnom Penh there is no national road to
 * flag a bus down on, so those passengers pick a departure station instead of
 * dropping a pin on the map.
 */
type OriginMode = "station" | "road";

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
  const [originMode, setOriginMode] = useState<OriginMode>("road");
  const [detectedInCity, setDetectedInCity] = useState<boolean | null>(null);
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);


  // Default the boarding mode from the passenger's location: inside the Phnom
  // Penh bounding box, station pickup is the only workable option.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setDetectedInCity(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const inCity = isInsidePhnomPenh(position.coords.latitude, position.coords.longitude);
        setDetectedInCity(inCity);
        setOriginMode(inCity ? "station" : "road");
      },
      () => setDetectedInCity(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

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
          .gt("seats_available", 0)
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
    sessionStorage.setItem("booklan_origin_mode", originMode);
    router.push("/booking/pickup");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-28">
        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button
            onClick={() => router.push("/home")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex h-12 flex-1 items-center gap-3 rounded-[18px] border border-border bg-surface px-4">
            <Search className="h-[18px] w-[18px] text-text-secondary" />
            <input
              autoFocus
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="px-4 pb-1">
          <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
            PICKING YOU UP FROM
          </span>
          <div className="mt-2 flex gap-2">
            <OriginOption
              active={originMode === "station"}
              icon={<Building2 className="h-4 w-4" />}
              title="Phnom Penh"
              subtitle="Board at a station"
              onClick={() => setOriginMode("station")}
            />
            <OriginOption
              active={originMode === "road"}
              icon={<MapPin className="h-4 w-4" />}
              title="My location"
              subtitle="Roadside pickup"
              onClick={() => setOriginMode("road")}
            />
          </div>
          {detectedInCity && originMode === "road" && (
            <p className="mt-2 text-[12px] font-medium text-warning">
              You look like you&apos;re inside Phnom Penh — buses can&apos;t stop on city
              streets, so station pickup is recommended.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 px-4">
          {loading && (
            <>
              <div className="h-16 w-full animate-pulse rounded-[12px] bg-surface" />
              <div className="h-16 w-full animate-pulse rounded-[12px] bg-surface" />
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
                className="flex items-center gap-3 rounded-card border border-border bg-white p-3.5 text-left"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold text-text-primary">
                    {trip.origin}
                    <span className="text-text-muted">→</span>
                    {trip.destination}
                  </span>
                  <span className="text-[13px] text-text-secondary">
                    {trip.companies?.name ?? "Unknown company"} · {trip.distance_km} km
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
              </button>
            ))}
        </div>
      </div>

      {blockedBy && (
        <ActiveBookingModal booking={blockedBy} onClose={() => setBlockedBy(null)} />
      )}

      <BottomNav />
    </div>
  );
}

function OriginOption({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center gap-2.5 rounded-[14px] border p-3 text-left transition-colors ${
        active ? "border-primary bg-accent" : "border-border bg-white"
      }`}
    >
      <span className={active ? "text-primary" : "text-text-muted"}>{icon}</span>
      <span className="flex flex-col">
        <span
          className={`text-[13px] font-bold ${active ? "text-primary" : "text-text-primary"}`}
        >
          {title}
        </span>
        <span className="text-[11px] text-text-muted">{subtitle}</span>
      </span>
    </button>
  );
}
