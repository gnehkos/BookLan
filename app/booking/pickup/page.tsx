"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, MapPin } from "lucide-react";
import Button from "@/components/Button";
import { describePlace } from "@/lib/reverseGeocode";
import { roadsFor } from "@/lib/geo";
import { useMeasuredHeight } from "@/lib/useMeasuredHeight";
import { useT, useProvinceName } from "@/lib/i18n";

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
  const p = useProvinceName();
  const router = useRouter();
  const t = useT();
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [roadName, setRoadName] = useState<string | null>(null);
  const [sheetRef, sheetHeight] = useMeasuredHeight<HTMLDivElement>(140);
  // The pin already chosen, so the map opens on it rather than on the device.
  const [existing, setExisting] = useState<[number, number] | null>(null);
  // Whether this screen was opened to change that pin, which is the only case
  // where Back belongs on the bus list.
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("booklan_destination");
    if (!stored) {
      router.replace("/search");
      return;
    }
    setDestination(stored);

    // Read once and cleared: arriving here any other way is a fresh pin, even
    // if a previous pickup is still in session.
    if (sessionStorage.getItem("booklan_pickup_edit") === "1") {
      sessionStorage.removeItem("booklan_pickup_edit");
      setEditing(true);
    }

    const pinned = sessionStorage.getItem("booklan_pickup");
    if (pinned) {
      try {
        const parsed = JSON.parse(pinned) as { lat: number; lng: number };
        setExisting([parsed.lat, parsed.lng]);
      } catch {
        // Malformed leftover; fall through to a fresh pin.
      }
    }

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
            destination={p(destination)}
            initialPosition={existing}
            onPositionChange={handlePositionChange}
            bottomInset={sheetHeight}
          />
        </div>

        {/* Floating instruction bar */}
        <div className="absolute inset-x-4 top-5 z-20">
          <div className="glass glass-solid flex items-center gap-3 rounded-[16px] px-3.5 py-3">
            <button
              onClick={() => router.push(editing ? "/booking/buses" : "/search")}
              aria-label={t("common.back")}
              className="shrink-0 text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-extrabold text-text-primary">{t("pickup.title")}</span>
              <span className="truncate text-[11px] text-text-muted">{t("pickup.subtitle")}</span>
            </div>
          </div>
        </div>

        {/* Zone legend */}
        <div className="glass glass-solid absolute left-4 top-[104px] z-20 flex w-[158px] flex-col gap-2.5 rounded-[14px] px-3.5 py-3">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.6px] text-text-muted">{t("pickup.zones")}</span>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#DCFCE7]">
              <CheckCircle2 className="h-3 w-3 text-success" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">{t("pickup.allowed")}</span>
              <span className="truncate text-[9px] font-medium text-text-muted">
                {t("pickup.onRoad", { road: roadLabel })}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-[#FEE2E2]">
              <Ban className="h-3 w-3 text-error" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-bold text-text-primary">{t("pickup.notAllowed")}</span>
              <span className="text-[9px] font-medium text-text-muted">{t("pickup.otherRoads")}</span>
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
                {allowed ? (placeName ?? roadName ?? t("pickup.finding")) : t("pickup.cannotHere")}
              </span>
              <span
                className={`truncate text-[11.5px] leading-tight ${
                  allowed ? "text-text-secondary" : "text-error/80"
                }`}
              >
                {allowed
                  ? roadName
                    ? t("pickup.onRoad", { road: roadName })
                    : "Pickup allowed here"
                  : t("pickup.wontPass", { destination: p(destination) })}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <Button disabled={!position || !allowed} onClick={confirmPickup}>
              {allowed ? t("pickup.confirm") : t("pickup.moveOnto", { road: roadLabel })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
