import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin Layout — Route Protection
 *
 * This layout wraps every page under /admin/*. Its only responsibility
 * in Phase 1 is to gate access: if the user is not authenticated, they
 * are immediately redirected to the login page.
 *
 * Why getClaims() and not getSession()?
 *  - getSession() reads cookies without re-validating the JWT. A user
 *    could theoretically present a tampered cookie and pass the check.
 *  - getClaims() verifies the JWT signature against Supabase's public keys
 *    every time, so it is safe to trust for access control decisions.
 *
 * Phase 2+ will add a sidebar nav, header, and dashboard chrome here.
 * For Phase 1 we keep it minimal — just the auth gate + children.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    // Not authenticated — send to login page.
    // The `next` param lets the login page redirect back here after login.
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
