"use client";

import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import Button from "@/components/Button";
import type { ActivePickupBooking } from "@/lib/activeBooking";

/**
 * Shown when a passenger tries to start a second roadside pickup booking while
 * one is still running. Scheduled bookings aren't blocked, so it points there
 * as the alternative rather than being a dead end.
 */
export default function ActiveBookingModal({
  booking,
  onClose,
}: {
  booking: ActivePickupBooking;
  onClose: () => void;
}) {
  const router = useRouter();
  const destination = booking.active_trips?.destination;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] animate-[slide-up_0.25s_ease-out] rounded-t-[24px] bg-white p-4 pb-6"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Ticket className="h-6 w-6 text-primary" />
          </span>
          <span className="text-[16px] font-semibold text-text-primary">
            You already have a bus on the way
          </span>
          <p className="text-center text-[12px] text-text-secondary">
            Your booking {booking.ticket_id}
            {destination ? ` to ${destination}` : ""} is still active. Finish or cancel it before
            booking another pickup — scheduled tickets can still be booked any time.
          </p>

          <div className="mt-2 flex w-full flex-col gap-2">
            <Button onClick={() => router.push(`/tracking/${booking.id}`)}>
              View my booking
            </Button>
            <Button variant="outline" onClick={() => router.push("/advanced")}>
              Book a scheduled ticket
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
