"use client";

import { useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";

/**
 * Replaces Leaflet's default zoom buttons: a floating circular button that
 * pans back to a target. Rendered inside the map container, so it sits above
 * the tiles but below the app's own floating panels.
 */
export default function RecenterControl({
  target,
  zoom = 14,
  label = "Recenter map",
}: {
  target: [number, number] | null;
  zoom?: number;
  label?: string;
}) {
  const map = useMap();

  if (!target) return null;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        map.flyTo(target, zoom, { duration: 0.6 });
      }}
      className="absolute bottom-4 right-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-[var(--shadow-float)] transition-colors hover:bg-surface"
    >
      <LocateFixed className="h-[18px] w-[18px] text-primary" />
    </button>
  );
}
