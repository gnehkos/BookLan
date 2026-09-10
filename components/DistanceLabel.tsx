import { MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Distance readout: grey pin, dark number. Readable at a glance but visually
 * quieter than the price, so the two don't compete on the same card.
 */
export default function DistanceLabel({ km, suffix }: { km: number; suffix?: string }) {
  const t = useT();
  return (
    <span className="flex items-center gap-1 text-[14px]">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
      <span className="font-medium text-text-primary">{t("common.kmValue", { km })}</span>
      {suffix && <span className="text-text-secondary">{suffix}</span>}
    </span>
  );
}
