"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { POPULAR_DESTINATIONS } from "@/constants/booking";

/**
 * Change-destination sheet. Slides up from the bottom like the seat picker,
 * with a search field over the same popular-province list the search screen
 * uses, so picking a destination feels identical wherever you do it.
 */
export default function DestinationSheet({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (destination: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return POPULAR_DESTINATIONS;
    return POPULAR_DESTINATIONS.filter((place) =>
      place.name.toLowerCase().includes(trimmed)
    );
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[70vh] w-full max-w-[393px] animate-[slide-up_0.25s_ease-out] flex-col rounded-t-[24px] bg-white"
      >
        <span className="mx-auto mt-3 block h-1 w-10 rounded-[2px] bg-border" />

        <div className="flex items-start justify-between px-5 pt-3">
          <div className="flex flex-col">
            <h2 className="text-[16px] font-semibold text-text-primary">Change destination</h2>
            <span className="text-[12px] text-text-secondary">Currently going to {current}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface"
          >
            <X className="h-3.5 w-3.5 text-text-primary" strokeWidth={3} />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex h-12 items-center gap-3 rounded-[14px] border border-border bg-surface px-4">
            <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a province"
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-5 pb-6">
          <span className="text-[12px] font-bold tracking-[0.4px] text-text-muted">
            {query.trim() ? "MATCHES" : "POPULAR DESTINATIONS"}
          </span>

          <div className="mt-3 flex flex-col gap-2">
            {matches.length === 0 && (
              <p className="py-8 text-center text-[13px] text-text-secondary">
                No province matches &quot;{query}&quot;.
              </p>
            )}

            {matches.map((place) => {
              const active = place.name === current;
              return (
                <button
                  key={place.name}
                  onClick={() => {
                    onSelect(place.name);
                    onClose();
                  }}
                  className={`flex items-center gap-3 rounded-[12px] border p-3.5 text-left transition-colors ${
                    active ? "border-primary bg-accent" : "border-border bg-white"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                      active ? "bg-primary" : "bg-surface"
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 ${active ? "text-white" : "text-text-secondary"}`}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-semibold text-text-primary">
                      {place.name}
                    </span>
                    <span className="truncate text-[11px] text-text-muted">{place.note}</span>
                  </span>
                  {active && (
                    <span className="shrink-0 text-[11px] font-semibold text-primary">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
