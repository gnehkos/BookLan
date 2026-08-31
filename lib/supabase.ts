import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase query builders reject outright on a hard network failure (e.g. offline,
 * DNS, connection refused) in the browser instead of resolving with `{ data: null,
 * error }` like they do for a server-returned error. Wrap awaited queries in this so
 * every failure mode ends up in the same shape and callers only need one error check.
 */
export async function safeQuery<T>(
  queryPromise: PromiseLike<{ data: T; error: { message: string } | null }>
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    return await queryPromise;
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Network error" },
    };
  }
}
