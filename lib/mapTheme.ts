import L from "leaflet";
import { colors } from "@/constants/theme";

/**
 * Shared Leaflet look-and-feel. Every map in the app pulls its tiles and
 * markers from here so they stay visually identical — the supporting CSS
 * (`.booklan-*` classes) lives in app/globals.css because Leaflet injects
 * marker markup as raw HTML outside React.
 */

/** CartoDB Positron: light and low-contrast, so our navy UI reads on top. */
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

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

export const stationIcon = L.divIcon({
  className: "",
  html: `<div class="booklan-pin">●</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
