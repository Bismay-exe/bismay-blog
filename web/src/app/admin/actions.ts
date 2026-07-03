'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin Server Actions — Phase 1
 *
 * Only logout for now. The full set of post/category/tag/series actions
 * will be added as their respective admin pages are built in Phase 1–2.
 */

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
