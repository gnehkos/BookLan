"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";
import FareBreakdown from "@/components/FareBreakdown";
import Ticket from "@/components/Ticket";

type VehicleType = "bus" | "van";

type StoredTrip = {
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredSeat = { seatNumbers: number[]; totalPrice: number };
type StoredDropoff = { name: string };

export default function ConfirmedPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<StoredTrip | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [dropoff, setDropoff] = useState<StoredDropoff | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const tripStored = sessionStorage.getItem("booklan_trip");
    const seatStored = sessionStorage.getItem("booklan_seat");
    const dropoffStored = sessionStorage.getItem("booklan_dropoff");
    const ticket = sessionStorage.getItem("booklan_ticket_id");
    const booking = sessionStorage.getItem("booklan_booking_id");

    if (!tripStored || !seatStored || !dropoffStored || !ticket || !booking) {
      router.replace("/home");
      return;
    }

    setTrip(JSON.parse(tripStored));
    setSeat(JSON.parse(seatStored));
    setDropoff(JSON.parse(dropoffStored));
    setTicketId(ticket);
    setBookingId(booking);
  }, [router]);

  if (!trip || !seat || !dropoff || !ticketId || !bookingId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex w-full max-w-[390px] flex-1 flex-col items-center px-6 pb-24 pt-12">
        <div className="flex h-20 w-20 animate-[pop-in_0.5s_ease-out] items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-14 w-14 text-success" strokeWidth={2} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-text-primary">Booking Confirmed!</h1>
        <p className="mt-1 text-center text-[14px] text-text-secondary">
          Your seat is reserved. Show your ticket to the driver when boarding.
        </p>

        <div className="mt-6 w-full">
          <Ticket
            company={trip.companies?.name ?? "BookLan"}
            route={`${trip.origin} → ${trip.destination}`}
            ticketId={ticketId}
            details={[
              { label: "Vehicle", value: trip.companies?.vehicle_type ?? "bus" },
              {
                label: seat.seatNumbers.length > 1 ? "Seats" : "Seat",
                value: seat.seatNumbers.join(", "),
              },
              { label: "Drop-off", value: dropoff.name },
            ]}
            fare={
              <FareBreakdown
                distanceKm={trip.distance_km}
                pricePerKm={trip.price_per_km}
                seats={seat.seatNumbers.length}
                total={seat.totalPrice}
              />
            }
            footnote="Show this ID to the driver when boarding"
          />
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button onClick={() => router.push(`/tracking/${bookingId}`)}>Track My Bus</Button>
          <Button variant="outline" onClick={() => router.push("/bookings")}>
            View All Bookings
          </Button>
        </div>
      </div>

    </div>
  );
}
