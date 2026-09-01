"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import { safeQuery, supabase } from "@/lib/supabase";

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type Station = {
  id: string;
  name: string;
  address: string;
  province: string;
  lat: number;
  lng: number;
};

export default function DropoffPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const seatStored = sessionStorage.getItem("booklan_seat");
    if (!seatStored) {
      router.replace(`/booking/${tripId}`);
      return;
    }
  }, [router, tripId]);

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      setLoading(true);
      setError(null);

      const { data: trip, error: tripError } = await safeQuery(
        supabase.from("active_trips").select("company_id, destination").eq("id", tripId).single()
      );

      if (cancelled) return;

      if (tripError || !trip) {
        setError("Couldn't load this trip's drop-off stations.");
        setLoading(false);
        return;
      }

      const { data, error: stationsError } = await safeQuery(
        supabase
          .from("stations")
          .select("id, name, address, province, lat, lng")
          .eq("company_id", trip.company_id)
          .eq("province", trip.destination)
      );

      if (!cancelled) {
        if (stationsError) {
          setError("Couldn't load drop-off stations. Check your connection and try again.");
        } else {
          setStations((data as Station[]) ?? []);
        }
        setLoading(false);
      }
    }

    loadStations();
    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  function handleConfirm() {
    const station = stations.find((s) => s.id === selectedStationId);
    if (!station) return;
    sessionStorage.setItem(
      "booklan_dropoff",
      JSON.stringify({
        id: station.id,
        name: station.name,
        address: station.address,
      })
    );
    router.push(`/booking/${tripId}/summary`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-semibold text-text-primary">Choose Drop-off Station</h1>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {loading && (
            <>
              <div className="h-32 w-full animate-pulse rounded-[12px] bg-white" />
              <div className="h-32 w-full animate-pulse rounded-[12px] bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && stations.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">
              No drop-off stations available for this route.
            </p>
          )}

          {!loading &&
            !error &&
            stations.map((station) => {
              const selected = selectedStationId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedStationId(station.id)}
                  className={`flex flex-col overflow-hidden rounded-card bg-white text-left shadow-sm transition-colors ${
                    selected ? "border-2 border-primary" : "border border-transparent"
                  }`}
                >
                  <div className="h-28 w-full">
                    <StationMap lat={station.lat} lng={station.lng} />
                  </div>
                  <div className="flex flex-col gap-0.5 p-4">
                    <span className="text-[15px] font-semibold text-text-primary">
                      {station.name}
                    </span>
                    <span className="text-[13px] text-text-secondary">{station.address}</span>
                  </div>
                </button>
              );
            })}
        </div>

        {selectedStationId && (
          <div className="mt-auto px-4 pt-8">
            <Button onClick={handleConfirm}>Confirm</Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
