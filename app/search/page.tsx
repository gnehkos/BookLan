"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import { getActivePickupBooking, type ActivePickupBooking } from "@/lib/activeBooking";
import { POPULAR_DESTINATIONS, PROVINCES } from "@/constants/booking";
import { roadsFor } from "@/lib/geo";
import { DEFAULT_ROAD_BADGE, roadBadge } from "@/constants/theme";

/**
 * Pick where you're going — nothing more. Choosing a destination goes straight
 * to the pickup pin; which operators serve it is answered after we know where
 * the passenger will be standing.
 */
export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);

  // Empty search offers the busy routes; typing searches every province, so
  // anywhere in the country is reachable even without a scheduled service.
  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return POPULAR_DESTINATIONS;
    return PROVINCES.filter((place) => place.name.toLowerCase().includes(trimmed));
  }, [query]);

  async function selectDestination(destination: string) {
    // Only one roadside pickup can be live at a time.
    const userId = localStorage.getItem("booklan_user_id");
    if (userId) {
      const existing = await getActivePickupBooking(userId);
      if (existing) {
        setBlockedBy(existing);
        return;
      }
    }

    sessionStorage.setItem("booklan_destination", destination);
    router.push("/booking/pickup");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="bg-white px-4 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/home")}
              aria-label="Back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
            </button>
            <div className="flex h-12 flex-1 items-center gap-3 rounded-[18px] border border-border bg-surface px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
              <input
                autoFocus
                type="text"
                placeholder="Where do you want to go?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="shrink-0 text-text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <span className="text-[12px] font-bold tracking-[0.4px] text-text-muted">
            {query.trim() ? "MATCHES" : "POPULAR DESTINATIONS"}
          </span>

          <div className="mt-3 flex flex-col gap-2">
            {matches.length === 0 && (
              <p className="py-12 text-center text-[14px] text-text-secondary">
                No destination matches &quot;{query}&quot;.
              </p>
            )}

            {matches.map((place) => {
              const roads = roadsFor(place.name);
              return (
                <button
                  key={place.name}
                  onClick={() => selectDestination(place.name)}
                  className="group flex items-center gap-3 rounded-[18px] border border-border bg-white px-4 py-3.5 text-left shadow-[var(--shadow-soft)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-float)] active:scale-[0.995]"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate text-[16px] font-bold tracking-[-0.2px] text-text-primary">
                      {place.name}
                    </span>

                    {/* The road is the practical detail — it is where the
                        passenger will have to stand — so it sits directly
                        under the name, colour-coded per corridor. */}
                    <span className="flex flex-wrap items-center gap-1">
                      {roads.map((road) => {
                        const tone = roadBadge[road.id] ?? DEFAULT_ROAD_BADGE;
                        return (
                          <span
                            key={road.id}
                            style={{ backgroundColor: tone.bg, color: tone.text }}
                            className="shrink-0 rounded-md px-2 py-[3px] text-[11px] font-bold tracking-[0.1px]"
                          >
                            {road.name}
                          </span>
                        );
                      })}
                    </span>

                    <span className="truncate text-[12.5px] text-text-secondary">
                      {place.note}
                    </span>
                  </span>
                  <ChevronRight className="h-[18px] w-[18px] shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {blockedBy && (
        <ActiveBookingModal booking={blockedBy} onClose={() => setBlockedBy(null)} />
      )}

      <ActiveTripBanner />
    </div>
  );
}
