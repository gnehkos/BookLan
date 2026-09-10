"use client";

import { useState } from "react";
import Button from "@/components/Button";
import { useT } from "@/lib/i18n";

export default function PaymentCard({
  amount,
  itemName,
  onSuccess,
}: {
  amount: number;
  itemName: string;
  onSuccess: () => Promise<void> | void;
}) {
  const t = useT();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setPaying(true);
    setError(null);

    try {
      const userName = localStorage.getItem("booklan_user_name") ?? "";
      const userPhone = localStorage.getItem("booklan_phone") ?? "";
      const [firstname, ...rest] = userName.trim().split(" ");

      const payRes = await fetch("/api/aba-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          itemName,
          firstname: firstname || undefined,
          lastname: rest.join(" ") || undefined,
          phone: userPhone || undefined,
        }),
      });
      const payData = await payRes.json();

      if (!payData.success) {
        setError(payData.error ?? t("payment.failed"));
        setPaying(false);
        return;
      }

      await onSuccess();
    } catch {
      setError(t("payment.error"));
      setPaying(false);
    }
  }

  return (
    <div className="mx-4 mt-4 flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* The bank's own logo, not a generic card glyph — people recognise
            the brand they are about to pay from. */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/aba.jpg" alt={t("payment.bank")} className="h-full w-full object-contain" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold text-text-primary">{t("payment.bank")}</span>
          <span className="text-[13px] text-text-secondary">{t("payment.subtitle")}</span>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button loading={paying} onClick={handlePay}>
        {t("payment.pay", { amount: amount.toFixed(2) })}
      </Button>
    </div>
  );
}
