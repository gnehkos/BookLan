"use client";

import { useState } from "react";
import { Bus } from "lucide-react";
import { companySlug } from "@/components/CompanyLogo";

/**
 * Vehicle and interior photos for a company.
 *
 * Each slot walks a candidate list: the company's own photo first, then a
 * shared default. That means one set of `default-*.jpg` files covers every
 * company, and any operator that later supplies real photos overrides them
 * just by dropping in files named after its slug — no code change either way.
 *
 * Files live in `public/photos/`. See the README there for naming.
 */
const MAX_PHOTOS = 4;

function candidates(slug: string, index: number) {
  const n = index + 1;
  return [
    `/photos/${slug}-${n}.jpg`,
    `/photos/${slug}-${n}.png`,
    `/photos/default-${n}.jpg`,
    `/photos/default-${n}.png`,
  ];
}

export default function CompanyPhotos({ name }: { name: string }) {
  const slug = companySlug(name || "unknown");
  // How far down each slot's candidate list we've got. Past the end = give up.
  const [attempt, setAttempt] = useState<number[]>(() =>
    Array.from({ length: MAX_PHOTOS }, () => 0)
  );

  function nextCandidate(index: number) {
    setAttempt((current) => {
      const next = [...current];
      next[index] = current[index] + 1;
      return next;
    });
  }

  const slots = attempt
    .map((step, index) => ({ index, src: candidates(slug, index)[step] }))
    .filter((slot) => slot.src !== undefined);

  if (slots.length === 0) {
    return (
      <div className="mt-3 flex gap-3 overflow-x-auto">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex h-[104px] w-[168px] shrink-0 items-center justify-center rounded-[12px] bg-surface"
          >
            <Bus className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-3 overflow-x-auto">
      {slots.map(({ index, src }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={src}
          alt={`${name} vehicle photo ${index + 1}`}
          className="h-[104px] w-[168px] shrink-0 rounded-[12px] bg-surface object-cover"
          onError={() => nextCandidate(index)}
        />
      ))}
    </div>
  );
}
