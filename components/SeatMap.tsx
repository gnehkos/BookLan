"use client";

import { useMemo } from "react";

export type VehicleType = "bus" | "van";

export default function SeatMap({
  vehicleType,
  selectedSeat,
  onSelect,
  seedKey,
}: {
  vehicleType: VehicleType;
  selectedSeat: number | null;
  onSelect: (seat: number | null) => void;
  seedKey: string;
}) {
  const rows = vehicleType === "van" ? 3 : 10;
  const totalSeats = rows * 4;

  const takenSeats = useMemo(() => {
    const takenCount = Math.round(totalSeats * 0.3);
    const taken = new Set<number>();
    while (taken.size < takenCount) {
      taken.add(Math.floor(Math.random() * totalSeats) + 1);
    }
    return taken;
  }, [totalSeats, seedKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 text-[12px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-primary bg-white" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-primary" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-border" /> Taken
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, colIndex) => {
              const seatNumber = rowIndex * 4 + colIndex + 1;
              const isTaken = takenSeats.has(seatNumber);
              const isSelected = selectedSeat === seatNumber;

              return (
                <button
                  key={seatNumber}
                  disabled={isTaken}
                  onClick={() => onSelect(isSelected ? null : seatNumber)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-[12px] font-semibold transition-colors ${
                    colIndex === 1 ? "mr-3" : ""
                  } ${
                    isTaken
                      ? "cursor-not-allowed bg-border text-text-secondary"
                      : isSelected
                        ? "bg-primary text-white"
                        : "border border-primary bg-white text-primary hover:bg-surface"
                  }`}
                >
                  {seatNumber}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
