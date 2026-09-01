"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin, Search, X } from "lucide-react";
import ActiveBookingModal from "@/components/ActiveBookingModal";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import { getActivePickupBooking, type ActivePickupBooking } from "@/lib/activeBooking";
import { POPULAR_DESTINATIONS } from "@/constants/booking";
import { roadsFor } from "@/lib/geo";

/**
 * Pick where you're going — nothing more. Choosing a destination goes straight
 * to the pickup pin; which operators serve it is answered after we know where
 * the passenger will be standing.
 */
export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [blockedBy, setBlockedBy] = useState<ActivePickupBooking | null>(null);

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return POPULAR_DESTINATIONS;
    return POPULAR_DESTINATIONS.filter((place) =>
      place.name.toLowerCase().includes(trimmed)
    );
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
                  className="flex items-center gap-3 rounded-[12px] bg-white p-3.5 text-left shadow-[var(--shadow-float)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold text-text-primary">
                      {place.name}
                    </span>
                    {/* Tells the passenger up front which road to wait on. */}
                    <span className="truncate text-[12px] text-text-secondary">
                      {place.note} · via {roads.map((r) => r.id).join(" / ")}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
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
      <BottomNav />
    </div>
  );
}
