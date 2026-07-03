import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser (Client Component) Supabase client.
 *
 * Use this in any React Client Component that needs to call Supabase
 * (e.g. interactive dashboard widgets, real-time subscriptions).
 *
 * This client reads/writes the auth session from browser cookies so it
 * stays in sync with the server client below.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
