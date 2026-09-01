"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import ActiveTripBanner from "@/components/ActiveTripBanner";
import BottomNav from "@/components/BottomNav";
import CompanyLogo from "@/components/CompanyLogo";
import ErrorState from "@/components/ErrorState";
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

type SortMode = "earliest" | "cheapest" | "seats";

/**
 * Same card language as the roadside buses list, minus the things a scheduled
 * departure doesn't have — no distance from you, no live ETA. Departure and
 * arrival times take their place.
 */
const SORT_ACCENT: Record<
  SortMode,
  { label: string; strip: string; border: string; badgeBg: string; badgeText: string }
> = {
  earliest: {
    label: "EARLIEST",
    strip: "bg-warning",
    border: "border-warning",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-warning",
  },
  cheapest: {
    label: "CHEAPEST",
    strip: "bg-success",
    border: "border-success",
    badgeBg: "bg-[#DCFCE7]",
    badgeText: "text-success",
  },
  seats: {
    label: "MOST SEATS",
    strip: "bg-[#7C3AED]",
    border: "border-[#7C3AED]",
    badgeBg: "bg-[#EDE9FE]",
    badgeText: "text-[#7C3AED]",
  },
};

const DEFAULT_ACCENT = {
  label: "",
  strip: "bg-accent",
  border: "border-transparent",
  badgeBg: "bg-accent",
  badgeText: "text-primary",
};

const SORT_TABS: { mode: SortMode; label: string }[] = [
  { mode: "earliest", label: "Earliest" },
  { mode: "cheapest", label: "Cheapest" },
  { mode: "seats", label: "Most seats" },
];

export default function AdvancedResultsPage() {
  const router = useRouter();
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("earliest");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const storedFrom = sessionStorage.getItem("booklan_plan_from");
    const storedTo = sessionStorage.getItem("booklan_plan_to");
    const storedDate = sessionStorage.getItem("booklan_travel_date");
    if (!storedFrom || !storedTo || !storedDate) {
      router.replace("/advanced");
      return;
    }
    setFrom(storedFrom);
    setTo(storedTo);
    setDate(storedDate);
  }, [router]);

  const load = useCallback(async () => {
    if (!from || !to) return;
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
      setError("Couldn't load departures. Check your connection and try again.");
    } else {
      setSchedules((data as unknown as Schedule[]) ?? []);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function updateRoute(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    sessionStorage.setItem("booklan_plan_from", nextFrom);
    sessionStorage.setItem("booklan_plan_to", nextTo);
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
    router.push(`/advanced/seats/${schedule.id}`);
  }

  if (!from || !to || !date) return null;

  const sorted = [...schedules].sort((a, b) => {
    if (sortMode === "cheapest") return a.price_per_seat - b.price_per_seat;
    if (sortMode === "seats") return b.seats_available - a.seats_available;
    return a.departure_time.localeCompare(b.departure_time);
  });

  const accent = SORT_ACCENT[sortMode];

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => router.push("/advanced")}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[var(--shadow-float)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-[16px] font-semibold text-text-primary">
              Departures to {to}
            </h1>
            <span className="text-[12px] text-text-secondary">
              {sorted.length} scheduled · {date}
            </span>
          </div>
        </div>

        {/* Route is editable right here — no going back to change it. The swap
            button sits on the divider so it never squeezes either select. */}
        <div className="relative mx-4 rounded-[12px] bg-white p-2 shadow-[var(--shadow-float)]">
          <label className="flex items-center gap-3 rounded-[10px] p-2 pr-12">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-surface">
              <MapPin className="h-3.5 w-3.5 text-text-secondary" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">FROM</span>
              <select
                value={from}
                onChange={(e) => {
                  const next = e.target.value;
                  updateRoute(next, next === to ? (CITIES.find((c) => c !== next) ?? to) : to);
                }}
                className="w-full truncate bg-transparent text-[14px] font-semibold text-text-primary outline-none"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <div className="mx-2 h-px bg-border" />

          <label className="flex items-center gap-3 rounded-[10px] p-2 pr-12">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TO</span>
              <select
                value={to}
                onChange={(e) => updateRoute(from, e.target.value)}
                className="w-full truncate bg-transparent text-[14px] font-semibold text-primary outline-none"
              >
                {CITIES.filter((city) => city !== from).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </span>
          </label>

          {/* Vertically centred across both rows, clear of the text. */}
          <button
            onClick={() => updateRoute(to, from)}
            aria-label="Swap origin and destination"
            className="absolute right-4 top-[76px] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-colors hover:bg-surface"
          >
            <ArrowRightLeft className="h-4 w-4 text-text-secondary" />
          </button>

          <div className="mx-2 h-px bg-border" />

          <label className="flex items-center gap-3 rounded-[10px] p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-surface">
              <CalendarDays className="h-3.5 w-3.5 text-text-secondary" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">DATE</span>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  sessionStorage.setItem("booklan_travel_date", e.target.value);
                }}
                className="w-full bg-transparent text-[14px] font-semibold text-text-primary outline-none"
              />
            </span>
          </label>
        </div>

        <div className="px-4 pt-4">
          <div className="flex w-full items-center gap-1 rounded-pill bg-white/70 p-1">
            {SORT_TABS.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex-1 rounded-pill px-2 py-2 text-[12px] font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-white"
                    : "bg-white text-text-secondary hover:bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          {loading && (
            <>
              <div className="h-40 w-full animate-pulse rounded-[16px] bg-white" />
              <div className="h-40 w-full animate-pulse rounded-[16px] bg-white" />
            </>
          )}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
          )}

          {!loading && !error && sorted.length === 0 && (
            <p className="py-10 text-center text-sm text-text-secondary">
              No departures from {from} to {to}.
            </p>
          )}

          {!loading &&
            !error &&
            sorted.map((schedule, index) => {
              const a = index === 0 ? accent : DEFAULT_ACCENT;
              const lowSeats = schedule.seats_available <= 3;
              const company = schedule.companies?.name ?? "Unknown company";

              return (
                <button
                  key={schedule.id}
                  onClick={() => selectSchedule(schedule)}
                  className={`relative w-full overflow-hidden rounded-[16px] bg-white text-left shadow-[var(--shadow-float)] transition-transform active:scale-[0.99] ${
                    index === 0 ? `border-2 ${a.border}` : "border border-transparent"
                  }`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${a.strip}`} aria-hidden />

                  <div className="p-4 pl-5">
                    <div className="flex items-start gap-3">
                      <CompanyLogo name={company} size={40} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[16px] font-semibold text-text-primary">
                          {company}
                        </span>
                        <VehicleBadge type={schedule.companies?.vehicle_type ?? "bus"} />
                      </div>
                      <div className={`shrink-0 rounded-[12px] px-3 py-2 text-right ${a.badgeBg}`}>
                        {index === 0 && (
                          <span
                            className={`block text-[9px] font-bold tracking-[0.5px] ${a.badgeText}`}
                          >
                            {a.label}
                          </span>
                        )}
                        <span className="block text-[20px] font-bold leading-tight text-primary">
                          ${schedule.price_per_seat.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-text-secondary">per seat</span>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center gap-3">
                      <span className="text-[16px] font-semibold text-text-primary">
                        {schedule.departure_time}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                      <span className="shrink-0 text-[11px] text-text-secondary">
                        {schedule.duration_hours}h
                      </span>
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-[16px] font-semibold text-text-primary">
                        {schedule.arrival_time}
                      </span>
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                      <span className="flex items-center justify-center gap-1 rounded-[10px] bg-surface px-2 py-2 text-[11px] font-medium text-text-secondary">
                        <Clock className="h-3.5 w-3.5" />
                        {schedule.duration_hours}h journey
                      </span>
                      <span
                        className={`flex items-center justify-center gap-1 rounded-[10px] px-2 py-2 text-[11px] font-medium ${
                          lowSeats ? "bg-[#FEF2F2] text-error" : "bg-surface text-text-secondary"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {schedule.seats_available} seats
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      <ActiveTripBanner />
      <BottomNav />
    </div>
  );
}
