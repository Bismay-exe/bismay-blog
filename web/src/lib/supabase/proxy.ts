import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Session refresh utility called by proxy.ts on every matched request.
 *
 * What this does and why it matters:
 *
 * Next.js Server Components can READ cookies but cannot WRITE them.
 * Supabase auth tokens expire and need to be refreshed. If we only
 * refresh inside a Server Component, the new token can't be written
 * back to the browser — so the next request still carries the stale token.
 *
 * The proxy (Next.js middleware) runs BEFORE any route is rendered and
 * CAN write cookies. So we call getClaims() here to:
 *   1. Validate the current JWT and refresh it if it's expiring.
 *   2. Write the fresh token to both the request (so Server Components
 *      on this render see it) and the response (so the browser stores it).
 *
 * Rule: ALWAYS use getClaims() here, never getSession(). getSession()
 * does not revalidate the JWT — it just reads whatever is in storage.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Create a new client per request — never reuse a global instance.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          // Write cookies to the mutated request so downstream server
          // code sees the refreshed token immediately.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response and apply updated cookies + headers
          // so the browser receives the refreshed token.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value as string)
            )
          }
        },
      },
    }
  )

  // IMPORTANT: Do NOT add any code between createServerClient and getClaims.
  // A simple mistake here can make it very hard to debug auth issues.
  await supabase.auth.getClaims()

  return supabaseResponse
}
