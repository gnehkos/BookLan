import L from "leaflet";
import { colors } from "@/constants/theme";

/**
 * Shared Leaflet look-and-feel. Every map in the app pulls its tiles and
 * markers from here so they stay visually identical — the supporting CSS
 * (`.booklan-*` classes) lives in app/globals.css because Leaflet injects
 * marker markup as raw HTML outside React.
 */

/**
 * Base map tiles: Esri World Light Gray Canvas.
 *
 * Pale grey and low-contrast — the closest keyless match to CARTO Positron,
 * which is what this UI was designed against. CARTO can't be used: their
 * basemaps now watermark "API KEY REQUIRED" across every tile, and the
 * `api_key` query parameter is ignored (an authenticated request returns a
 * byte-identical watermarked image).
 *
 * Esri splits the style in two — a label-free base, plus a reference layer
 * carrying place names — so both are drawn, base first.
 *
 * Any keyed provider can override this without a code change via
 * NEXT_PUBLIC_MAP_TILE_URL / NEXT_PUBLIC_MAP_ATTRIBUTION. Stadia Maps'
 * "Alidade Smooth" is the true Positron equivalent if a key is ever added.
 */
const ESRI_BASE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

const ESRI_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

export const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || ESRI_BASE;

/** Place-name overlay. Null when a custom provider is supplying its own labels. */
export const TILE_LABEL_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ? null : ESRI_LABELS;

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "© Esri, HERE, Garmin, © OpenStreetMap contributors";

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

/**
 * The company's own logo in a white ringed circle.
 *
 * Leaflet injects this as raw HTML rather than React, so the extension
 * fallback that CompanyLogo does in state is done here with an inline onerror
 * chain: png → jpg → webp → the company's initial.
 */
export function vehicleIcon(companyName: string) {
  const name = companyName || "Unknown";
  const initial = escapeHtml(name.charAt(0).toUpperCase());
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const fallback =
    `this.parentNode.innerHTML='${initial}';this.parentNode.classList.add('booklan-pin-initial')`;
  const tryWebp = `this.onerror=function(){${fallback}};this.src='/logos/${slug}.webp'`;
  const tryJpg = `this.onerror=function(){${tryWebp}};this.src='/logos/${slug}.jpg'`;

  return L.divIcon({
    className: "",
    html: `<div class="booklan-pin booklan-pin-logo">
        <img src="/logos/${slug}.png" alt="" onerror="${tryJpg}" />
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

/**
 * Teardrop pin for a draggable pickup point.
 *
 * The pin is the brand navy in both states rather than red when invalid — a red
 * pin read as an error before the passenger had done anything wrong, since it
 * starts wherever they happen to be standing. Validity is carried by the hint
 * beside the pin and by the sheet below, which can say what is actually wrong.
 */
export function dropPinIcon(allowed: boolean) {
  const fill = allowed ? colors.primary : colors.textMuted;
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
