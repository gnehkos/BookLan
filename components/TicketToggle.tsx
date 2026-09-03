"use client";

import { useState } from "react";
import { Ticket, X } from "lucide-react";
import Portal from "@/components/Portal";
import TicketQr from "@/components/TicketQr";

/**
 * The ticket icon on a current booking, and the pop-up it opens: the Ticket ID
 * and the QR the driver scans, and nothing else. It is what a passenger needs
 * in their hand at the roadside, so it opens in one tap from the list rather
 * than by drilling into the booking.
 */
export default function TicketToggle({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Show ticket and QR code"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-primary transition-colors hover:bg-surface"
      >
        <Ticket className="h-[16px] w-[16px]" />
      </button>

      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-[280px] flex-col items-center rounded-[20px] bg-white p-5 shadow-[var(--shadow-lift)]"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                  TICKET ID
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-secondary"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>

              <span className="mt-0.5 w-full font-mono text-[18px] font-extrabold tracking-[0.5px] text-text-primary">
                {ticketId}
              </span>

              <TicketQr ticketId={ticketId} size={188} className="mt-4" />

              <p className="mt-3 text-center text-[11.5px] leading-[17px] text-text-secondary">
                Show this to your driver. They scan it to confirm they have met
                you and to verify the ticket.
              </p>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
