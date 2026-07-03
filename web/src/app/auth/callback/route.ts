import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth Callback Route Handler
 *
 * After the user authenticates with GitHub or Google, Supabase redirects
 * them to this URL with a short-lived `code` in the query string.
 *
 * This route:
 *  1. Exchanges the `code` for a full session (access + refresh tokens).
 *  2. Writes the session into the browser's cookies via the server client.
 *  3. Redirects the user to the admin dashboard on success, or to an
 *     error page on failure.
 *
 * The redirect URL must be registered in the Supabase dashboard under
 * Authentication → URL Configuration → Redirect URLs:
 *   http://localhost:3000/auth/callback      (local dev)
 *   https://yourdomain.com/auth/callback    (production)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` lets us redirect to a specific page after login (e.g. the page
  // the user was trying to access before being sent to the login screen).
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the intended destination after successful login.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to an error page.
  // In Phase 1 this is just the homepage; a dedicated /auth/error
  // page can be added in a later polish pass.
  return NextResponse.redirect(`${origin}/?error=auth`)
}
