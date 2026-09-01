import { supabase } from "@/lib/supabase";

/**
 * Cancelling a booking has to hand its seats back, otherwise `seats_available`
 * only ever ratchets down and eventually goes negative. Both helpers clamp to
 * `seats_total` so a double-cancel can't inflate a trip past its capacity.
 *
 * Best-effort: a booking is already cancelled by the time these run, so a
 * failure here must never surface as a cancellation error.
 */

/** Marks a finished trip complete so it stops counting as an active booking. */
export async function completeBooking(bookingId: string) {
  try {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
  } catch {
    // Non-fatal: the passenger has already arrived either way.
  }
}

export async function releaseTripSeats(tripId: string, seatCount: number) {
  try {
    const { data } = await supabase
      .from("active_trips")
      .select("seats_total, seats_available")
      .eq("id", tripId)
      .single();

    if (!data) return;

    await supabase
      .from("active_trips")
      .update({
        seats_available: Math.min(data.seats_total, data.seats_available + seatCount),
      })
      .eq("id", tripId);
  } catch {
    // Seat counts may drift; not worth blocking a successful cancellation over.
  }
}

export async function releaseScheduleSeats(scheduleId: string, seatCount: number) {
  try {
    const { data } = await supabase
      .from("schedules")
      .select("seats_total, seats_available")
      .eq("id", scheduleId)
      .single();

    if (!data) return;

    await supabase
      .from("schedules")
      .update({
        seats_available: Math.min(data.seats_total, data.seats_available + seatCount),
      })
      .eq("id", scheduleId);
  } catch {
    // Seat counts may drift; not worth blocking a successful cancellation over.
  }
}
