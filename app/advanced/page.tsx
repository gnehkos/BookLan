"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, CalendarDays, MapPin, Search } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import { CITIES } from "@/constants/booking";

type VehicleType = "bus" | "van";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Today / Tomorrow / a weekday label, for the quick-pick date chips. */
function dateChips() {
  return [0, 1, 2].map((offset) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    const iso = day.toISOString().slice(0, 10);
    const label =
      offset === 0
        ? "Today"
        : offset === 1
          ? "Tomorrow"
          : day.toLocaleDateString(undefined, { weekday: "short" });
    return { iso, label, sub: day.toLocaleDateString(undefined, { day: "numeric", month: "short" }) };
  });
}

export default function AdvancedBookingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [from, setFrom] = useState<string>(CITIES[0]);
  const [to, setTo] = useState<string>(CITIES[1]);
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    const stored = localStorage.getItem("booklan_user_id");
    if (!stored) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  const toOptions = CITIES.filter((city) => city !== from);

  function handleSearch() {
    sessionStorage.setItem("booklan_plan_from", from);
    sessionStorage.setItem("booklan_plan_to", to);
    sessionStorage.setItem("booklan_travel_date", date);
    router.push("/advanced/results");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="bg-white px-4 pt-6 pb-5">
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-text-primary">
            Plan a trip
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Reserve a seat on a scheduled departure, up to a week ahead.
          </p>
        </div>

        <div className="mx-4 -mt-2 flex flex-col gap-4 rounded-[16px] bg-white p-4 shadow-[var(--shadow-float)]">
          {/* Route picker, stacked with the swap control on the divider. */}
          <div className="relative rounded-[12px] border border-border">
            <label className="flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface">
                <MapPin className="h-4 w-4 text-text-secondary" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                  FROM
                </span>
                <select
                  value={from}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFrom(value);
                    if (value === to) setTo(CITIES.find((city) => city !== value) ?? "");
                  }}
                  className="w-full bg-transparent text-[14px] font-semibold text-text-primary outline-none"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <div className="mx-3 h-px bg-border" />

            <label className="flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent">
                <MapPin className="h-4 w-4 text-primary" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TO</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-semibold text-primary outline-none"
                >
                  {toOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <button
              onClick={() => {
                const prevFrom = from;
                setFrom(to);
                setTo(prevFrom);
              }}
              aria-label="Swap origin and destination"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-sm"
            >
              <ArrowRightLeft className="h-4 w-4 text-text-secondary" />
            </button>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
              TRAVEL DATE
            </span>
            <div className="mt-2 flex gap-2">
              {dateChips().map((chip) => (
                <button
                  key={chip.iso}
                  onClick={() => setDate(chip.iso)}
                  className={`flex flex-1 flex-col items-center rounded-[12px] border py-2 transition-colors ${
                    date === chip.iso
                      ? "border-primary bg-accent"
                      : "border-border bg-white"
                  }`}
                >
                  <span
                    className={`text-[13px] font-semibold ${
                      date === chip.iso ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {chip.label}
                  </span>
                  <span className="text-[11px] text-text-muted">{chip.sub}</span>
                </button>
              ))}
            </div>

            <label className="mt-2 flex items-center gap-3 rounded-[12px] border border-border p-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-[14px] text-text-primary outline-none"
              />
            </label>
          </div>

          <button
            onClick={handleSearch}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[15px] font-semibold text-white hover:brightness-110"
          >
            <Search className="h-[18px] w-[18px]" />
            Search departures
          </button>
        </div>
      </div>

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}
