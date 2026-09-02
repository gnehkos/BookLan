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

/**
 * A muted colour per national road, so the corridor a destination sits on is
 * recognisable at a glance. Deliberately low-saturation: the list carries ten
 * of these at once, and saturated chips would fight the province names for
 * attention rather than supporting them.
 */
export const roadBadge: Record<string, { bg: string; text: string }> = {
  NR1: { bg: "#FEF3E2", text: "#92610F" },
  NR2: { bg: "#F3EEFB", text: "#6B4C9A" },
  NR3: { bg: "#E8F6EC", text: "#2F7D4F" },
  NR4: { bg: "#E8F1FB", text: "#2C5F98" },
  NR5: { bg: "#FCEDF0", text: "#9C4658" },
  NR6: { bg: "#ECEEFB", text: "#4B54A3" },
  NR7: { bg: "#E4F4F3", text: "#1F7A72" },
};

/** Falls back to the neutral navy tint for a road with no colour assigned. */
export const DEFAULT_ROAD_BADGE = { bg: "#EEF2F7", text: "#19355F" } as const;
