"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";
import Ticket from "@/components/Ticket";
import { useT } from "@/lib/i18n";

type VehicleType = "bus" | "van";

type StoredSchedule = {
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredSeat = { seatNumbers: number[]; totalPrice: number };

export default function AdvancedConfirmedPage() {
  const router = useRouter();
  const t = useT();
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

        <h1 className="mt-5 text-2xl font-bold text-text-primary">{t("confirmed.title")}</h1>
        <p className="mt-1 text-center text-[14px] text-text-secondary">
          Your seat is reserved for {travelDate}. Show your ticket when boarding.
        </p>

        <div className="mt-6 w-full">
          <Ticket
            company={schedule.companies?.name ?? "BookLan"}
            route={`${schedule.origin} → ${schedule.destination}`}
            ticketId={ticketId}
            details={[
              { label: t("common.travelDate"), value: travelDate ?? "" },
              {
                label: t("common.departure"),
                value: `${schedule.departure_time} – ${schedule.arrival_time}`,
              },
              {
                label: seat.seatNumbers.length > 1 ? t("common.seats") : t("common.seat"),
                value: seat.seatNumbers.join(", "),
              },
              { label: t("common.totalPaid"), value: `$${seat.totalPrice.toFixed(2)}` },
            ]}
            footnote={t("confirmed.showId")}
          />
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button onClick={() => router.push("/bookings")}>{t("confirmed.viewAll")}</Button>
          <Button variant="outline" onClick={() => router.push("/advanced")}>{t("confirmed.searchMore")}</Button>
        </div>
      </div>

    </div>
  );
}
