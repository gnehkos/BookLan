/**
 * The palette, mirrored from the CSS custom properties in app/globals.css.
 *
 * Anything rendered outside Tailwind's reach — Leaflet marker HTML, inline SVG
 * fills — reads its colours from here, so the two must stay in step.
 *
 * The theme is navy. `primary` is the navy of the logo mark's body; `secondary`
 * is a brighter blue of the same hue for anything that needs to lift off it.
 * The teal that also appears in the logo is deliberately absent — it belongs to
 * the artwork, not the interface.
 */
export const colors = {
  primary: "#19355F",
  primaryDark: "#102544",
  primaryTint: "#EEF2F7",
  secondary: "#2E6FB8",
  secondaryDark: "#245891",
  secondaryTint: "#EAF1F9",
  background: "#FFFFFF",
  surface: "#F5F8FA",
  accent: "#EAF1F9",
  textPrimary: "#0B1729",
  textSecondary: "#5A6B81",
  textMuted: "#93A1B3",
  success: "#0FA36B",
  warning: "#F5A524",
  error: "#E5484D",
  border: "#E6ECF2",
} as const;

export const radius = {
  card: "20px",
  sheet: "28px",
  pill: "100px",
} as const;
