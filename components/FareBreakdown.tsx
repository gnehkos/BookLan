import { SERVICE_FEE_USD } from "@/constants/booking";

/**
 * How a fare was arrived at, shown on the ticket and on saved receipts.
 *
 * Roadside fares are charged per kilometre, so the distance and the rate are
 * spelled out rather than only the total — a passenger checking a receipt
 * later should be able to see where the number came from.
 */
export default function FareBreakdown({
  distanceKm,
  pricePerKm,
  seats,
  total,
  compact = false,
}: {
  distanceKm: number;
  pricePerKm: number;
  seats: number;
  total: number;
  /** Tighter type, for the receipt cards in a list. */
  compact?: boolean;
}) {
  const perSeat = distanceKm * pricePerKm;
  const size = compact ? "text-[11px]" : "text-[12px]";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
        FARE BREAKDOWN
      </span>

      <Line
        size={size}
        label={`${distanceKm} km × $${pricePerKm.toFixed(2)}/km`}
        value={`$${perSeat.toFixed(2)}`}
      />
      <Line
        size={size}
        label={`× ${seats} seat${seats > 1 ? "s" : ""}`}
        value={`$${(perSeat * seats).toFixed(2)}`}
      />
      <Line size={size} label="Service fee" value={`$${SERVICE_FEE_USD.toFixed(2)}`} />

      <div className="mt-1 flex items-center justify-between border-t border-dashed border-border pt-1.5">
        <span className={`${size} font-bold text-text-primary`}>Total paid</span>
        <span className="text-[15px] font-extrabold text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Line({ label, value, size }: { label: string; value: string; size: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`${size} text-text-secondary`}>{label}</span>
      <span className={`${size} font-medium text-text-primary`}>{value}</span>
    </div>
  );
}
