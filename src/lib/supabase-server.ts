import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";

/** Server-only client. Browser clients never receive the secret or query platform tables. */
export function getSupabaseAdmin() {
  if (!url || !secret) throw new Error("Supabase is not configured.");
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "X-Client-Info": "loomspace-server" } },
  });
}
