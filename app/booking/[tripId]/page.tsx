"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bus, Check, ChevronRight, MapPin, Star, X } from "lucide-react";
import Button from "@/components/Button";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import CompanyPhotos from "@/components/CompanyPhotos";
import ErrorState from "@/components/ErrorState";
import SeatMap from "@/components/SeatMap";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH, SERVICE_FEE_USD } from "@/constants/booking";
import { companyProfile } from "@/constants/companyProfile";

type VehicleType = "bus" | "van";

type TripDetail = {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  seats_total: number;
  seats_available: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredPickup = { lat: number; lng: number; stationName?: string; placeName?: string };

type Review = { id: string; rating: number; comment: string | null; users: { name: string | null } | null };

/** Height of the sticky action bar, so scrolled content never hides under it. */
const ACTION_BAR_HEIGHT = 92;

export default function BusDetailPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [pickup, setPickup] = useState<StoredPickup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatSheetOpen, setSeatSheetOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_pickup");
    if (stored) setPickup(JSON.parse(stored));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("active_trips")
          .select(
            "id, company_id, origin, destination, distance_km, price_per_km, seats_total, seats_available, companies(name, vehicle_type)"
          )
          .eq("id", tripId)
          .single()
      );

      if (!cancelled) {
        if (fetchError || !data) {
          setError("Couldn't load this trip. It may no longer be available.");
        } else {
          setTrip(data as unknown as TripDetail);
        }
        setLoading(false);
      }
    }

    loadTrip();
    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  // Real passenger reviews, once any exist for this company.
  useEffect(() => {
    if (!trip?.company_id) return;
    let cancelled = false;

    (async () => {
      const { data } = await safeQuery(
        supabase
          .from("reviews")
          .select("id, rating, comment, users(name)")
          .eq("company_id", trip.company_id)
          .order("created_at", { ascending: false })
          .limit(3)
      );
      if (!cancelled) setReviews((data as unknown as Review[]) ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [trip?.company_id]);

  const companyName = trip?.companies?.name ?? "Unknown company";
  const vehicleType = trip?.companies?.vehicle_type ?? "bus";
  const profile = companyProfile(companyName);

  const pricePerSeat = trip ? trip.distance_km * trip.price_per_km : 0;
  const totalPrice = pricePerSeat * selectedSeats.length + SERVICE_FEE_USD;
  const etaMinutes = trip ? Math.round((trip.distance_km / AVG_SPEED_KMH) * 60) : 0;

  function toggleSeat(seat: number) {
    setSelectedSeats((current) => {
      if (current.includes(seat)) return current.filter((s) => s !== seat);
      if (!trip || current.length >= trip.seats_available) return current;
      return [...current, seat].sort((a, b) => a - b);
    });
  }

  function handleConfirmSeats() {
    if (selectedSeats.length === 0) return;
    sessionStorage.setItem(
      "booklan_seat",
      JSON.stringify({ seatNumbers: selectedSeats, totalPrice })
    );
    router.push(`/booking/${tripId}/dropoff`);
  }

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

  if (error || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[390px] flex-1 flex-col">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
          </div>
          <ErrorState
            message={error ?? "Couldn't load this trip."}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="relative flex w-full max-w-[390px] flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[var(--shadow-float)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-[16px] font-semibold text-text-primary">
              {companyName}
            </h1>
            <span className="text-[12px] text-text-secondary">
              {trip.origin} → {trip.destination}
            </span>
          </div>
          <span className="shrink-0 rounded-pill bg-accent px-3 py-1.5 text-[12px] font-semibold text-primary">
            {trip.seats_available} seats
          </span>
        </div>

        {/* Content scrolls on its own and stops short of the sticky bar. */}
        <div
          className="flex flex-col gap-4 overflow-y-auto px-4"
          style={{ paddingBottom: ACTION_BAR_HEIGHT + NAV_CLEARANCE }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <CompanyLogo name={companyName} size={44} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[16px] font-semibold text-text-primary">
                  {companyName}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="font-medium text-text-primary">{profile.rating}</span>
                  <span>· {profile.tripCount} trips</span>
                </span>
              </div>
              <VehicleBadge type={vehicleType} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface">
                <MapPin className="h-4 w-4 text-text-secondary" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12px] text-text-secondary">Pickup point</span>
                <span className="truncate text-[14px] font-medium text-text-primary">
                  {pickup?.stationName ??
                    pickup?.placeName ??
                    (pickup
                      ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`
                      : "Not set yet")}
                </span>
              </div>
            </div>

            <div className="my-3 h-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12px] text-text-secondary">Destination</span>
                <span className="truncate text-[14px] font-medium text-text-primary">
                  {trip.destination}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <InfoBox label="ETA" value={`${etaMinutes} min`} />
            <InfoBox label="Distance" value={`${trip.distance_km} km`} />
            <InfoBox label="Price" value={`$${pricePerSeat.toFixed(2)}`} emphasis />
          </div>

          <Card>
            <span className="text-[16px] font-semibold text-text-primary">Photos</span>
            <CompanyPhotos name={companyName} />
          </Card>

          <Card>
            <span className="text-[16px] font-semibold text-text-primary">Ratings &amp; Reviews</span>
            <div className="mt-3 flex flex-col gap-3">
              {(reviews && reviews.length > 0
                ? reviews.map((r) => ({
                    author: r.users?.name || "Passenger",
                    stars: r.rating,
                    text: r.comment || "Rated this trip.",
                  }))
                : profile.reviews
              ).map((review, i) => (
                <div key={`${review.author}-${i}`} className="rounded-[12px] bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[14px] font-medium text-text-primary">
                      {review.author}
                    </span>
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.stars ? "fill-warning text-warning" : "text-border"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-text-secondary">{review.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <span className="text-[16px] font-semibold text-text-primary">Policies</span>
            <ul className="mt-3 flex flex-col gap-3">
              {profile.policies.map((policy) => (
                <li key={policy} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
                    strokeWidth={2.5}
                  />
                  <span className="text-[12px] text-text-secondary">{policy}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sticky action bar: always visible, content never renders beneath it. */}
        <div
          className="fixed inset-x-0 z-20 mx-auto w-full max-w-[390px] px-4"
          style={{ bottom: NAV_CLEARANCE }}
        >
          <button
            onClick={() => setSeatSheetOpen(true)}
            className="flex w-full items-center gap-3 rounded-[12px] bg-primary p-4 text-left shadow-[var(--shadow-float)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/15">
              <Bus className="h-5 w-5 text-white" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-[14px] font-semibold text-white">Select Your Seats</span>
              <span className="text-[12px] text-white/70">
                {selectedSeats.length > 0
                  ? `${selectedSeats.length} selected · $${totalPrice.toFixed(2)}`
                  : "Pick from the vehicle layout"}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-white" />
          </button>
        </div>
      </div>

      {seatSheetOpen && (
        <div
          // Above the nav, or the nav paints over the confirm button.
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setSeatSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[88vh] max-h-[88vh] w-full max-w-[390px] animate-[slide-up_0.25s_ease-out] flex-col rounded-t-[24px] bg-white"
          >
            <div className="flex items-start justify-between px-4 pt-4">
              <div className="flex flex-col">
                <h2 className="text-[16px] font-semibold text-text-primary">Select Seats</h2>
                <span className="text-[12px] text-text-secondary">
                  {companyName} · {trip.seats_total} seats total
                </span>
              </div>
              <button
                onClick={() => setSeatSheetOpen(false)}
                aria-label="Close seat selection"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-surface"
              >
                <X className="h-3.5 w-3.5 text-text-primary" strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4">
              <SeatMap
                seatsTotal={trip.seats_total}
                seatsAvailable={trip.seats_available}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
                seedKey={tripId}
              />
            </div>

            <div className="border-t border-border p-4 pb-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[12px] text-text-secondary">Selected seats</span>
                  <span
                    className={`text-[14px] font-medium ${
                      selectedSeats.length ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {selectedSeats.length ? selectedSeats.join(", ") : "None selected"}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] text-text-secondary">Subtotal</span>
                  <span className="text-[20px] font-bold text-primary">
                    ${selectedSeats.length ? totalPrice.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>
              <Button disabled={selectedSeats.length === 0} onClick={handleConfirmSeats}>
                {selectedSeats.length === 0
                  ? "Select at least 1 seat"
                  : `Confirm ${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">{children}</div>
  );
}

function InfoBox({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
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
