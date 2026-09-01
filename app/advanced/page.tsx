"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, CalendarDays, Clock, MapPin, Search, Users } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import CompanyLogo from "@/components/CompanyLogo";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
import Price from "@/components/Price";
import VehicleBadge from "@/components/VehicleBadge";
import { safeQuery, supabase } from "@/lib/supabase";
import { CITIES } from "@/constants/booking";

type VehicleType = "bus" | "van";

type Schedule = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_hours: number;
  price_per_seat: number;
  seats_available: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

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
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("booklan_user_id");
    if (!stored) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  const toOptions = CITIES.filter((city) => city !== from);

  async function handleSearch() {
    setSearched(true);
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await safeQuery(
      supabase
        .from("schedules")
        .select(
          "id, origin, destination, departure_time, arrival_time, duration_hours, price_per_seat, seats_available, companies(name, vehicle_type)"
        )
        .eq("origin", from)
        .eq("destination", to)
        .gt("seats_available", 0)
    );

    if (fetchError) {
      setError("Couldn't search schedules. Check your connection and try again.");
    } else {
      setSchedules((data as unknown as Schedule[]) ?? []);
    }
    setLoading(false);
  }

  function selectSchedule(schedule: Schedule) {
    sessionStorage.setItem(
      "booklan_schedule",
      JSON.stringify({
        id: schedule.id,
        origin: schedule.origin,
        destination: schedule.destination,
        departure_time: schedule.departure_time,
        arrival_time: schedule.arrival_time,
        duration_hours: schedule.duration_hours,
        price_per_seat: schedule.price_per_seat,
        companies: schedule.companies,
      })
    );
    sessionStorage.setItem("booklan_travel_date", date);
    router.push(`/advanced/seats/${schedule.id}`);
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

        {searched && (
          <div className="flex flex-col gap-3 px-4 pt-4">
            {loading && (
              <>
                <div className="h-28 w-full animate-pulse rounded-[12px] bg-white" />
                <div className="h-28 w-full animate-pulse rounded-[12px] bg-white" />
              </>
            )}

            {!loading && error && <ErrorState message={error} onRetry={handleSearch} />}

            {!loading && !error && schedules.length === 0 && (
              <p className="py-8 text-center text-sm text-text-secondary">
                No schedules found for {from} → {to}.
              </p>
            )}

            {!loading &&
              !error &&
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-col gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="truncate text-[16px] font-semibold text-text-primary">
                        {schedule.origin} → {schedule.destination}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] text-text-secondary">
                          {schedule.companies?.name ?? "Unknown company"}
                        </span>
                        <VehicleBadge type={schedule.companies?.vehicle_type ?? "bus"} />
                      </div>
                    </div>
                    <Price amount={schedule.price_per_seat} />
                  </div>

                  <div className="flex items-center gap-2 text-[14px] font-medium text-text-primary">
                    <span>{schedule.departure_time}</span>
                    <span className="text-text-secondary">→</span>
                    <span>{schedule.arrival_time}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {schedule.duration_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {schedule.seats_available} seats
                    </span>
                  </div>

                  <button
                    onClick={() => selectSchedule(schedule)}
                    className="h-11 w-full rounded-[12px] bg-primary text-[14px] font-semibold text-white hover:brightness-110"
                  >
                    Select
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[12px] font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}
