"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function PaymentCard({
  amount,
  itemName,
  onSuccess,
}: {
  amount: number;
  itemName: string;
  onSuccess: () => Promise<void> | void;
}) {
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
        setError(payData.error ?? "Payment failed. Please try again.");
        setPaying(false);
        return;
      }

      await onSuccess();
    } catch (thrown) {
      // Surface the real reason. A generic message hid a database column that
      // did not exist yet, which looked like a payment failure for days.
      const reason = thrown instanceof Error ? thrown.message : "";
      setError(reason ? `Couldn't complete the booking: ${reason}` : "Something went wrong. Please try again.");
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
          <img src="/logos/aba.jpg" alt="ABA Bank" className="h-full w-full object-contain" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold text-text-primary">ABA Bank</span>
          <span className="text-[13px] text-text-secondary">Pay with your ABA Account</span>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button loading={paying} onClick={handlePay}>
        Pay ${amount.toFixed(2)} with ABA
      </Button>
    </div>
  );
}
