"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Button from "@/components/Button";
import { safeQuery, supabase } from "@/lib/supabase";

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
  const [error, setError] = useState<string | null>(null);
  const [googleAccount, setGoogleAccount] = useState<string | null>(null);

  /**
   * Google hands back here after OAuth. Read the session so the sign-in is
   * visibly acknowledged, and stash the profile details to prefill the
   * create-account step — otherwise "Continue with Google" is indistinguishable
   * from the plain phone flow.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (cancelled || !user) return;

      setGoogleAccount(user.email ?? null);

      const meta = user.user_metadata ?? {};
      const fullName = (meta.full_name ?? meta.name) as string | undefined;
      const avatar = (meta.avatar_url ?? meta.picture) as string | undefined;
      if (fullName) localStorage.setItem("booklan_google_name", fullName);
      if (avatar) localStorage.setItem("booklan_google_avatar", avatar);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const digits = value.replace(/\D/g, "");
  const isValid = digits.length === 8 || digits.length === 9;

  const displayNumber = useMemo(() => formatLocalNumber(value), [value]);

  async function handleContinue() {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);

    const fullPhone = `${COUNTRY_CODE}${digits}`;
    localStorage.setItem("booklan_phone", fullPhone);

    // Returning numbers sign straight in; only new ones go on to create an
    // account, so existing users aren't asked to register again.
    const { data, error: lookupError } = await safeQuery(
      supabase.from("users").select("id, name").eq("phone", fullPhone).maybeSingle()
    );

    if (lookupError) {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
      return;
    }

    if (data) {
      localStorage.setItem("booklan_user_id", data.id);
      localStorage.setItem("booklan_user_name", data.name ?? "");
      document.cookie = `booklan_session=${data.id}; path=/; max-age=2592000; samesite=lax`;
      router.push("/home");
      return;
    }

    router.push("/auth/profile");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col px-6 pb-8 pt-6">
        <button
          onClick={() => router.push("/auth/login")}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
        >
          <ArrowLeft className="h-6 w-6 text-text-primary" />
        </button>

        {googleAccount && (
          <div className="mt-6 flex items-center gap-2 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-3">
            <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />
            <span className="min-w-0 flex-1 text-[13px] text-text-primary">
              Signed in as <span className="font-semibold">{googleAccount}</span>
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
            What&apos;s your phone number?
          </h1>
          <p className="text-[15px] leading-6 text-text-muted">
            We&apos;ll use this to identify your bookings.
          </p>
        </div>

        <div className="mt-11">
          <label
            htmlFor="phone"
            className="mb-2.5 block text-[12px] font-bold tracking-[0.4px] text-text-secondary"
          >
            PHONE NUMBER
          </label>
          <div className="flex h-[54px] items-center gap-3.5 rounded-2xl border border-border bg-surface px-5 focus-within:border-primary">
            <span className="text-[15px] font-bold text-text-primary">
              {COUNTRY_CODE}
            </span>
            <span className="h-[18px] w-px bg-border" />
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

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-auto pt-8">
          <Button disabled={!isValid} loading={loading} onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
