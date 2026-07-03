import { createClient } from '@/lib/supabase/server'
import { logoutAction } from './actions'

/**
 * Admin Dashboard (/admin)
 *
 * Phase 1 placeholder — shows the authenticated user's identity and a
 * sign-out button to verify the full auth round-trip works end-to-end.
 *
 * Phase 2 will replace this with the full dashboard layout from PRD
 * Section 10.1 (stats row, recent posts table, quick actions, etc.).
 */
export default async function AdminPage() {
  const supabase = await createClient()

  // getClaims() is safe here — the layout already verified the session,
  // but we call it again to get the claims data for display.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  // Fetch the profile if it exists
  const { data: profile } = userId
    ? await supabase
        .from('profiles')
        .select('name, username, avatar_url')
        .eq('id', userId)
        .single()
    : { data: null }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Phase 1 placeholder — full dashboard coming in Phase 2
        </p>
      </div>

      {profile && (
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-1 w-full max-w-sm">
          <p className="font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      )}

      {!profile && (
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-1 w-full max-w-sm">
          <p className="text-sm text-muted-foreground">
            Logged in as user <code className="font-mono text-xs">{userId?.slice(0, 8)}…</code>
          </p>
          <p className="text-xs text-muted-foreground">
            Profile not yet created — will be seeded in Phase 1 DB migration.
          </p>
        </div>
      )}

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-border bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign out
        </button>
      </form>
    </main>
  )
}
