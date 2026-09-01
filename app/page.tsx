"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Three-step onboarding, shown once. Skipping or finishing records the fact in
 * localStorage so returning users land straight on the sign-in screen.
 */
const STEPS = [
  {
    image: "/onboarding/step-1.png",
    title: "Book from anywhere",
    body: "No station needed. Flag down any bus or van right from where you stand on the national road.",
  },
  {
    image: "/onboarding/step-2.png",
    title: "Pre-book in advance",
    body: "Schedule your trip a day ahead. Pick your route, date, and seats — all locked in before you travel.",
  },
  {
    image: "/onboarding/step-3.png",
    title: "Pay and get picked up",
    body: "Pay securely in-app with E-Bank app, or your card. Show your Ticket ID to the driver and hop on.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("booklan_onboarded") === "true") {
      router.replace("/auth/login");
      return;
    }
    setReady(true);
  }, [router]);

  function finish() {
    localStorage.setItem("booklan_onboarded", "true");
    router.push("/auth/login");
  }

  function next() {
    if (step === STEPS.length - 1) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  }

  if (!ready) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="flex w-full max-w-[393px] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-10">
          {/* Keyed so the illustration and copy re-animate on every step. */}
          <div key={step} className="flex animate-[step-in_0.35s_ease-out] flex-col items-center">
            <div className="flex h-[190px] w-[190px] items-center justify-center overflow-hidden rounded-[44px] bg-accent">
              <Image
                src={current.image}
                alt=""
                width={190}
                height={190}
                priority={step === 0}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="mt-11 max-w-[280px] text-center text-[26px] font-extrabold leading-[39px] tracking-[-0.7px] text-text-primary">
              {current.title}
            </h1>
            <p className="mt-3 max-w-[313px] text-center text-[15px] font-medium leading-[24.75px] text-text-muted">
              {current.body}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-6">
          {STEPS.map((s, index) => (
            <button
              key={s.title}
              onClick={() => setStep(index)}
              aria-label={`Go to step ${index + 1}`}
              aria-current={index === step ? "step" : undefined}
              className={`h-2 rounded-[4px] transition-all duration-300 ${
                index === step ? "w-7 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2.5 px-6 pb-14">
          <button
            onClick={next}
            className="w-full rounded-[16px] bg-gradient-to-b from-primary to-primary-dark px-6 py-4 text-[15px] font-bold text-white shadow-[0_4px_10px_rgba(26,58,92,0.28)] hover:brightness-110"
          >
            {isLast ? "Get Started" : "Continue"}
          </button>

          {!isLast && (
            <button
              onClick={finish}
              className="w-full p-2 text-center text-[14px] font-semibold text-text-muted"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
