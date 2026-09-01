"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bus, Check, ChevronRight, MapPin, Star, X } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import SeatMap from "@/components/SeatMap";
import { safeQuery, supabase } from "@/lib/supabase";
import { AVG_SPEED_KMH, SERVICE_FEE_USD } from "@/constants/booking";
import { companyProfile } from "@/constants/companyProfile";

type VehicleType = "bus" | "van";

type TripDetail = {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  seats_total: number;
  seats_available: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredPickup = { lat: number; lng: number; stationName?: string };

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
            "id, origin, destination, distance_km, price_per_km, seats_total, seats_available, companies(name, vehicle_type)"
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
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6 pb-24">
          <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
            >
              <ArrowLeft className="h-6 w-6 text-text-primary" />
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
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-40">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex flex-1 flex-col">
            <h1 className="text-[18px] font-extrabold text-text-primary">{companyName}</h1>
            <span className="text-[13px] capitalize text-text-muted">
              {vehicleType} · {trip.origin} → {trip.destination}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 text-[12px] font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-[3px] bg-success" />
            {trip.seats_available} seats
          </span>
        </div>

        <div className="mx-5 overflow-hidden rounded-[18px] border border-border bg-surface">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#eff6ff]">
              <MapPin className="h-[13px] w-[13px] text-secondary" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                PICKUP POINT
              </span>
              <span className="text-[13px] font-bold text-text-primary">
                {pickup?.stationName ??
                  (pickup
                    ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`
                    : "Not set yet")}
              </span>
            </div>
          </div>

          <div className="mx-4 h-px bg-border" />

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent">
              <MapPin className="h-[13px] w-[13px] text-primary" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                DESTINATION
              </span>
              <span className="text-[14px] font-bold text-primary">{trip.destination}</span>
            </div>
          </div>
        </div>

        <div className="mx-5 mt-4 grid grid-cols-3 gap-2.5">
          <InfoBox label="ETA" value={`${etaMinutes} min`} valueClass="text-warning" />
          <InfoBox
            label="Distance"
            value={`${trip.distance_km} km`}
            valueClass="text-text-secondary"
          />
          <InfoBox
            label="Price"
            value={`$${pricePerSeat.toFixed(2)}`}
            valueClass="text-primary"
          />
        </div>

        <div className="mx-5 mt-6 flex items-center gap-3">
          <div className="flex flex-1 flex-col">
            <span className="text-[14px] font-extrabold text-text-primary">{companyName}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Star className="h-[11px] w-[11px] fill-warning text-warning" />
              <span className="text-[12px] font-bold text-text-primary">{profile.rating}</span>
              · {profile.tripCount} trips
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 px-5">
          {profile.amenities.map((amenity) => (
            <div
              key={amenity.label}
              className="flex-1 rounded-[10px] border border-border bg-surface py-2 text-center"
            >
              <span className={`text-[11px] font-bold ${amenity.colorClass}`}>
                {amenity.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex h-[110px] w-[174px] shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-accent to-surface"
            >
              <Bus className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
            </div>
          ))}
        </div>

        <h2 className="mt-5 px-5 text-[13px] font-extrabold text-text-primary">
          Ratings &amp; Reviews
        </h2>

        <div className="mt-2.5 flex flex-col gap-2 px-5">
          {profile.reviews.map((review) => (
            <div
              key={review.author}
              className="flex flex-col gap-1.5 rounded-[12px] border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[13px] bg-accent">
                  <span className="text-[12px] font-extrabold text-primary">
                    {review.author.charAt(0)}
                  </span>
                </div>
                <span className="flex-1 text-[13px] font-bold text-text-primary">
                  {review.author}
                </span>
                <span className="flex gap-px">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-[11px] w-[11px] ${
                        i < review.stars ? "fill-warning text-warning" : "text-border"
                      }`}
                    />
                  ))}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary">{review.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-5 px-5 text-[13px] font-extrabold text-text-primary">Policies</h2>
        <ul className="mt-2 flex flex-col gap-2 px-5">
          {profile.policies.map((policy) => (
            <li key={policy} className="flex items-start gap-2">
              <Check className="mt-0.5 h-[15px] w-[15px] shrink-0 text-success" strokeWidth={2.5} />
              <span className="text-[12px] text-text-secondary">{policy}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed bottom-[92px] left-1/2 z-10 w-full max-w-[390px] -translate-x-1/2 px-5">
        <button
          onClick={() => setSeatSheetOpen(true)}
          className="flex w-full items-center gap-3.5 rounded-card bg-gradient-to-b from-primary to-primary-dark p-4 text-left shadow-[0_6px_16px_rgba(26,58,92,0.3)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/15">
            <Bus className="h-5 w-5 text-white" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-[15px] font-extrabold text-white">Select Your Seats</span>
            <span className="text-[12px] text-white/75">
              {selectedSeats.length > 0
                ? `${selectedSeats.length} selected · $${totalPrice.toFixed(2)}`
                : "Pick from the vehicle layout"}
            </span>
          </span>
          <ChevronRight className="h-[18px] w-[18px] shrink-0 text-white" />
        </button>
      </div>

      {seatSheetOpen && (
        <div
          // Above the bottom nav (z-30), or the nav paints over the confirm button.
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setSeatSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[60vh] w-full max-w-[390px] animate-[slide-up_0.25s_ease-out] flex-col rounded-t-[28px] bg-white"
          >
            <div className="flex items-start justify-between px-5 pt-5">
              <div className="flex flex-col">
                <h2 className="text-[18px] font-extrabold tracking-[-0.3px] text-text-primary">
                  Select Seats
                </h2>
                <span className="text-[12px] text-text-muted">
                  {companyName} · {vehicleType} · {trip.seats_total} seats total
                </span>
              </div>
              <button
                onClick={() => setSeatSheetOpen(false)}
                aria-label="Close seat selection"
                className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-surface"
              >
                <X className="h-3.5 w-3.5 text-text-primary" strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4">
              <SeatMap
                seatsTotal={trip.seats_total}
                seatsAvailable={trip.seats_available}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
                seedKey={tripId}
              />
            </div>

            <div className="border-t border-border px-5 pb-6 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-text-muted">Selected seats</span>
                  <span
                    className={`text-[14px] font-bold ${
                      selectedSeats.length ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {selectedSeats.length ? selectedSeats.join(", ") : "None selected"}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-semibold text-text-muted">Subtotal</span>
                  <span className="text-[16px] font-extrabold text-primary">
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

function InfoBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-[14px] border border-border bg-surface px-2.5 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-text-muted">
        {label}
      </span>
      <span className={`text-[14px] font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}
