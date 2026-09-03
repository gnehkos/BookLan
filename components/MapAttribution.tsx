"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { TILE_ATTRIBUTION } from "@/lib/mapTheme";

/**
 * Map credits, behind a small ⓘ the way phone map apps do it.
 *
 * The credits are a licensing condition, not decoration: OpenStreetMap's data
 * is under the ODbL, and Stadia Maps and OpenMapTiles both require the notice
 * in their terms. So this collapses it — it never removes it. The button is
 * always visible, and the text is one tap away and readable.
 *
 * Leaflet's own "Leaflet" prefix is dropped, since no licence asks for it.
 */
export default function MapAttribution() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-1.5 right-1.5 z-[900] flex items-end gap-1">
      {open && (
        <span className="max-w-[236px] rounded-[7px] bg-white/85 px-2 py-1 text-[9px] leading-[13px] text-text-secondary backdrop-blur-sm">
          {TILE_ATTRIBUTION}
        </span>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Hide map credits" : "Map credits"}
        aria-expanded={open}
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/85 text-text-muted backdrop-blur-sm transition-colors hover:text-text-secondary"
      >
        <Info className="h-3 w-3" />
      </button>
    </div>
  );
}
