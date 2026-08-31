"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import Button from "@/components/Button";
import GoogleIcon from "@/components/GoogleIcon";
import Logo from "@/components/Logo";
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
      <div className="flex w-full max-w-[390px] flex-1 flex-col px-6 pb-8 pt-20">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Logo />
          <p className="max-w-[280px] text-center text-[15px] leading-6 text-text-secondary">
            Book a seat on any passing intercity bus. No station. No waiting.
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
          <Button
            variant="outline"
            icon={<GoogleIcon />}
            loading={googleLoading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
          <p className="mt-2 text-center text-xs text-text-secondary">
            By continuing, you agree to BookLan&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
