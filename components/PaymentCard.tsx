"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
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
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  return (
    <div className="mx-4 mt-4 flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-text-primary">ABA PayWay</span>
          <span className="text-[13px] text-text-secondary">
            Pay securely with your ABA account or card
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button loading={paying} onClick={handlePay}>
        Pay ${amount.toFixed(2)} with ABA
      </Button>
    </div>
  );
}
