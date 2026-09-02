"use client";

import BooklanLogo from "@/components/BooklanLogo";

/**
 * The launch screen.
 *
 * The mark is three separate shapes, so instead of fading in it assembles: each
 * piece rides in from the left, overshoots and settles, staggered so the logo
 * builds itself on a road that draws underneath it. Speed lines flick past as
 * it arrives, which is the whole idea of the product in one gesture — something
 * pulling in to collect you.
 *
 * The ground is light because the logo is drawn in its own navy and teal and is
 * never repainted to suit a background.
 */
export default function SplashScreen({ leaving = false }: { leaving?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative flex h-[70px] items-center justify-center">
          {/* Speed lines, trailing off to the left of the arriving mark. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 -left-24 w-24">
            {[
              { top: "34%", width: 26, delay: "0.20s", opacity: 0.5 },
              { top: "50%", width: 38, delay: "0.30s", opacity: 0.75 },
              { top: "66%", width: 20, delay: "0.42s", opacity: 0.4 },
            ].map((line) => (
              <span
                key={line.top}
                style={{
                  top: line.top,
                  width: line.width,
                  animationDelay: line.delay,
                  opacity: line.opacity,
                }}
                className="absolute right-2 h-[3px] origin-right rounded-full bg-secondary/50 animate-[speed-line_0.75s_ease-out_forwards]"
              />
            ))}
          </div>

          <BooklanLogo assemble className="relative h-[56px] w-auto" />
        </div>

        {/* The road it arrives on, drawn left to right beneath the mark. */}
        <span
          aria-hidden
          className="mt-1 h-[3px] w-[188px] origin-left rounded-full bg-gradient-to-r from-primary/0 via-primary/25 to-primary/0 animate-[road-draw_0.7s_cubic-bezier(0.22,1,0.36,1)_forwards]"
        />

        <h1 className="mt-7 text-[32px] font-extrabold leading-none tracking-[-1px] text-primary opacity-0 animate-[splash-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_0.75s_forwards]">
          BookLan
        </h1>
        <p className="mt-3 text-[13.5px] font-medium tracking-[0.2px] text-text-muted opacity-0 animate-[splash-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_0.95s_forwards]">
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
