/**
 * Vehicle type pill. Bus gets the light navy tint, van the light blue one, so
 * the two are distinguishable at a glance on any card without adding new
 * colours to the palette.
 */
export default function VehicleBadge({ type }: { type: "bus" | "van" }) {
  const isVan = type === "van";
  return (
    <span
      className={`shrink-0 rounded-pill px-2.5 py-1 text-[12px] font-medium capitalize ${
        isVan ? "bg-[#EFF6FF] text-secondary" : "bg-[#E8EEF4] text-primary"
      }`}
    >
      {type}
    </span>
  );
}
