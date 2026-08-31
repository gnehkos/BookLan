"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";

const COUNTRY_CODE = "+855";

function formatLocalNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

export default function PhoneEntryPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const digits = value.replace(/\D/g, "");
  const isValid = digits.length === 8 || digits.length === 9;

  const displayNumber = useMemo(() => formatLocalNumber(value), [value]);

  async function handleContinue() {
    if (!isValid || loading) return;
    setLoading(true);

    const fullPhone = `${COUNTRY_CODE}${digits}`;
    sessionStorage.setItem("booklan_phone", fullPhone);

    router.push("/auth/profile");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col px-6 pb-8 pt-6">
        <button
          onClick={() => router.push("/")}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" />
        </button>

        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">
            What&apos;s your phone number?
          </h1>
          <p className="text-[15px] leading-6 text-text-secondary">
            We&apos;ll use this to identify your bookings.
          </p>
        </div>

        <div className="mt-8">
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-text-primary">
            Phone number
          </label>
          <div className="flex h-14 items-center gap-2 rounded-card border border-border bg-white px-4 focus-within:border-primary">
            <span className="text-[15px] font-semibold text-text-primary">
              {COUNTRY_CODE}
            </span>
            <span className="h-6 w-px bg-border" />
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="12 345 6789"
              value={displayNumber}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
          {value.length > 0 && !isValid && (
            <p className="mt-2 text-sm text-error">Enter a valid Cambodian phone number.</p>
          )}
        </div>

        <div className="mt-auto pt-8">
          <Button disabled={!isValid} loading={loading} onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
