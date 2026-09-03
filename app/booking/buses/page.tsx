"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Star,
  Users,
} from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import DestinationSheet from "@/components/DestinationSheet";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH } from "@/constants/booking";
import { companyProfile } from "@/constants/companyProfile";

type VehicleType = "bus" | "van";

type StoredPickup = { lat: number; lng: number; stationName?: string; placeName?: string };

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

/**
 * Per-sort styling. The top result in each mode gets the highlight border and
 * the tagged price badge, so it reads as the pick for that criterion.
 */
const SORT_ACCENT: Record<
  SortMode,
  { label: string; strip: string; border: string; badgeBg: string; badgeText: string }
> = {
  // Amber for soonest, green for cheapest, violet for most seats — three
  // clearly different signals rather than three shades of blue.
  soonest: {
    label: "SOONEST",
    strip: "bg-warning",
    border: "border-warning",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-warning",
  },
  cheapest: {
    label: "CHEAPEST",
    strip: "bg-success",
    border: "border-success",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-success",
  },
  seats: {
    label: "MOST SEATS",
    strip: "bg-[#7C3AED]",
    border: "border-[#7C3AED]",
    badgeBg: "bg-[#EDE9FE]",
    badgeText: "text-[#7C3AED]",
  },
};

/** Everything below the top pick: quiet, on-theme, not competing for attention. */
const DEFAULT_ACCENT = {
  label: "",
  strip: "bg-accent",
  border: "border-transparent",
  badgeBg: "bg-accent",
  badgeText: "text-primary",
};

const SORT_TABS: { mode: SortMode; label: string }[] = [
  { mode: "soonest", label: "Soonest" },
  { mode: "cheapest", label: "Cheapest" },
  { mode: "seats", label: "Most seats" },
];

function formatDuration(km: number) {
  const totalMinutes = Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function BusesPage() {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [pickup, setPickup] = useState<StoredPickup | null>(null);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("soonest");
  const [refreshKey, setRefreshKey] = useState(0);
  const [destinationSheetOpen, setDestinationSheetOpen] = useState(false);

  useEffect(() => {
    const destinationStored = sessionStorage.getItem("booklan_destination");
    const pickupStored = sessionStorage.getItem("booklan_pickup");
    if (!destinationStored) {
      router.replace("/search");
      return;
    }
    if (!pickupStored) {
      router.replace("/booking/pickup");
      return;
    }
    setDestination(destinationStored);
    setPickup(JSON.parse(pickupStored) as StoredPickup);
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
          setError("Couldn't load buses. Check your connection and try again.");
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

  function changeDestination(next: string) {
    setDestination(next);
    sessionStorage.setItem("booklan_destination", next);
  }

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

  const pickupName =
    pickup?.stationName ??
    pickup?.placeName ??
    (pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : "Your location");
  const accent = SORT_ACCENT[sortMode];

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-[188px]">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            // Explicitly to search, not back: Back led to the pin screen,
            // whose own Back led here, and the two trapped each other.
            onClick={() => router.push("/search")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[var(--shadow-float)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-[16px] font-semibold text-text-primary">
              Buses to {destination}
            </h1>
            <span className="text-[12px] text-text-secondary">
              {sortedTrips.length} available now
            </span>
          </div>
        </div>

        {/* From / to — both tappable */}
        <div className="mx-4 rounded-[12px] bg-white p-2 shadow-[var(--shadow-float)]">
          <button
            onClick={() => {
              // Tells the pin screen this is an edit, so its Back returns here.
              sessionStorage.setItem("booklan_pickup_edit", "1");
              router.push("/booking/pickup");
            }}
            className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-surface"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-surface">
              <Navigation className="h-3.5 w-3.5 text-text-secondary" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">FROM</span>
              <span className="truncate text-[14px] font-semibold text-text-primary">
                {pickupName}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
          </button>

          <div className="mx-2 h-px bg-border" />

          <button
            onClick={() => setDestinationSheetOpen(true)}
            className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-surface"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TO</span>
              <span className="truncate text-[14px] font-semibold text-primary">
                {destination}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
          </button>
        </div>

        {/* Sort tabs */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1 rounded-pill bg-white/70 p-1">
            {SORT_TABS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex-1 rounded-pill px-2 py-2 text-[12px] font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-white"
                    : "bg-white text-text-secondary hover:bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {loading && (
            <>
              <div className="h-56 w-full animate-pulse rounded-[16px] bg-white" />
              <div className="h-56 w-full animate-pulse rounded-[16px] bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && sortedTrips.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">
              No buses heading to {destination} right now.
            </p>
          )}

          {!loading &&
            !error &&
            sortedTrips.map((trip, index) => (
              <BusCard
                key={trip.id}
                trip={trip}
                accent={index === 0 ? accent : DEFAULT_ACCENT}
                topPick={index === 0}
                onSelect={() => selectTrip(trip)}
              />
            ))}
        </div>
      </div>

      {destinationSheetOpen && (
        <DestinationSheet
          current={destination}
          onSelect={changeDestination}
          onClose={() => setDestinationSheetOpen(false)}
        />
      )}

      <ActiveTripBanner />
    </div>
  );
}

function BusCard({
  trip,
  accent,
  topPick,
  onSelect,
}: {
  trip: ActiveTrip;
  accent: (typeof SORT_ACCENT)[SortMode] | typeof DEFAULT_ACCENT;
  topPick: boolean;
  onSelect: () => void;
}) {
  const companyName = trip.companies?.name ?? "Unknown company";
  const vehicleType = trip.companies?.vehicle_type ?? "bus";
  const profile = companyProfile(companyName);

  const price = trip.distance_km * trip.price_per_km;
  const lowSeats = trip.seats_available <= 3;

  return (
    <button
      onClick={onSelect}
      className={`relative w-full overflow-hidden rounded-[16px] bg-white text-left shadow-[var(--shadow-float)] transition-transform active:scale-[0.99] ${
        topPick ? `border-2 ${accent.border}` : "border border-transparent"
      }`}
    >
      {/* Category strip down the left edge. */}
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.strip}`} aria-hidden />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          <CompanyLogo name={companyName} size={40} />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[16px] font-semibold text-text-primary">
              {companyName}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-medium text-text-primary">{profile.rating}</span>
              <span className="capitalize">· {vehicleType}</span>
            </span>
          </div>

          <div
            className={`shrink-0 rounded-[12px] px-3 py-2 text-right ${accent.badgeBg}`}
          >
            {topPick && (
              <span
                className={`block text-[9px] font-bold tracking-[0.5px] ${accent.badgeText}`}
              >
                {accent.label}
              </span>
            )}
            <span className="block text-[20px] font-bold leading-tight text-primary">
              ${price.toFixed(2)}
            </span>
            <span className="block text-[10px] text-text-secondary">per seat</span>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <InfoChip
            icon={<MapPin className="h-3.5 w-3.5" />}
            text={`${trip.distance_km} km`}
            className="bg-surface text-text-secondary"
          />
          <InfoChip
            icon={<Clock className="h-3.5 w-3.5" />}
            text={formatDuration(trip.distance_km)}
            className="bg-surface text-text-secondary"
          />
          <InfoChip
            icon={<Users className="h-3.5 w-3.5" />}
            text={`${trip.seats_available} seats`}
            className={lowSeats ? "bg-[#FEF2F2] text-error" : "bg-surface text-text-secondary"}
          />
        </div>

      </div>
    </button>
  );
}

function InfoChip({
  icon,
  text,
  className,
}: {
  icon: React.ReactNode;
  text: string;
  className: string;
}) {
  return (
    <span
      className={`flex items-center justify-center gap-1 rounded-[10px] px-2 py-2 text-[11px] font-medium ${className}`}
    >
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}
