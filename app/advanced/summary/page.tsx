"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import VehicleBadge from "@/components/VehicleBadge";
import PaymentCard from "@/components/PaymentCard";
import { safeQuery, supabase } from "@/lib/supabase";
import { generateTicketId } from "@/lib/ticket";

type VehicleType = "bus" | "van";

type StoredSchedule = {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price_per_seat: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredSeat = { seatNumbers: number[]; totalPrice: number };
type StoredStation = { id: string; name: string; address: string };

export default function AdvancedSummaryPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<StoredSchedule | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [travelDate, setTravelDate] = useState<string | null>(null);
  const [departure, setDeparture] = useState<StoredStation | null>(null);
  const [dropoff, setDropoff] = useState<StoredStation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const scheduleStored = sessionStorage.getItem("booklan_schedule");
    const seatStored = sessionStorage.getItem("booklan_advanced_seat");
    const dateStored = sessionStorage.getItem("booklan_travel_date");

    if (!scheduleStored) {
      router.replace("/advanced");
      return;
    }
    const parsedSchedule = JSON.parse(scheduleStored) as StoredSchedule;
    if (!seatStored) {
      router.replace(`/advanced/seats/${parsedSchedule.id}`);
      return;
    }

    const departureStored = sessionStorage.getItem("booklan_advanced_departure");
    if (!departureStored) {
      router.replace("/advanced/departure");
      return;
    }

    const dropoffStored = sessionStorage.getItem("booklan_advanced_dropoff");
    if (!dropoffStored) {
      router.replace("/advanced/dropoff");
      return;
    }

    setSchedule(parsedSchedule);
    setSeat(JSON.parse(seatStored));
    setDeparture(JSON.parse(departureStored));
    setDropoff(JSON.parse(dropoffStored));
    setTravelDate(dateStored);
    setReady(true);
  }, [router]);

  async function handlePaymentSuccess() {
    if (!schedule || !seat || !travelDate) return;

    const userId = localStorage.getItem("booklan_user_id");
    const ticketId = generateTicketId();

    const { data: booking, error: insertError } = await safeQuery(
      supabase
        .from("advanced_bookings")
        .insert({
          user_id: userId,
          schedule_id: schedule.id,
          travel_date: travelDate,
          seat_numbers: seat.seatNumbers,
          departure_station_id: departure?.id ?? null,
          dropoff_station_id: dropoff?.id ?? null,
          ticket_id: ticketId,
          status: "confirmed",
          total_price: seat.totalPrice,
          payment_status: "paid",
        })
        .select()
        .single()
    );

    if (insertError || !booking) {
      throw new Error(insertError?.message ?? "Could not create booking.");
    }

    // Best-effort: the booking above already succeeded, so a failure here must never
    // surface as a payment error and risk the user paying twice.
    try {
      const { data: currentSchedule } = await supabase
        .from("schedules")
        .select("seats_available")
        .eq("id", schedule.id)
        .single();

      if (currentSchedule) {
        await supabase
          .from("schedules")
          .update({
            // Never let a schedule go negative, however the count drifted.
            seats_available: Math.max(
              0,
              currentSchedule.seats_available - seat.seatNumbers.length
            ),
          })
          .eq("id", schedule.id);
      }
    } catch {
      // seats_available may be stale; not worth blocking a successful booking over.
    }

    sessionStorage.setItem("booklan_advanced_ticket_id", ticketId);
    // Cleared so the next booking cannot inherit this one's drop-off.
    sessionStorage.removeItem("booklan_advanced_departure");
    sessionStorage.removeItem("booklan_advanced_dropoff");
    router.push("/advanced/confirmed");
  }

  if (!ready || !schedule || !seat) return null;

  const company = schedule.companies?.name ?? "Unknown operator";
  const perSeat = schedule.price_per_seat;
  const seats = seat.seatNumbers.length;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-semibold text-text-primary">Confirm Booking</h1>
        </div>

        {/* Journey: the two stations joined by a connector, matching the
            roadside screen so the two flows read the same way. */}
        <div className="mx-4 mt-4 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-3 w-3 rounded-full border-[3px] border-primary bg-white" />
              <span className="my-1 w-px flex-1 border-l-2 border-dashed border-border" />
              <MapPin className="h-4 w-4 text-error" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                  DEPARTURE STATION
                </span>
                <span className="truncate text-[15px] font-semibold text-text-primary">
                  {departure?.name ?? schedule.origin}
                </span>
                <span className="truncate text-[12px] text-text-secondary">
                  {departure?.address ?? schedule.origin} · {schedule.departure_time}
                </span>
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                  DROP-OFF STATION
                </span>
                <span className="truncate text-[15px] font-semibold text-primary">
                  {dropoff?.name ?? schedule.destination}
                </span>
                <span className="truncate text-[12px] text-text-secondary">
                  {dropoff?.address ?? schedule.destination} · {schedule.arrival_time}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Who's carrying you, with the seats on the right — one card rather
            than an operator card and a seat card saying little each. */}
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
          <CompanyLogo name={company} size={44} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[15px] font-semibold text-text-primary">{company}</span>
            <div className="flex items-center gap-2">
              <VehicleBadge type={schedule.companies?.vehicle_type ?? "bus"} />
              <span className="truncate text-[12px] text-text-secondary">{travelDate}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
              {seats > 1 ? "SEATS" : "SEAT"}
            </span>
            <span className="text-[17px] font-extrabold leading-tight text-text-primary">
              {seat.seatNumbers.join(", ")}
            </span>
          </div>
        </div>

        {/* Fare breakdown — scheduled seats are a flat price each. */}
        <div className="mx-4 mt-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
          <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
            FARE BREAKDOWN
          </span>

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">
                ${perSeat.toFixed(2)} per seat × {seats} seat{seats > 1 ? "s" : ""}
              </span>
              <span className="font-medium text-text-primary">
                ${(perSeat * seats).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
            <span className="text-[14px] font-semibold text-text-primary">Total</span>
            <span className="text-[24px] font-bold leading-none text-primary">
              ${seat.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <PaymentCard
          amount={seat.totalPrice}
          itemName={`${company} scheduled ticket to ${schedule.destination}`}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
