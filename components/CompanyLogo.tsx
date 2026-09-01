"use client";

import { useState } from "react";

/**
 * Company logo with a graceful fallback.
 *
 * Artwork lives in `public/logos/` named after the company slug. Each slug
 * walks a short list of extensions — operators supply whatever they have — and
 * a company with no file at all falls back to a tinted square with its initial.
 * Slugs that exhaust the list are remembered for the session so a missing logo
 * isn't re-requested on every card.
 */
const EXTENSIONS = ["png", "jpg", "webp"] as const;

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
  const [attempt, setAttempt] = useState(() => (missingLogos.has(slug) ? EXTENSIONS.length : 0));

  const shared = "shrink-0 overflow-hidden rounded-[10px]";
  const style = { width: size, height: size };
  const exhausted = attempt >= EXTENSIONS.length;

  if (exhausted) {
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
      src={`/logos/${slug}.${EXTENSIONS[attempt]}`}
      alt={`${name} logo`}
      style={style}
      className={`${shared} bg-white object-contain ${className}`}
      onError={() => {
        const next = attempt + 1;
        if (next >= EXTENSIONS.length) missingLogos.add(slug);
        setAttempt(next);
      }}
    />
  );
}
