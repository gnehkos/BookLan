"use client";

import BooklanLogo from "@/components/BooklanLogo";

/**
 * The launch screen. Shown while the entry route works out where to send the
 * user, so the wait is branded rather than blank.
 *
 * Navy ground with the mark in white: the teal reappears in the glow behind it
 * and in the loading bar, so the brand pair reads even in a mono treatment.
 */
export default function SplashScreen({ leaving = false }: { leaving?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Teal bloom behind the mark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-secondary/25 blur-[90px]"
      />

      <div className="relative flex animate-[splash-mark_0.7s_cubic-bezier(0.22,1,0.36,1)] flex-col items-center">
        <BooklanLogo tone="mono" className="h-[52px] w-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.25)]" />

        <h1 className="mt-6 text-[34px] font-extrabold leading-none tracking-[-1px] text-white">
          BookLan
        </h1>
        <p className="mt-3 text-[14px] font-medium tracking-[0.2px] text-white/70">
          No station. No waiting.
        </p>
      </div>

      {/* Indeterminate sweep — no fake percentage, it is just a launch beat. */}
      <div className="absolute bottom-20 h-[3px] w-[104px] overflow-hidden rounded-full bg-white/15">
        <span className="block h-full w-1/2 rounded-full bg-secondary animate-[splash-sweep_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
