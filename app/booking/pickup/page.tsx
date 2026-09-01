"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Building2, Check, CheckCircle2, MapPin } from "lucide-react";
import Button from "@/components/Button";
import BottomNav, { NAV_CLEARANCE } from "@/components/BottomNav";
import { PHNOM_PENH_DEPARTURE_STATIONS } from "@/constants/booking";
import { describePlace } from "@/lib/reverseGeocode";
import { useMeasuredHeight } from "@/lib/useMeasuredHeight";

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
  const [sheetRef, sheetHeight] = useMeasuredHeight<HTMLDivElement>(240);

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

  // --- Station mode: no road to pin on inside the city ---------------------
  if (originMode === "station") {
    return (
      <div className="flex min-h-screen flex-col items-center bg-surface">
        <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
          <div className="flex items-center gap-3 bg-white px-4 pt-6 pb-3">
            <button
              onClick={() => router.push("/search")}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
            <h1 className="text-[16px] font-semibold text-text-primary">Where you&apos;ll board</h1>
          </div>

          <p className="bg-white px-4 pb-4 text-[13px] leading-5 text-text-secondary">
            You&apos;re in Phnom Penh, where buses can&apos;t pull over on city streets — so pick
            a station to board from.{" "}
            <button
              onClick={() => setOriginMode("road")}
              className="font-semibold text-primary underline"
            >
              Drop a pin instead
            </button>
          </p>

          <div className="flex flex-col gap-2.5 px-4 pt-4">
            {PHNOM_PENH_DEPARTURE_STATIONS.map((station) => {
              const selected = selectedStationId === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedStationId(station.id)}
                  className={`flex items-center gap-3 rounded-[12px] border p-4 text-left transition-colors ${
                    selected
                      ? "border-primary bg-accent"
                      : "border-transparent bg-white shadow-[var(--shadow-float)]"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                      selected ? "bg-primary" : "bg-surface"
                    }`}
                  >
                    <Building2
                      className={`h-[18px] w-[18px] ${
                        selected ? "text-white" : "text-text-secondary"
                      }`}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14px] font-semibold text-text-primary">
                      {station.name}
                    </span>
                    <span className="truncate text-[12px] text-text-secondary">
                      {station.address}
                    </span>
                  </span>
                  {selected && <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>

          <div className="mt-auto px-4 pt-8">
            <Button disabled={!selectedStationId} onClick={confirmStationPickup}>
              Confirm departure station
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // --- Road mode: full-bleed map with everything floating over it ----------
  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[393px] overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <PickupMap onPositionChange={handlePositionChange} bottomInset={sheetHeight} />
        </div>

        {/* Floating instruction bar */}
        <div className="absolute inset-x-4 top-5 z-20">
          <div className="flex items-center gap-3 rounded-[16px] bg-white px-3.5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
            <button
              onClick={() => router.push("/search")}
              aria-label="Back"
              className="shrink-0 text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-extrabold text-text-primary">
                Drag to set your pickup
              </span>
              <span className="truncate text-[11px] text-text-muted">
                Move the map — pin drops on the road
              </span>
            </div>
          </div>
        </div>

        {/* Zone legend */}
        <div className="absolute left-4 top-[104px] z-20 flex w-[150px] flex-col gap-2.5 rounded-[14px] border border-[#f1f5f9] bg-white px-3.5 py-3 shadow-[0_4px_8px_rgba(0,0,0,0.12)]">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.6px] text-text-muted">
            Pickup zones
          </span>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#DCFCE7]">
              <CheckCircle2 className="h-3 w-3 text-success" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">Pickup allowed</span>
              <span className="text-[9px] font-medium text-text-muted">On the main road</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#FEE2E2]">
              <Ban className="h-3 w-3 text-error" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">No pickup</span>
              <span className="text-[9px] font-medium text-text-muted">Village / highway</span>
            </span>
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className="absolute inset-x-4 z-20 rounded-[24px] border border-border bg-white px-5 pb-5 pt-4 shadow-[0_10px_20px_rgba(13,17,23,0.2),0_2px_4px_rgba(13,17,23,0.08)]"
          style={{ bottom: NAV_CLEARANCE + 8 }}
        >
          <span className="mx-auto mb-4 block h-1 w-10 rounded-[2px] bg-border" />

          <span className="block text-[12px] font-bold text-text-muted">PICKUP POINT</span>

          <div
            className={`mt-2 flex items-center gap-3 rounded-[14px] border px-4 py-3.5 ${
              allowed
                ? "border-[#BBF7D0] bg-[#F0FDF4]"
                : "border-[#FECACA] bg-[#FEF2F2]"
            }`}
          >
            <MapPin
              className={`h-4 w-4 shrink-0 ${allowed ? "text-success" : "text-error"}`}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`truncate text-[14px] font-bold ${
                  allowed ? "text-text-primary" : "text-error"
                }`}
              >
                {allowed
                  ? (placeName ?? roadName ?? "Finding this place…")
                  : "Off the main road"}
              </span>
              <span
                className={`truncate text-[12px] ${
                  allowed ? "text-text-secondary" : "text-error"
                }`}
              >
                {allowed
                  ? roadName
                    ? `On ${roadName}`
                    : "Pickup allowed here"
                  : "Pinning off a national road isn't allowed"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button disabled={!position || !allowed} onClick={confirmRoadPickup}>
              {allowed ? "Confirm pickup location" : "Move pin to an allowed road"}
            </Button>
          </div>

          <button
            onClick={() => setOriginMode("station")}
            className="mt-2 w-full py-1 text-center text-[12px] font-semibold text-text-muted"
          >
            Board at a Phnom Penh station instead
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
