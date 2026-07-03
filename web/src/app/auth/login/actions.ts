'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions for OAuth login.
 *
 * These run on the server when the login form buttons are submitted.
 * They call supabase.auth.signInWithOAuth() which returns a redirect URL,
 * then we redirect the browser to that URL to start the OAuth flow.
 *
 * The `redirectTo` URL tells Supabase where to send the user AFTER they
 * approve the OAuth grant — that is our /auth/callback route handler.
 *
 * NOTE: process.env.NEXT_PUBLIC_SITE_URL should be set in production.
 * In development it falls back to localhost:3000.
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function loginWithGitHub() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/auth/login?error=oauth')
  }

  redirect(data.url)
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/auth/login?error=oauth')
  }

  redirect(data.url)
}
