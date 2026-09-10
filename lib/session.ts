"use client";

import { safeQuery, supabase } from "@/lib/supabase";

/**
 * Forgets the signed-in passenger on this device.
 *
 * Everything that identifies them lives in localStorage plus a cookie the
 * proxy reads, so all of it has to go together — a half-cleared session leaves
 * the app thinking someone is signed in as a user that no longer exists.
 */
export function clearSession() {
  localStorage.removeItem("booklan_user_id");
  localStorage.removeItem("booklan_user_name");
  localStorage.removeItem("booklan_phone");
  document.cookie = "booklan_session=; path=/; max-age=0";
}

/**
 * Checks the stored user id still refers to a real row.
 *
 * A browser keeps that id for thirty days, so it outlives the database it came
 * from. After the schema is re-run every id on every device is stale, and the
 * app carries on as if signed in — until a booking insert fails its foreign key
 * on `user_id` and surfaces as a payment error, which is what it looked like
 * from the outside. An incognito window worked because it had no id to be
 * stale.
 *
 * Returns the id when it is good, and null after clearing a dead one.
 */
export async function verifyStoredUser(): Promise<string | null> {
  const userId = localStorage.getItem("booklan_user_id");
  if (!userId) return null;

  const { data, error } = await safeQuery(
    supabase.from("users").select("id").eq("id", userId).maybeSingle()
  );

  // A network failure is not proof the account is gone; only an empty result
  // from a successful query is.
  if (error) return userId;

  if (!data) {
    clearSession();
    return null;
  }

  return userId;
}
