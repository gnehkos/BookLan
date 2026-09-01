/**
 * The palette, mirrored from the CSS custom properties in app/globals.css.
 *
 * Anything rendered outside Tailwind's reach — Leaflet marker HTML, inline SVG
 * fills — reads its colours from here, so the two must stay in step.
 *
 * The two brand colours come from the logo itself: `primary` is the navy of the
 * mark's body, `secondary` the teal of its centre band.
 */
export const colors = {
  primary: "#19355F",
  primaryDark: "#102544",
  primaryTint: "#EEF2F7",
  secondary: "#00A79D",
  secondaryDark: "#00857D",
  secondaryTint: "#E3F7F5",
  background: "#FFFFFF",
  surface: "#F5F8FA",
  accent: "#E3F7F5",
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
