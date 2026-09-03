"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Navigation } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { NAV_CLEARANCE } from "@/components/BottomNav";
import { safeQuery, supabase } from "@/lib/supabase";

type ActiveTrip = {
  id: string;
  status: string;
  distance_remaining_km: number;
  active_trips: { destination: string; companies: { name: string } | null } | null;
};

/**
 * Persistent "you have a trip running" strip.
 *
 * Once a booking is live the passenger can wander off to Home or Plan Trip and
 * lose the thread, so this floats above the nav on every other screen and
 * routes back to the right place: the pickup handover while the bus is still
 * approaching, the live trip once they're aboard.
 */
const HIDDEN_ON = ["/tracking", "/trip"];

/**
 * Height of the banner plus its gap, so a scrolling page can pad past it.
 *
 * The banner is a fixed overlay: without this it covers whatever sits at the
 * bottom of the list underneath — on My Bookings that was the Track and Cancel
 * buttons of the last receipt.
 */
export const BANNER_CLEARANCE = 76;

export default function ActiveTripBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [booking, setBooking] = useState<ActiveTrip | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("booklan_user_id");
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const { data } = await safeQuery(
        supabase
          .from("bookings")
          .select(
            "id, status, distance_remaining_km, active_trips(destination, companies(name))"
          )
          .eq("user_id", userId)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1)
      );

      if (cancelled) return;
      const rows = (data as unknown as ActiveTrip[]) ?? [];
      setBooking(rows[0] ?? null);
    })();

    return () => {
      cancelled = true;
    };
    // Re-check on navigation so it appears/disappears as bookings change.
  }, [pathname]);

  if (!booking) return null;
  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  const company = booking.active_trips?.companies?.name ?? "Your bus";
  const destination = booking.active_trips?.destination ?? "your destination";
  const onTrip = booking.distance_remaining_km <= 0;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex w-full max-w-[393px] justify-center px-4"
      style={{ bottom: NAV_CLEARANCE + 8 }}
    >
      <button
        onClick={() =>
          router.push(onTrip ? `/trip/${booking.id}` : `/tracking/${booking.id}`)
        }
        className="pointer-events-auto flex w-full items-center gap-3 rounded-[14px] bg-primary p-3 text-left shadow-[var(--shadow-float)]"
      >
        <span className="relative flex shrink-0">
          <CompanyLogo name={company} size={36} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-primary" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold text-white">
            {onTrip ? `On the way to ${destination}` : `${company} is on the way`}
          </span>
          <span className="truncate text-[11px] text-white/70">
            {onTrip
              ? "Tap to view your live trip"
              : `${booking.distance_remaining_km} km away · tap to track`}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1 text-white">
          <Navigation className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
