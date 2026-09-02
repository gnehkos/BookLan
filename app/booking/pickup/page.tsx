"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, MapPin } from "lucide-react";
import Button from "@/components/Button";
import { describePlace } from "@/lib/reverseGeocode";
import { roadsFor } from "@/lib/geo";
import { useMeasuredHeight } from "@/lib/useMeasuredHeight";

const PickupMap = dynamic(() => import("@/components/PickupMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

/**
 * Drop the pin where the bus will actually pass.
 *
 * Only the roads that serve the chosen destination are valid — a Siem Reap bus
 * runs National Road 6 and will never pass someone waiting on National Road 2 —
 * so the map draws just those corridors and gates the pin against them.
 *
 * Deliberately no bottom nav: this is a focused step inside the booking flow.
 */
export default function PickupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [roadName, setRoadName] = useState<string | null>(null);
  const [sheetRef, sheetHeight] = useMeasuredHeight<HTMLDivElement>(240);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_destination");
    if (!stored) {
      router.replace("/search");
      return;
    }
    setDestination(stored);
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

  // Name the pin so the booking reads "Baray · National Road 6" rather than raw
  // coordinates. Debounced, since dragging fires often and the geocoder is
  // rate-limited.
  useEffect(() => {
    if (!position) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const name = await describePlace(position[0], position[1], controller.signal);
      setPlaceName(name);
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position]);

  function confirmPickup() {
    if (!position || !allowed || !destination) return;
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

  if (!ready || !destination) return null;

  const roads = roadsFor(destination);
  const roadLabel = roads.map((road) => road.id).join(" / ");

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[393px] overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <PickupMap
            destination={destination}
            onPositionChange={handlePositionChange}
            bottomInset={sheetHeight}
          />
        </div>

        {/* Floating instruction bar */}
        <div className="absolute inset-x-4 top-5 z-20">
          <div className="glass glass-solid flex items-center gap-3 rounded-[16px] px-3.5 py-3">
            <button
              onClick={() => router.push("/search")}
              aria-label="Back"
              className="shrink-0 text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-extrabold text-text-primary">
                Set your pickup point
              </span>
              <span className="truncate text-[11px] text-text-muted">
                Drag the pin, or long-press anywhere on the map
              </span>
            </div>
          </div>
        </div>

        {/* Zone legend */}
        <div className="glass glass-solid absolute left-4 top-[104px] z-20 flex w-[158px] flex-col gap-2.5 rounded-[14px] px-3.5 py-3">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.6px] text-text-muted">
            Pickup zones
          </span>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#DCFCE7]">
              <CheckCircle2 className="h-3 w-3 text-success" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">Pickup allowed</span>
              <span className="truncate text-[9px] font-medium text-text-muted">
                On {roadLabel}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#FEE2E2]">
              <Ban className="h-3 w-3 text-error" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">No pickup</span>
              <span className="text-[9px] font-medium text-text-muted">
                Any other road
              </span>
            </span>
          </div>
        </div>

        {/* Bottom sheet, kept deliberately short so the map stays readable */}
        <div
          ref={sheetRef}
          className="glass glass-solid absolute inset-x-4 bottom-4 z-20 rounded-[22px] px-4 py-3.5"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                allowed ? "bg-accent" : "bg-[#FEF2F2]"
              }`}
            >
              <MapPin className={`h-4 w-4 ${allowed ? "text-secondary" : "text-error"}`} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`truncate text-[13.5px] font-bold leading-tight ${
                  allowed ? "text-text-primary" : "text-error"
                }`}
              >
                {allowed ? (placeName ?? roadName ?? "Finding this place…") : "Can't be picked up here"}
              </span>
              <span
                className={`truncate text-[11.5px] leading-tight ${
                  allowed ? "text-text-secondary" : "text-error/80"
                }`}
              >
                {allowed
                  ? roadName
                    ? `On ${roadName}`
                    : "Pickup allowed here"
                  : `Buses to ${destination} don't pass this spot`}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <Button disabled={!position || !allowed} onClick={confirmPickup}>
              {allowed ? "Confirm pickup location" : `Move pin onto ${roadLabel}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
