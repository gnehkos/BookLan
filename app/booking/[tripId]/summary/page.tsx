"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import VehicleBadge from "@/components/VehicleBadge";
import PaymentCard from "@/components/PaymentCard";
import { safeQuery, supabase } from "@/lib/supabase";
import { generateTicketId } from "@/lib/ticket";
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
          pickup_name: pickup.stationName ?? pickup.placeName ?? null,
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

        {/* Journey: pickup and drop-off joined by a connector, so the trip
            reads as one route rather than two unrelated fields. */}
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
                  PICKUP POINT
                </span>
                <span className="truncate text-[15px] font-semibold text-text-primary">
                  {pickup.stationName ??
                    pickup.placeName ??
                    `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                </span>
                <span className="text-[12px] text-text-secondary">
                  {pickup.stationName ? "Station pickup" : "Roadside pickup"}
                </span>
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                  DROP-OFF STATION
                </span>
                <span className="truncate text-[15px] font-semibold text-primary">
                  {dropoff.name}
                </span>
                <span className="truncate text-[12px] text-text-secondary">{dropoff.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Who's carrying you */}
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
          <CompanyLogo name={trip.companies?.name ?? "Unknown"} size={44} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[15px] font-semibold text-text-primary">
              {trip.companies?.name ?? "Unknown company"}
            </span>
            <div className="flex items-center gap-2">
              <VehicleBadge type={trip.companies?.vehicle_type ?? "bus"} />
              <span className="text-[12px] text-text-secondary">
                to {trip.destination}
              </span>
            </div>
          </div>
        </div>

        {/* Seats and total kept apart from the rest: they are the two numbers
            a passenger checks before paying. */}
        <div className="mx-4 mt-3 flex gap-3">
          <div className="flex flex-1 flex-col gap-1 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
            <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
              {seat.seatNumbers.length > 1 ? "SEATS" : "SEAT"}
            </span>
            <span className="truncate text-[17px] font-extrabold text-text-primary">
              {seat.seatNumbers.join(", ")}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1 rounded-[12px] bg-white p-4 shadow-[var(--shadow-float)]">
            <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TOTAL</span>
            <span className="truncate text-[17px] font-extrabold text-primary">
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

    </div>
  );
}
