"use client";

import { QRCodeSVG } from "qrcode.react";
import { colors } from "@/constants/theme";

/**
 * The ticket's QR code.
 *
 * It encodes the Ticket ID and nothing else. The driver's app scans it at the
 * roadside, which both proves the passenger was actually met and verifies the
 * ticket faster than reading a code aloud. Keeping the payload to the ID means
 * the code stays sparse enough to scan at small sizes and carries nothing
 * personal, since a printed ticket can be photographed by anyone nearby.
 *
 * Rendered as SVG so it stays sharp at any size and needs no canvas.
 */
export default function TicketQr({
  ticketId,
  size = 96,
  className = "",
}: {
  ticketId: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] bg-white p-1.5 ${className}`}
    >
      <QRCodeSVG
        value={ticketId}
        size={size}
        // Navy on white: a tinted code is harder for a scanner to threshold.
        fgColor={colors.primary}
        bgColor="#FFFFFF"
        // Medium recovery survives a scuffed screen without inflating the grid.
        level="M"
        marginSize={0}
        aria-label={`QR code for ticket ${ticketId}`}
      />
    </span>
  );
}
