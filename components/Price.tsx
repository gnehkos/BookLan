/**
 * Ticket price. Deliberately the loudest thing on a card — bold navy, a step
 * larger than the text around it — so it can be scanned without hunting.
 */
export default function Price({
  amount,
  size = "md",
}: {
  amount: number;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={`shrink-0 font-bold text-primary ${
        size === "lg" ? "text-[20px]" : "text-[18px]"
      }`}
    >
      ${amount.toFixed(2)}
    </span>
  );
}
