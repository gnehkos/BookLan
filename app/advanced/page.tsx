"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Clock, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ErrorState from "@/components/ErrorState";
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
    const stored = sessionStorage.getItem("booklan_user_id");
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
        <div className="bg-white px-4 pt-6 pb-4">
          <h1 className="text-lg font-bold text-text-primary">Advanced Booking</h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Reserve a seat on a scheduled departure.
          </p>
        </div>

        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
          <div className="flex items-end gap-2">
            <Field label="From">
              <select
                value={from}
                onChange={(e) => {
                  const value = e.target.value;
                  setFrom(value);
                  if (value === to) setTo(CITIES.find((city) => city !== value) ?? "");
                }}
                className="h-12 w-full rounded-card border border-border bg-white px-3 text-[14px] text-text-primary outline-none focus:border-primary"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={() => {
                const prevFrom = from;
                setFrom(to);
                setTo(prevFrom);
              }}
              aria-label="Swap origin and destination"
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface"
            >
              <ArrowRightLeft className="h-4 w-4 text-text-secondary" />
            </button>

            <Field label="To">
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-12 w-full rounded-card border border-border bg-white px-3 text-[14px] text-text-primary outline-none focus:border-primary"
              >
                {toOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date">
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 w-full rounded-card border border-border bg-white px-3 text-[14px] text-text-primary outline-none focus:border-primary"
            />
          </Field>

          <button
            onClick={handleSearch}
            className="h-12 w-full rounded-card bg-primary text-[15px] font-semibold text-white hover:bg-[#15304c]"
          >
            Search Buses
          </button>
        </div>

        {searched && (
          <div className="flex flex-col gap-3 px-4 pt-4">
            {loading && (
              <>
                <div className="h-28 w-full animate-pulse rounded-card bg-white" />
                <div className="h-28 w-full animate-pulse rounded-card bg-white" />
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
                  className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-text-primary">
                        {schedule.companies?.name ?? "Unknown company"}
                      </span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
                        {schedule.companies?.vehicle_type ?? "bus"}
                      </span>
                    </div>
                    <span className="text-[15px] font-bold text-text-primary">
                      ${schedule.price_per_seat.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                    <span>{schedule.departure_time}</span>
                    <span className="text-text-secondary">→</span>
                    <span>{schedule.arrival_time}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[13px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {schedule.duration_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {schedule.seats_available} seats
                    </span>
                  </div>

                  <button
                    onClick={() => selectSchedule(schedule)}
                    className="h-10 w-full rounded-card bg-primary text-[14px] font-semibold text-white hover:bg-[#15304c]"
                  >
                    Select
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

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
