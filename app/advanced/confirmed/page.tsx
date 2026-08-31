"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";

type VehicleType = "bus" | "van";

type StoredSchedule = {
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredSeat = { seatNumber: number; totalPrice: number };

export default function AdvancedConfirmedPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<StoredSchedule | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [travelDate, setTravelDate] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    const scheduleStored = sessionStorage.getItem("booklan_schedule");
    const seatStored = sessionStorage.getItem("booklan_advanced_seat");
    const dateStored = sessionStorage.getItem("booklan_travel_date");
    const ticket = sessionStorage.getItem("booklan_advanced_ticket_id");

    if (!scheduleStored || !seatStored || !ticket) {
      router.replace("/home");
      return;
    }

    setSchedule(JSON.parse(scheduleStored));
    setSeat(JSON.parse(seatStored));
    setTravelDate(dateStored);
    setTicketId(ticket);
  }, [router]);

  if (!schedule || !seat || !ticketId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col items-center px-6 pb-24 pt-12">
        <div className="flex h-20 w-20 animate-[pop-in_0.5s_ease-out] items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-14 w-14 text-success" strokeWidth={2} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-text-primary">Booking Confirmed!</h1>
        <p className="mt-1 text-center text-[14px] text-text-secondary">
          Your seat is reserved for {travelDate}. Show your ticket when boarding.
        </p>

        <div className="mt-6 flex w-full flex-col gap-4 rounded-card bg-primary p-5 text-white">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5" strokeWidth={2.25} />
            <span className="text-sm font-bold">BookLan</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-white/70">Ticket ID</span>
            <span className="font-mono text-3xl font-bold tracking-wide">{ticketId}</span>
          </div>

          <div className="border-t border-dashed border-white/30" />

          <div className="flex flex-col gap-2 text-[14px]">
            <TicketRow label="Company" value={schedule.companies?.name ?? "Unknown"} />
            <TicketRow label="Route" value={`${schedule.origin} → ${schedule.destination}`} />
            <TicketRow label="Travel date" value={travelDate ?? ""} />
            <TicketRow
              label="Departure"
              value={`${schedule.departure_time} – ${schedule.arrival_time}`}
            />
            <TicketRow label="Seat" value={String(seat.seatNumber)} />
            <TicketRow label="Total paid" value={`$${seat.totalPrice.toFixed(2)}`} bold />
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button onClick={() => router.push("/bookings")}>View All Bookings</Button>
          <Button variant="outline" onClick={() => router.push("/advanced")}>
            Search More Buses
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function TicketRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-white/70">{label}</span>
      <span className={`text-right ${bold ? "text-lg font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}
