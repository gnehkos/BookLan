import { ArrowRight } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";

/**
 * A booking rendered as a paper receipt: details on the upper half, a punched
 * tear line, then the ticket ID and total on the stub below.
 *
 * The booking-type tag sits on its own line above the route rather than beside
 * it — inline it squeezed the route into "Phnom Pe… Siem Rea…".
 */
export type ReceiptRow = { label: string; value: string; icon?: React.ReactNode };

export default function BookingReceipt({
  company,
  vehicleBadge,
  typeTag,
  origin,
  destination,
  rows,
  fare,
  ticketId,
  statusSlot,
  actions,
  topActions,
  notchColorClass = "bg-surface",
}: {
  company: string;
  vehicleBadge?: React.ReactNode;
  typeTag: React.ReactNode;
  origin?: string;
  destination?: string;
  rows: ReceiptRow[];
  /** Optional fare breakdown, rendered under the rows. */
  fare?: React.ReactNode;
  ticketId: string;
  statusSlot?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small controls in the top-right corner, used by booking history. */
  topActions?: React.ReactNode;
  /** Must match the surface behind the card for the notches to look punched. */
  notchColorClass?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-white shadow-[var(--shadow-float)]">
      <div className="p-4">
        {/* Tag first, on its own line — the route then gets the full width. */}
        <div className="flex items-center gap-2">
          {typeTag}
          {vehicleBadge}
          {topActions && <span className="ml-auto flex shrink-0 gap-1.5">{topActions}</span>}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <CompanyLogo name={company} size={40} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold text-text-primary">
              <span className="truncate">{origin ?? "Unknown"}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="truncate">{destination ?? "Unknown"}</span>
            </span>
            <span className="truncate text-[12px] text-text-secondary">{company}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
                {row.label.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 truncate text-[13px] font-semibold text-text-primary">
                {row.icon}
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {fare && <div className="mt-3 rounded-[12px] bg-surface p-3">{fare}</div>}
      </div>

      {/* Tear line */}
      <div className="relative flex items-center">
        <span
          className={`absolute -left-2.5 h-5 w-5 rounded-full ${notchColorClass}`}
          aria-hidden
        />
        <span className="mx-5 flex-1 border-t border-dashed border-border" />
        <span
          className={`absolute -right-2.5 h-5 w-5 rounded-full ${notchColorClass}`}
          aria-hidden
        />
      </div>

      <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TICKET ID</span>
          <span className="truncate font-mono text-[14px] font-bold text-text-primary">
            {ticketId}
          </span>
        </div>
        {/* No fare here: the breakdown above already ends on the total, and
            repeating it made the stub read as a second, different charge. */}
        <div className="flex shrink-0 items-center">{statusSlot}</div>
      </div>

      {actions && <div className="px-4 pb-4">{actions}</div>}
    </div>
  );
}
