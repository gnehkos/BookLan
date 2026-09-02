"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
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
type StoredDropoff = { id: string; name: string; address: string };

export default function AdvancedSummaryPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<StoredSchedule | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [travelDate, setTravelDate] = useState<string | null>(null);
  const [dropoff, setDropoff] = useState<StoredDropoff | null>(null);
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

    const dropoffStored = sessionStorage.getItem("booklan_advanced_dropoff");
    if (!dropoffStored) {
      router.replace("/advanced/dropoff");
      return;
    }

    setSchedule(parsedSchedule);
    setSeat(JSON.parse(seatStored));
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
    sessionStorage.removeItem("booklan_advanced_dropoff");
    router.push("/advanced/confirmed");
  }

  if (!ready || !schedule || !seat) return null;

  const company = schedule.companies?.name ?? "Unknown operator";
  const seatLabel = seat.seatNumbers.length > 1 ? "Seats" : "Seat";
  const dropoffLabel = dropoff?.name ?? "Selected station";

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-1 flex-col pb-28">
        <div className="flex items-center gap-3 px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
            Confirm booking
          </h1>
        </div>

        {/* Operator, then the journey drawn as a route rather than as rows of
            label/value pairs — the start and end are what people check. */}
        <div className="mx-4 rounded-card bg-white p-4 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-3">
            <CompanyLogo name={company} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-bold text-text-primary">{company}</span>
              <span className="text-[12px] capitalize text-text-secondary">
                {schedule.companies?.vehicle_type ?? "bus"} · {travelDate}
              </span>
            </div>
          </div>

          <div className="my-4 h-px bg-border" />

          <div className="flex gap-3">
            {/* The route spine: filled dot, run, hollow dot. */}
            <div className="flex flex-col items-center pt-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="my-1 w-px flex-1 bg-border" />
              <span className="h-2.5 w-2.5 rounded-full border-[2.5px] border-primary bg-white" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">
                    DEPARTS
                  </span>
                  <span className="truncate text-[15px] font-bold text-text-primary">
                    {schedule.origin}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[14px] font-semibold text-text-primary">
                  {schedule.departure_time}
                </span>
              </div>

              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">
                    ARRIVES
                  </span>
                  <span className="truncate text-[15px] font-bold text-text-primary">
                    {schedule.destination}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] text-text-secondary">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{dropoffLabel}</span>
                  </span>
                  {dropoff?.address && (
                    <span className="truncate text-[11.5px] text-text-muted">
                      {dropoff.address}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[14px] font-semibold text-text-primary">
                  {schedule.arrival_time}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3 flex gap-3">
          <div className="flex flex-1 flex-col gap-1 rounded-card bg-white p-4 shadow-[var(--shadow-soft)]">
            <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">
              {seatLabel.toUpperCase()}
            </span>
            <span className="text-[16px] font-bold text-text-primary">
              {seat.seatNumbers.join(", ")}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1 rounded-card bg-white p-4 shadow-[var(--shadow-soft)]">
            <span className="text-[10px] font-bold tracking-[0.5px] text-text-muted">TOTAL</span>
            <span className="text-[16px] font-bold text-text-primary">
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
