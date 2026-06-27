import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client for use in React components (browser-side).
 * Environment variables are exposed publicly (NEXT_PUBLIC_ prefix).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
