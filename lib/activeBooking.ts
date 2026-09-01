import { safeQuery, supabase } from "@/lib/supabase";

export type ActivePickupBooking = {
  id: string;
  ticket_id: string;
  active_trips: { destination: string } | null;
};

/**
 * A passenger can only have one roadside pickup booking running at a time — a
 * bus is on its way to a specific spot, so a second one can't be honoured.
 * Scheduled (advance) bookings are unaffected and can always be made.
 *
 * Only 'confirmed' blocks: a finished trip is marked 'completed' when the
 * passenger arrives, which is what frees them to book again.
 *
 * Returns the blocking booking, or null when the passenger is free to book.
 */
export async function getActivePickupBooking(
  userId: string
): Promise<ActivePickupBooking | null> {
  const { data } = await safeQuery(
    supabase
      .from("bookings")
      .select("id, ticket_id, active_trips(destination)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(1)
  );

  const rows = (data as unknown as ActivePickupBooking[]) ?? [];
  return rows[0] ?? null;
}
