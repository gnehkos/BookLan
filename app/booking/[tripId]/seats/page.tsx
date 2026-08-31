"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import SeatMap from "@/components/SeatMap";
import { safeQuery, supabase } from "@/lib/supabase";
import { SERVICE_FEE_USD } from "@/constants/booking";

type VehicleType = "bus" | "van";

type TripDetail = {
  id: string;
  destination: string;
  origin: string;
  distance_km: number;
  price_per_km: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

export default function SeatsPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("active_trips")
          .select(
            "id, destination, origin, distance_km, price_per_km, companies(name, vehicle_type)"
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

  const vehicleType = trip?.companies?.vehicle_type ?? "bus";

  const basePrice = trip ? trip.distance_km * trip.price_per_km : 0;
  const totalPrice = basePrice + SERVICE_FEE_USD;

  function handleContinue() {
    if (!selectedSeat) return;
    sessionStorage.setItem(
      "booklan_seat",
      JSON.stringify({ seatNumber: selectedSeat, totalPrice })
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
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-text-primary">
              {trip.companies?.name ?? "Unknown company"}
            </h1>
            <span className="text-[13px] text-text-secondary">
              {trip.origin} → {trip.destination} · {trip.distance_km} km
            </span>
          </div>
        </div>

        <div className="mx-4 flex flex-col gap-1.5 rounded-card bg-surface p-4">
          <div className="flex items-center justify-between text-[13px] text-text-secondary">
            <span>
              {trip.distance_km} km × ${trip.price_per_km.toFixed(2)}/km
            </span>
            <span>${basePrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-text-secondary">
            <span>Service fee</span>
            <span>${SERVICE_FEE_USD.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-[15px] font-bold text-text-primary">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 px-4">
          <SeatMap
            vehicleType={vehicleType}
            selectedSeat={selectedSeat}
            onSelect={setSelectedSeat}
            seedKey={tripId}
          />
        </div>

        {selectedSeat && (
          <div className="mt-auto px-4 pt-8">
            <Button onClick={handleContinue}>Choose Drop-off Station</Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
