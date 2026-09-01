import L from "leaflet";
import { colors } from "@/constants/theme";

/**
 * Shared Leaflet look-and-feel. Every map in the app pulls its tiles and
 * markers from here so they stay visually identical — the supporting CSS
 * (`.booklan-*` classes) lives in app/globals.css because Leaflet injects
 * marker markup as raw HTML outside React.
 */

/**
 * Base map tiles.
 *
 * Standard OpenStreetMap by default: keyless, and it renders clean. CARTO's
 * Positron looked better under our navy UI, but CARTO now watermarks
 * "API KEY REQUIRED" across unauthenticated tiles, so it can't be used bare.
 *
 * To go back to Positron (or any keyed provider), set NEXT_PUBLIC_MAP_TILE_URL
 * and NEXT_PUBLIC_MAP_ATTRIBUTION — no code change needed. For a free CARTO
 * key that would be:
 *   NEXT_PUBLIC_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=YOUR_KEY
 */
export const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "© OpenStreetMap contributors";

export const userIcon = L.divIcon({
  className: "",
  html: `<div class="booklan-user-marker">
      <span class="booklan-user-pulse"></span>
      <span class="booklan-user-dot"></span>
      <span class="booklan-user-label">You</span>
    </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char
  );
}

/** White circle with a navy ring and the company's initial. */
export function vehicleIcon(companyName: string) {
  const initial = escapeHtml((companyName || "?").charAt(0).toUpperCase());
  return L.divIcon({
    className: "",
    html: `<div class="booklan-pin">${initial}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

/** Teardrop pin for a draggable pickup point; green when the spot is valid. */
export function dropPinIcon(allowed: boolean) {
  const fill = allowed ? colors.success : colors.error;
  return L.divIcon({
    className: "",
    html: `<div class="booklan-pin-drop" style="background:${fill}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

/** Live position: blue dot with an expanding glow, like a phone's GPS dot. */
export const currentLocationIcon = L.divIcon({
  className: "",
  html: `<div class="booklan-current-marker">
      <span class="booklan-current-halo"></span>
      <span class="booklan-current-glow"></span>
      <span class="booklan-current-dot"></span>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/** Destination: a red map pin, anchored at its point. */
export const destinationPinIcon = L.divIcon({
  className: "",
  html: `<svg class="booklan-destination-pin" width="30" height="38" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0.75c-6.2 0-11.25 5.05-11.25 11.25 0 8.2 10.05 18.9 10.48 19.35a1.06 1.06 0 0 0 1.54 0c.43-.45 10.48-11.15 10.48-19.35C23.25 5.8 18.2.75 12 .75Z" fill="${colors.error}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.25" fill="#ffffff"/>
    </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  popupAnchor: [0, -34],
});

export const stationIcon = L.divIcon({
  className: "",
  html: `<div class="booklan-pin">●</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
