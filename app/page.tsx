"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, Phone } from "lucide-react";
import Button from "@/components/Button";
import GoogleIcon from "@/components/GoogleIcon";
import { supabase } from "@/lib/supabase";

export default function WelcomePage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/phone` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <div className="flex w-full max-w-[390px] flex-1 flex-col px-6 pb-8 pt-16">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-8">
          <div className="flex h-[190px] w-[190px] items-center justify-center rounded-[44px] bg-accent">
            <Bus className="h-20 w-20 text-primary" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-center text-[26px] font-extrabold tracking-[-0.7px] text-text-primary">
              Book from anywhere
            </h1>
            <p className="max-w-[280px] text-center text-[15px] leading-6 text-text-muted">
              Book a seat on any passing intercity bus. No station. No waiting.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {error && <p className="text-center text-sm text-error">{error}</p>}
          <Button
            icon={<Phone className="h-5 w-5" />}
            onClick={() => router.push("/auth/phone")}
          >
            Continue with Phone Number
          </Button>
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
