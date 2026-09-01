"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Building2, Check, MapPin } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";
import { PHNOM_PENH_DEPARTURE_STATIONS } from "@/constants/booking";
import { describePlace } from "@/lib/reverseGeocode";

const PickupMap = dynamic(() => import("@/components/PickupMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type OriginMode = "station" | "road";

export default function PickupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [originMode, setOriginMode] = useState<OriginMode>("road");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [roadName, setRoadName] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_trip");
    if (!stored) {
      router.replace("/search");
      return;
    }
    const mode = sessionStorage.getItem("booklan_origin_mode");
    if (mode === "station" || mode === "road") setOriginMode(mode);
    setReady(true);
  }, [router]);

  const handlePositionChange = useCallback(
    (next: [number, number], nextAllowed: boolean, nextRoad: string | null) => {
      setPosition(next);
      setAllowed(nextAllowed);
      setRoadName(nextRoad);
    },
    []
  );

  // Name the dropped pin so the booking reads "Krong Stueng Saen · National
  // Road 6" instead of raw coordinates. Debounced, since dragging fires often
  // and the geocoder is rate-limited.
  useEffect(() => {
    if (originMode !== "road" || !position) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const name = await describePlace(position[0], position[1], controller.signal);
      setPlaceName(name);
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [originMode, position]);

  function confirmRoadPickup() {
    if (!position || !allowed) return;
    sessionStorage.setItem(
      "booklan_pickup",
      JSON.stringify({
        lat: position[0],
        lng: position[1],
        placeName: placeName ?? roadName ?? undefined,
      })
    );
    router.push("/booking/buses");
  }

  function confirmStationPickup() {
    const station = PHNOM_PENH_DEPARTURE_STATIONS.find((s) => s.id === selectedStationId);
    if (!station) return;
    sessionStorage.setItem(
      "booklan_pickup",
      JSON.stringify({ lat: station.lat, lng: station.lng, stationName: station.name })
    );
    router.push("/booking/buses");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-28">
        <div className="flex items-center gap-3 px-4 pt-6 pb-3">
          <button
            onClick={() => router.push("/search")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <h1 className="text-[16px] font-semibold text-text-primary">
            {originMode === "station" ? "Where You'll Board" : "Confirm Pickup Location"}
          </h1>
        </div>

        {originMode === "station" ? (
          <>
            <p className="px-4 pb-3 text-[13px] leading-5 text-text-secondary">
              You&apos;re in Phnom Penh, where buses can&apos;t pull over on city streets — so
              pick a station to board from.{" "}
              <button
                onClick={() => setOriginMode("road")}
                className="font-semibold text-primary underline"
              >
                Drop a pin on the map instead
              </button>
            </p>

            <div className="flex flex-col gap-2.5 px-4">
              {PHNOM_PENH_DEPARTURE_STATIONS.map((station) => {
                const selected = selectedStationId === station.id;
                return (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    className={`flex items-center gap-3 rounded-card border p-4 text-left transition-colors ${
                      selected ? "border-primary bg-accent" : "border-border bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                        selected ? "bg-primary" : "bg-surface"
                      }`}
                    >
                      <Building2
                        className={`h-[18px] w-[18px] ${
                          selected ? "text-white" : "text-text-secondary"
                        }`}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-bold text-text-primary">
                        {station.name}
                      </span>
                      <span className="text-[13px] text-text-secondary">{station.address}</span>
                    </div>
                    {selected && (
                      <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto px-4 pt-8">
              <Button disabled={!selectedStationId} onClick={confirmStationPickup}>
                Confirm Departure Station
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="px-4 pb-3 text-[13px] leading-5 text-text-secondary">
              Drag the pin onto a green national road — that&apos;s where a bus can pull over
              for you.{" "}
              <button
                onClick={() => setOriginMode("station")}
                className="font-semibold text-primary underline"
              >
                Board at a Phnom Penh station instead
              </button>
            </p>

            <div className="px-4 pb-3">
              <div className="flex items-center gap-4 rounded-card border border-border bg-surface px-3 py-2 text-[12px] font-semibold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-success" /> Pickup allowed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-error" /> No pickup
                </span>
              </div>
            </div>

            <div className="h-[45vh] w-full overflow-hidden">
              <PickupMap onPositionChange={handlePositionChange} />
            </div>

            <div className="px-4 pt-4">
              {allowed ? (
                <div className="flex items-start gap-2 rounded-card border border-success/30 bg-success/10 px-3.5 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-text-primary">
                      {placeName ?? roadName ?? "Finding this place…"}
                    </span>
                    <span className="text-[12px] text-text-secondary">
                      {roadName ? `On ${roadName}` : "Locating you…"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-card border border-error/30 bg-error/10 px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-error">
                      Pickup not allowed here. Move pin to the main road.
                    </span>
                    {roadName && (
                      <span className="text-[12px] text-text-secondary">
                        The nearest one is {roadName}.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto px-4 pt-8">
              <Button disabled={!position || !allowed} onClick={confirmRoadPickup}>
                Confirm Pickup Location
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
