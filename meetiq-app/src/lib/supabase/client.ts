import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in browser (Client Components).
 * Uses the anon key — all queries are scoped by RLS.
 * Returns a cached singleton to prevent infinite re-render loops
 * when used inside React hooks dependency arrays.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
