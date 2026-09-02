"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Inbox, Search, User as UserIcon } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import { safeQuery, supabase } from "@/lib/supabase";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

/**
 * Home is just the passenger's own map plus a way to start a search.
 *
 * It deliberately does NOT plot live vehicles or list which operators are
 * running nearby: that is every company's fleet position and availability,
 * readable by anyone who opens the app. Which buses serve a route is only
 * revealed after a destination and pickup point are chosen.
 */
export default function HomePage() {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("booklan_user_id");
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const { data } = await safeQuery(
        supabase.from("users").select("profile_photo_url").eq("id", userId).single()
      );
      if (cancelled || !data) return;
      setPhotoUrl(data.profile_photo_url);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // Same 390px phone shell as every other screen, so the map doesn't sprawl
    // across a laptop viewport while the rest of the app stays a narrow column.
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-surface">
      <div className="relative w-full max-w-[390px] overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <BusMap />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white/95 via-white/80 to-transparent pb-10">
          <div className="pointer-events-auto w-full px-5 pt-4">
            <div className="flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/booklan-wordmark.svg"
                alt="BookLan"
                className="h-[42px] w-auto shrink-0"
              />

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => router.push("/inbox")}
                  aria-label="Inbox"
                  className="glass flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <Inbox className="h-5 w-5 text-text-primary" />
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  aria-label="Your profile"
                  className="glass flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => router.push("/search")}
              className="glass mt-4 flex h-[54px] w-full items-center gap-3 rounded-[18px] pl-4 pr-1.5 text-left"
            >
              <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
              <span className="flex-1 truncate text-[14px] font-medium text-text-muted">
                Where are you going?
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-[13px] bg-gradient-to-b from-primary to-primary-dark px-4 py-2.5 text-[13px] font-bold text-white">
                <Search className="h-[13px] w-[13px]" />
                Search
              </span>
            </button>
          </div>
        </div>
      </div>

      <ActiveTripBanner />
    </div>
  );
}
