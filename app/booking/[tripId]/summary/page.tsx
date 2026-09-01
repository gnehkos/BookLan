"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PaymentCard from "@/components/PaymentCard";
import { safeQuery, supabase } from "@/lib/supabase";
import { generateTicketId } from "@/lib/ticket";
import { SERVICE_FEE_USD } from "@/constants/booking";
import { getActivePickupBooking } from "@/lib/activeBooking";

type VehicleType = "bus" | "van";

type StoredTrip = {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  price_per_km: number;
  companies: { name: string; vehicle_type: VehicleType } | null;
};

type StoredPickup = { lat: number; lng: number; stationName?: string; placeName?: string };
type StoredSeat = { seatNumbers: number[]; totalPrice: number };
type StoredDropoff = { id: string; name: string; address: string };

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<StoredTrip | null>(null);
  const [pickup, setPickup] = useState<StoredPickup | null>(null);
  const [seat, setSeat] = useState<StoredSeat | null>(null);
  const [dropoff, setDropoff] = useState<StoredDropoff | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tripStored = sessionStorage.getItem("booklan_trip");
    const pickupStored = sessionStorage.getItem("booklan_pickup");
    const seatStored = sessionStorage.getItem("booklan_seat");
    const dropoffStored = sessionStorage.getItem("booklan_dropoff");

    if (!tripStored || !pickupStored) {
      router.replace("/search");
      return;
    }
    if (!seatStored) {
      router.replace(`/booking/${tripId}`);
      return;
    }
    if (!dropoffStored) {
      router.replace(`/booking/${tripId}/dropoff`);
      return;
    }

    setTrip(JSON.parse(tripStored));
    setPickup(JSON.parse(pickupStored));
    setSeat(JSON.parse(seatStored));
    setDropoff(JSON.parse(dropoffStored));
    setReady(true);
  }, [router, tripId]);

  async function handlePaymentSuccess() {
    if (!trip || !pickup || !seat || !dropoff) return;

    const userId = localStorage.getItem("booklan_user_id");

    // Final guard: the flow blocks this earlier, but a direct navigation must
    // not be able to create a second live pickup booking.
    if (userId) {
      const existing = await getActivePickupBooking(userId);
      if (existing) {
        throw new Error(
          `You already have an active booking (${existing.ticket_id}). Finish or cancel it before booking another pickup.`
        );
      }
    }

    const ticketId = generateTicketId();

    const { data: booking, error: insertError } = await safeQuery(
      supabase
        .from("bookings")
        .insert({
          user_id: userId,
          trip_id: trip.id,
          seat_numbers: seat.seatNumbers,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dropoff_station_id: dropoff.id,
          ticket_id: ticketId,
          status: "confirmed",
          total_price: seat.totalPrice,
          payment_status: "paid",
          distance_remaining_km: trip.distance_km,
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
      const { data: currentTrip } = await supabase
        .from("active_trips")
        .select("seats_available")
        .eq("id", trip.id)
        .single();

      if (currentTrip) {
        await supabase
          .from("active_trips")
          .update({
            // Never let a trip go negative, however the count drifted.
            seats_available: Math.max(
              0,
              currentTrip.seats_available - seat.seatNumbers.length
            ),
          })
          .eq("id", trip.id);
      }
    } catch {
      // seats_available may be stale; not worth blocking a successful booking over.
    }

    sessionStorage.setItem("booklan_ticket_id", ticketId);
    sessionStorage.setItem("booklan_booking_id", booking.id);
    router.push("/booking/confirmed");
  }

  if (!ready || !trip || !pickup || !seat || !dropoff) return null;

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

        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">
              From
            </span>
            <span className="text-[15px] text-text-primary">
              {pickup.stationName ??
                pickup.placeName ??
                `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
            </span>
            <span className="text-[13px] text-text-secondary">
              {pickup.stationName ? "Station pickup" : "Roadside pickup"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">
              To
            </span>
            <span className="text-[15px] text-text-primary">{dropoff.name}</span>
            <span className="text-[13px] text-text-secondary">{dropoff.address}</span>
          </div>

          <div className="my-1 border-t border-dashed border-border" />

          <Row label="Company" value={trip.companies?.name ?? "Unknown"} />
          <Row label="Vehicle type" value={trip.companies?.vehicle_type ?? "bus"} capitalize />
          <Row
            label={seat.seatNumbers.length > 1 ? "Seat numbers" : "Seat number"}
            value={seat.seatNumbers.join(", ")}
          />
          <Row label="Distance" value={`${trip.distance_km} km`} />
          <Row label="Price per km" value={`$${trip.price_per_km.toFixed(2)}`} />
          <Row label="Service fee" value={`$${SERVICE_FEE_USD.toFixed(2)}`} />

          <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[15px] font-bold text-text-primary">Total</span>
            <span className="text-2xl font-bold text-text-primary">
              ${seat.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <PaymentCard
          amount={seat.totalPrice}
          itemName={`${trip.companies?.name ?? "BookLan"} ticket to ${trip.destination}`}
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
