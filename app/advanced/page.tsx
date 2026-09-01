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
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        {/* Navy hero with the search card floating over its lower edge — the
            flat white header block read as a rectangle stacked on a rectangle. */}
        <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-primary to-primary-dark px-5 pb-16 pt-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-secondary/30 blur-3xl"
          />
          <h1 className="relative text-[27px] font-extrabold tracking-[-0.7px] text-white">
            Plan a trip
          </h1>
          <p className="relative mt-1.5 max-w-[270px] text-[13.5px] leading-[20px] text-white/65">
            Reserve a seat on a scheduled departure, up to a week ahead.
          </p>
        </div>

        <div className="mx-4 -mt-10 flex flex-col gap-5 rounded-[24px] bg-white p-5 shadow-[var(--shadow-lift)]">
          {/* Route picker, stacked with the swap control on the divider. */}
          <div className="relative rounded-[18px] bg-surface p-1">
            <label className="flex items-center gap-3 rounded-[15px] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]">
                <MapPin className="h-4 w-4 text-text-secondary" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">FROM</span>
                <select
                  value={from}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFrom(value);
                    if (value === to) setTo(CITIES.find((city) => city !== value) ?? "");
                  }}
                  className="-ml-0.5 w-full bg-transparent text-[15px] font-bold text-text-primary outline-none"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <div className="mx-4 h-px bg-border" />

            <label className="flex items-center gap-3 rounded-[15px] p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary shadow-[0_4px_12px_rgba(0,167,157,0.35)]">
                <MapPin className="h-4 w-4 text-white" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">TO</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="-ml-0.5 w-full bg-transparent text-[15px] font-bold text-text-primary outline-none"
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
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-[var(--shadow-float)] transition-transform active:scale-95"
            >
              <ArrowRightLeft className="h-4 w-4 text-primary" />
            </button>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">
              TRAVEL DATE
            </span>
            <div className="mt-2.5 flex gap-2">
              {dateChips().map((chip) => (
                <button
                  key={chip.iso}
                  onClick={() => setDate(chip.iso)}
                  className={`flex flex-1 flex-col items-center rounded-[16px] py-2.5 transition-all ${
                    date === chip.iso
                      ? "bg-secondary text-white shadow-[0_6px_16px_rgba(0,167,157,0.3)]"
                      : "bg-surface text-text-primary"
                  }`}
                >
                  <span className="text-[13px] font-bold">{chip.label}</span>
                  <span
                    className={`text-[11px] ${
                      date === chip.iso ? "text-white/75" : "text-text-muted"
                    }`}
                  >
                    {chip.sub}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-2.5 flex items-center gap-3 rounded-[16px] bg-surface p-3.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-[14px] font-medium text-text-primary outline-none"
              />
            </label>
          </div>

          <button
            onClick={handleSearch}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-b from-secondary to-secondary-dark text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(0,167,157,0.35)] transition-transform active:scale-[0.99]"
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
