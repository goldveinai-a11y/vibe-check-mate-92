import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Best-effort read of the logged-in user's verified email from the current
 * request's Supabase bearer token (attached automatically by the global
 * `attachSupabaseAuth` function middleware whenever a session exists).
 *
 * Returns null if there's no session, an invalid token, or anything else
 * goes wrong — callers must treat that as "not logged in" and fall back to
 * anonymous (owner_anon_id) matching. This never throws, unlike
 * requireSupabaseAuth, because entitlement checks should degrade gracefully
 * for anonymous single-purchase buyers who never signed in.
 */
export async function getVerifiedEmail(): Promise<string | null> {
  try {
    const request = getRequest();
    const authHeader = request?.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.replace("Bearer ", "");
    if (token.split(".").length !== 3) return null;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) return null;

    const email = (data.claims as { email?: string }).email;
    return email ? email.toLowerCase() : null;
  } catch {
    return null;
  }
}
