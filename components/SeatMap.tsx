"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

export type VehicleType = "bus" | "van";

const SEATS_PER_ROW = 4;

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SeatMap({
  seatsTotal,
  seatsAvailable,
  selectedSeats,
  onToggle,
  seedKey,
}: {
  seatsTotal: number;
  seatsAvailable: number;
  selectedSeats: number[];
  onToggle: (seat: number) => void;
  seedKey: string;
}) {
  const rows = Math.ceil(seatsTotal / SEATS_PER_ROW);
  const atLimit = selectedSeats.length >= seatsAvailable;

  /**
   * Which seats are already taken. Derived from `seedKey` rather than
   * Math.random so the layout is stable across re-renders and identical on
   * server and client, and sized so the free seats match `seats_available`.
   */
  const takenSeats = useMemo(() => {
    const takenCount = Math.max(0, seatsTotal - seatsAvailable);
    const random = mulberry32(hashSeed(seedKey));
    const taken = new Set<number>();
    let guard = 0;
    while (taken.size < takenCount && guard < seatsTotal * 20) {
      taken.add(Math.floor(random() * seatsTotal) + 1);
      guard++;
    }
    return taken;
  }, [seatsTotal, seatsAvailable, seedKey]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 text-[11px] font-medium text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-[18px] w-[18px] rounded-[5px] border border-border bg-surface" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-primary bg-primary">
            <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />
          </span>
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-border bg-border">
            <X className="h-[9px] w-[9px] text-text-secondary" strokeWidth={3} />
          </span>
          Occupied
        </span>
      </div>

      <div className="rounded-[20px] bg-surface px-4 pb-4 pt-3">
        <span className="mx-auto mb-2.5 block w-fit rounded-pill border border-border bg-white px-3 py-0.5 text-[10px] font-semibold tracking-[0.5px] text-text-secondary">
          FRONT
        </span>

        <div className="flex flex-col gap-1.5">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-1.5">
              {Array.from({ length: SEATS_PER_ROW }).map((_, colIndex) => {
                const seatNumber = rowIndex * SEATS_PER_ROW + colIndex + 1;
                if (seatNumber > seatsTotal) {
                  return <span key={seatNumber} className="h-9 w-10" />;
                }

                const isTaken = takenSeats.has(seatNumber);
                const isSelected = selectedSeats.includes(seatNumber);
                // Once the trip's remaining seats are all spoken for, the rest
                // of the free seats grey out — you can still deselect yours.
                const blockedByLimit = !isSelected && !isTaken && atLimit;

                return (
                  <button
                    key={seatNumber}
                    disabled={isTaken || blockedByLimit}
                    onClick={() => onToggle(seatNumber)}
                    aria-label={`Seat ${seatNumber}`}
                    className={`flex h-9 w-10 items-center justify-center rounded-[8px] border text-[12px] font-semibold transition-colors ${
                      colIndex === 1 ? "mr-2.5" : ""
                    } ${
                      isTaken
                        ? "cursor-not-allowed border-border bg-border text-text-secondary"
                        : isSelected
                          ? "border-primary bg-primary text-white"
                          : blockedByLimit
                            ? "cursor-not-allowed border-border bg-white text-text-muted opacity-50"
                            : "border-border bg-white text-text-secondary hover:border-primary"
                    }`}
                  >
                    {isTaken ? (
                      <X className="h-3 w-3" strokeWidth={3} />
                    ) : isSelected ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      seatNumber
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {atLimit && (
        <p className="text-center text-[12px] font-semibold text-text-secondary">
          {seatsAvailable === 1
            ? "Only 1 seat is left on this trip."
            : `All ${seatsAvailable} remaining seats on this trip are selected.`}
        </p>
      )}
    </div>
  );
}
