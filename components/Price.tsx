/**
 * Ticket price. The loudest thing on a card by design — bold navy on a tinted
 * chip so it can be spotted without reading anything else. `plain` drops the
 * chip for places that already sit on a tinted surface (totals, summaries).
 */
export default function Price({
  amount,
  size = "md",
  plain = false,
}: {
  amount: number;
  size?: "md" | "lg";
  plain?: boolean;
}) {
  const text = size === "lg" ? "text-[22px]" : "text-[18px]";

  if (plain) {
    return <span className={`shrink-0 font-bold text-primary ${text}`}>${amount.toFixed(2)}</span>;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-baseline rounded-[10px] bg-accent px-2.5 py-1 font-bold leading-tight text-primary ${text}`}
    >
      ${amount.toFixed(2)}
    </span>
  );
}
