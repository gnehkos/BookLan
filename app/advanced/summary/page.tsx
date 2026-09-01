"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
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

export default function AdvancedSummaryPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<StoredSchedule | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [travelDate, setTravelDate] = useState<string | null>(null);
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

    setSchedule(parsedSchedule);
    setSeat(JSON.parse(seatStored));
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
    router.push("/advanced/confirmed");
  }

  if (!ready || !schedule || !seat) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col bg-surface pb-24">
        <div className="flex items-center gap-2 bg-white px-4 pt-6 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-6 w-6 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-semibold text-text-primary">Confirm Booking</h1>
        </div>

        <div className="mx-4 mt-4 flex flex-col gap-2 rounded-card bg-white p-4 shadow-sm">
          <Row label="Company" value={schedule.companies?.name ?? "Unknown"} />
          <Row label="Vehicle type" value={schedule.companies?.vehicle_type ?? "bus"} capitalize />
          <Row label="Route" value={`${schedule.origin} → ${schedule.destination}`} />
          <Row label="Travel date" value={travelDate ?? ""} />
          <Row label="Departure" value={`${schedule.departure_time} – ${schedule.arrival_time}`} />
          <Row
            label={seat.seatNumbers.length > 1 ? "Seat numbers" : "Seat number"}
            value={seat.seatNumbers.join(", ")}
          />

          <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[15px] font-bold text-text-primary">Total</span>
            <span className="text-2xl font-bold text-text-primary">
              ${seat.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <PaymentCard
          amount={seat.totalPrice}
          itemName={`${schedule.companies?.name ?? "BookLan"} scheduled ticket to ${schedule.destination}`}
          onSuccess={handlePaymentSuccess}
        />
      </div>

      <BottomNav />
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[14px]">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <span
        className={`text-right font-medium text-text-primary ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
