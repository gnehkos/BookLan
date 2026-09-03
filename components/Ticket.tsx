import CompanyLogo from "@/components/CompanyLogo";

/**
 * Boarding ticket, shaped like a paper one: a white stub with punched notches
 * either side of a perforated tear line, details above, the ticket ID below.
 * The notches are rendered as circles in the page background colour so the
 * cut-out reads correctly whatever sits behind the card.
 */
export type TicketDetail = { label: string; value: string };

export default function Ticket({
  company,
  route,
  ticketId,
  details,
  fare,
  footnote,
  notchColorClass = "bg-surface",
}: {
  company: string;
  route: string;
  ticketId: string;
  details: TicketDetail[];
  /** Optional fare breakdown, rendered under the details. */
  fare?: React.ReactNode;
  footnote?: string;
  /** Must match the surface behind the ticket for the notches to look punched. */
  notchColorClass?: string;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-[16px] bg-white shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-3 p-4">
        <CompanyLogo name={company} size={44} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-text-primary">{company}</span>
          <span className="truncate text-[12px] text-text-secondary">{route}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 pb-4">
        {details.map((detail) => (
          <div key={detail.label} className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">
              {detail.label.toUpperCase()}
            </span>
            <span className="truncate text-[14px] font-semibold text-text-primary">
              {detail.value}
            </span>
          </div>
        ))}
      </div>

      {fare && (
        <div className="mx-4 mb-4 rounded-[12px] bg-surface p-3.5">{fare}</div>
      )}

      {/* Tear line: punched notches with a dashed perforation between them. */}
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

      <div className="flex flex-col items-center gap-1 px-4 pb-5 pt-4">
        <span className="text-[10px] font-bold tracking-[0.4px] text-text-muted">TICKET ID</span>
        <span className="font-mono text-[22px] font-bold tracking-[1px] text-text-primary">
          {ticketId}
        </span>
        {footnote && (
          <span className="mt-1 text-center text-[11px] text-text-muted">{footnote}</span>
        )}
      </div>
    </div>
  );
}
