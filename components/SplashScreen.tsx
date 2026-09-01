"use client";

import BooklanLogo from "@/components/BooklanLogo";

/**
 * The launch screen. Shown while the entry route works out where to send the
 * user, so the wait is branded rather than blank.
 *
 * The ground is deliberately light: the logo is drawn in its own navy and
 * teal, so the background is chosen to suit the artwork rather than the
 * artwork being repainted to sit on a dark one.
 */
export default function SplashScreen({ leaving = false }: { leaving?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex animate-[splash-mark_0.7s_cubic-bezier(0.22,1,0.36,1)] flex-col items-center">
        <BooklanLogo className="h-[54px] w-auto" />

        <h1 className="mt-7 text-[32px] font-extrabold leading-none tracking-[-1px] text-primary">
          BookLan
        </h1>
        <p className="mt-3 text-[13.5px] font-medium tracking-[0.2px] text-text-muted">
          No station. No waiting.
        </p>
      </div>

      {/* Indeterminate sweep — no fake percentage, it is just a launch beat. */}
      <div className="absolute bottom-20 h-[3px] w-[104px] overflow-hidden rounded-full bg-border">
        <span className="block h-full w-1/2 rounded-full bg-primary animate-[splash-sweep_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
