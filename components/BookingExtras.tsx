"use client";

import { useState } from "react";
import { Info, Loader2, MapPin, Star, X } from "lucide-react";
import Portal from "@/components/Portal";
import { safeQuery, supabase } from "@/lib/supabase";

export type BookingMilestones = {
  bookedAt?: string | null;
  boardedAt?: string | null;
  completedAt?: string | null;
  pickupName?: string | null;
  dropoffName?: string | null;
  travelDate?: string | null;
  departure?: string | null;
};

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Two icons in the corner of a finished booking: details, and rating.
 *
 * Both open a small centred pop-up rather than unfolding inside the card — a
 * list of receipts should not reflow every time someone glances at one. The
 * pop-ups are portalled so they clear the receipt's own stacking context.
 *
 * Rating lives here as well as on the arrival screen because passengers close
 * the app before that screen appears and then have nowhere to go back to. A
 * booking already rated shows as rated: `reviews.booking_id` is unique, so a
 * second attempt would fail anyway.
 */
export default function BookingExtras({
  bookingId,
  companyId,
  milestones,
  reviewed,
  onReviewed,
}: {
  bookingId: string;
  companyId: string | null;
  milestones: BookingMilestones;
  reviewed: boolean;
  onReviewed: (bookingId: string) => void;
}) {
  const [open, setOpen] = useState<"details" | "review" | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const userId = localStorage.getItem("booklan_user_id");
    if (rating === 0 || !companyId || !userId) return;

    setSaving(true);
    setError(null);

    const { error: saveError } = await safeQuery(
      supabase.from("reviews").insert({
        company_id: companyId,
        user_id: userId,
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      })
    );

    if (saveError) {
      setError("Couldn't save your review. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(null);
    onReviewed(bookingId);
  }

  return (
    <>
      <button
        onClick={() => setOpen("details")}
        aria-label="Trip details"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-text-secondary transition-colors hover:bg-surface"
      >
        <Info className="h-[15px] w-[15px]" />
      </button>

      <button
        onClick={() => !reviewed && setOpen("review")}
        aria-label={reviewed ? "Already reviewed" : "Rate this trip"}
        disabled={reviewed}
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
          reviewed
            ? "border-warning/30 bg-warning/10"
            : "border-border bg-white text-text-secondary hover:bg-surface"
        }`}
      >
        <Star className={`h-[15px] w-[15px] ${reviewed ? "fill-warning text-warning" : ""}`} />
      </button>

      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            onClick={() => setOpen(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[320px] rounded-[18px] bg-white p-4 shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-extrabold text-text-primary">
                  {open === "details" ? "Trip details" : "Rate this trip"}
                </span>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-secondary"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>

              {open === "details" ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Line label="Booked" value={when(milestones.bookedAt)} />
                  {milestones.travelDate && (
                    <Line label="Travel date" value={milestones.travelDate} />
                  )}
                  {milestones.departure && <Line label="Departure" value={milestones.departure} />}
                  {milestones.boardedAt !== undefined && (
                    <Line label="Driver accepted" value={when(milestones.boardedAt)} />
                  )}
                  {milestones.completedAt !== undefined && (
                    <Line label="Arrived" value={when(milestones.completedAt)} />
                  )}
                  {milestones.pickupName && (
                    <Line
                      label="Pickup"
                      value={milestones.pickupName}
                      icon={<MapPin className="h-3 w-3 shrink-0 text-text-muted" />}
                    />
                  )}
                  {milestones.dropoffName && (
                    <Line
                      label="Drop-off"
                      value={milestones.dropoffName}
                      icon={<MapPin className="h-3 w-3 shrink-0 text-text-muted" />}
                    />
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= rating ? "fill-warning text-warning" : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Anything worth mentioning? (optional)"
                    className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                  />

                  {error && <p className="text-center text-[12px] text-error">{error}</p>}

                  <button
                    onClick={submit}
                    disabled={rating === 0 || saving}
                    className="flex h-11 items-center justify-center rounded-[12px] bg-primary text-[14px] font-bold text-white disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function Line({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[11.5px] text-text-secondary">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-right text-[12px] font-semibold text-text-primary">
        {icon}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}
