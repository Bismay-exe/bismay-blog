import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 *
 * Use this in:
 *  - Server Components (to fetch data on the server)
 *  - Server Actions (to perform mutations like creating/updating posts)
 *  - Route Handlers
 *
 * It reads the auth session from the Next.js cookie store so the user's
 * login state is always respected on the server. Must be called inside a
 * request context (i.e. inside a component/action, not at module level).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from the proxy (middleware equivalent) where
            // cookies can be set, but if called from a Server Component the
            // cookie store is read-only — this is expected and safe to ignore.
          }
        },
      },
    }
  )
}
