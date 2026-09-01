"use client";

import { useState } from "react";

/**
 * Company logo with a graceful fallback.
 *
 * Real artwork is expected at `/logos/<company-slug>.png`. None ship with the
 * app yet, so until a file is dropped in `public/logos/` this renders a tinted
 * square with the company's initial. Slugs that 404 are remembered for the rest
 * of the session so we don't re-request a known-missing file on every card.
 */
const missingLogos = new Set<string>();

export function companySlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Stable tint per company, drawn from the design tokens rather than random hues. */
const TINTS = [
  "bg-accent text-primary",
  "bg-[#EFF6FF] text-secondary",
  "bg-[#F0FDF4] text-success",
  "bg-[#FEF3C7] text-warning",
] as const;

function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export default function CompanyLogo({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const slug = companySlug(name || "unknown");
  const [failed, setFailed] = useState(() => missingLogos.has(slug));

  const shared = "shrink-0 overflow-hidden rounded-[10px]";
  const style = { width: size, height: size };

  if (failed) {
    return (
      <span
        style={style}
        aria-hidden
        className={`${shared} ${tintFor(name)} flex items-center justify-center font-bold ${className}`}
      >
        <span style={{ fontSize: Math.round(size * 0.4) }}>
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${slug}.png`}
      alt={`${name} logo`}
      style={style}
      className={`${shared} bg-surface object-cover ${className}`}
      onError={() => {
        missingLogos.add(slug);
        setFailed(true);
      }}
    />
  );
}
