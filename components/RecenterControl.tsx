"use client";

import { useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";

/**
 * Replaces Leaflet's default zoom buttons: a floating circular button that pans
 * back to a target. `bottomOffset` lifts it clear of whatever floating panel
 * the screen has, so it never ends up buried underneath one.
 */
export default function RecenterControl({
  target,
  zoom = 14,
  label = "Recenter map",
  bottomOffset = 16,
  onPress,
}: {
  target: [number, number] | null;
  zoom?: number;
  label?: string;
  bottomOffset?: number;
  /** Fires alongside the fly — used to re-read the device's location first. */
  onPress?: () => void;
}) {
  const map = useMap();

  if (!target) return null;

  return (
    <button
      type="button"
      aria-label={label}
      style={{ bottom: bottomOffset }}
      onClick={(e) => {
        e.stopPropagation();
        onPress?.();
        map.flyTo(target, zoom, { duration: 0.8 });
      }}
      className="absolute right-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-[var(--shadow-float)] transition-colors hover:bg-surface"
    >
      <LocateFixed className="h-[18px] w-[18px] text-primary" />
    </button>
  );
}
