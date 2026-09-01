"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import BooklanLogo from "@/components/BooklanLogo";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    // Google users still land on the phone step — a driver needs a number to
    // call, so it's required however you sign in.
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/phone` },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="flex w-full max-w-[393px] flex-col px-6 pb-14 pt-24">
        <div className="flex flex-1 flex-col">
          {/* The mark itself rather than a stock bus glyph, on a light tile so
              it keeps its own colours. */}
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px] border border-border bg-white shadow-[var(--shadow-soft)]">
            <BooklanLogo className="h-6 w-auto" />
          </div>

          {/* Deliberately neutral: this screen is the entry point for new
              accounts as well as returning ones. */}
          <h1 className="mt-8 text-[30px] font-extrabold leading-[45px] tracking-[-0.8px] text-text-primary">
            Let&apos;s get you moving
          </h1>
          <p className="mt-2 text-[15px] font-medium leading-[22.5px] text-text-muted">
            Sign in or create an account to book your seat.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {error && <p className="text-center text-sm text-error">{error}</p>}

          <Button
            icon={<Phone className="h-5 w-5" />}
            onClick={() => router.push("/auth/phone")}
          >
            Continue with Phone Number
          </Button>

          <div className="flex items-center gap-4 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[13px] font-medium text-text-muted">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            icon={<GoogleIcon />}
            loading={googleLoading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          <p className="mt-2 text-center text-xs text-text-muted">
            By continuing, you agree to BookLan&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
