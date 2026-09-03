"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import ErrorState from "@/components/ErrorState";
import SeatMap from "@/components/SeatMap";
import { safeQuery, supabase } from "@/lib/supabase";

type VehicleType = "bus" | "van";

type ScheduleDetail = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price_per_seat: number;
  seats_total: number;
  seats_available: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

export default function AdvancedSeatsPage() {
  const router = useRouter();
  const params = useParams<{ scheduleId: string }>();
  const scheduleId = params.scheduleId;

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!sessionStorage.getItem("booklan_schedule")) {
      router.replace("/advanced");
      return;
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await safeQuery(
        supabase
          .from("schedules")
          .select(
            "id, origin, destination, departure_time, arrival_time, price_per_seat, seats_total, seats_available, companies(name, vehicle_type)"
          )
          .eq("id", scheduleId)
          .single()
      );

      if (!cancelled) {
        if (fetchError || !data) {
          setError("Couldn't load this schedule. It may no longer be available.");
        } else {
          setSchedule(data as unknown as ScheduleDetail);
        }
        setLoading(false);
      }
    }

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [scheduleId, refreshKey]);

  const totalPrice = schedule ? schedule.price_per_seat * selectedSeats.length : 0;

  function toggleSeat(seat: number) {
    setSelectedSeats((current) => {
      if (current.includes(seat)) return current.filter((s) => s !== seat);
      if (!schedule || current.length >= schedule.seats_available) return current;
      return [...current, seat].sort((a, b) => a - b);
    });
  }

  function handleContinue() {
    if (selectedSeats.length === 0 || !schedule) return;
    sessionStorage.setItem(
      "booklan_advanced_seat",
      JSON.stringify({ seatNumbers: selectedSeats, totalPrice })
    );
    router.push("/advanced/departure");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="w-full max-w-[390px] flex-1 px-4 pt-6 pb-24">
          <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-white">
        <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
          <div className="flex items-center gap-2 px-4 pt-6 pb-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
            >
              <ArrowLeft className="h-6 w-6 text-text-primary" />
            </button>
          </div>
          <ErrorState
            message={error ?? "Couldn't load this schedule."}
            onRetry={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col pb-24">
        <div className="flex items-center gap-2 px-4 pt-6 pb-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-semibold text-text-primary">
              {schedule.companies?.name ?? "Unknown company"}
            </h1>
            <span className="text-[13px] text-text-secondary">
              {schedule.origin} → {schedule.destination} · {schedule.departure_time}–
              {schedule.arrival_time}
            </span>
          </div>
        </div>

        <div className="mx-4 flex items-center justify-between rounded-card bg-surface p-4 text-[14px]">
          <span className="text-text-secondary">Price per seat</span>
          <span className="font-bold text-text-primary">
            ${schedule.price_per_seat.toFixed(2)}
          </span>
        </div>

        <div className="mt-6 px-4">
          <SeatMap
            seatsTotal={schedule.seats_total}
            seatsAvailable={schedule.seats_available}
            selectedSeats={selectedSeats}
            onToggle={toggleSeat}
            seedKey={scheduleId}
          />
        </div>

        <div className="mt-auto px-4 pt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-text-secondary">
                Selected seats
              </span>
              <span
                className={`text-[14px] font-bold ${
                  selectedSeats.length ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {selectedSeats.length ? selectedSeats.join(", ") : "None selected"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-semibold text-text-secondary">Subtotal</span>
              <span className="text-[16px] font-extrabold text-primary">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
          <Button disabled={selectedSeats.length === 0} onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>

    </div>
  );
}
