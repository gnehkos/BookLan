"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BooklanLogo from "@/components/BooklanLogo";
import SplashScreen from "@/components/SplashScreen";
import { useT } from "@/lib/i18n";

/** How long the launch screen holds before the app takes over. */
const SPLASH_MS = 2100;

/**
 * The app's entry point: launch screen, then three-step onboarding shown once.
 * Skipping or finishing records the fact in localStorage so returning users go
 * straight from the splash to the sign-in screen.
 */
const STEPS = [
  {
    image: "/onboarding/step-1.png",
    titleKey: "onboarding.1.title",
    bodyKey: "onboarding.1.body",
  },
  {
    image: "/onboarding/step-2.png",
    titleKey: "onboarding.2.title",
    bodyKey: "onboarding.2.body",
  },
  {
    image: "/onboarding/step-3.png",
    titleKey: "onboarding.3.title",
    bodyKey: "onboarding.3.body",
  },
] as const;

export default function OnboardingPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // The splash always runs its full beat, so the brand does not flash past on a
  // fast connection. Where it hands off is decided underneath it.
  useEffect(() => {
    const onboarded = localStorage.getItem("booklan_onboarded") === "true";

    const fade = setTimeout(() => setSplashLeaving(true), SPLASH_MS);
    const finish = setTimeout(() => {
      setSplashDone(true);
      if (onboarded) {
        router.replace("/auth/login");
      } else {
        setReady(true);
      }
    }, SPLASH_MS + 450);

    return () => {
      clearTimeout(fade);
      clearTimeout(finish);
    };
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

  if (!splashDone) return <SplashScreen leaving={splashLeaving} />;
  if (!ready) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="flex w-full max-w-[393px] flex-col">
        <div className="flex justify-center pt-10">
          <BooklanLogo className="h-5 w-auto opacity-90" />
        </div>

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
              {t(current.titleKey)}
            </h1>
            <p className="mt-3 max-w-[313px] text-center text-[15px] font-medium leading-[24.75px] text-text-muted">
              {t(current.bodyKey)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-6">
          {STEPS.map((s, index) => (
            <button
              key={s.titleKey}
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
            className="w-full rounded-[16px] bg-gradient-to-b from-primary to-primary-dark px-6 py-4 text-[15px] font-bold text-white transition-transform hover:brightness-105 active:scale-[0.99]"
          >
            {isLast ? t("onboarding.getStarted") : t("common.continue")}
          </button>

          {!isLast && (
            <button
              onClick={finish}
              className="w-full p-2 text-center text-[14px] font-semibold text-text-muted"
            >
          {t("common.skip")}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
