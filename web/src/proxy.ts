import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js Middleware / Proxy
 *
 * This file is the entry point for the Next.js Edge Middleware.
 * It runs before EVERY matched request (see `config.matcher` below).
 *
 * Its only job right now is to call updateSession() to keep the
 * Supabase auth token refreshed on every request. Route-level
 * protection (blocking unauthenticated access to /admin/*) happens
 * inside the individual admin layouts/pages using getClaims().
 *
 * Why it's named "proxy.ts" instead of "middleware.ts":
 * The latest Supabase SSR guide names this file proxy.ts to align
 * with Next.js's new Fluid compute "Proxy" concept. Functionally it
 * works identically to middleware.ts — Next.js looks for both.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on all routes EXCEPT:
     *  - _next/static  — pre-built JS/CSS bundles
     *  - _next/image   — image optimisation service
     *  - favicon.ico   — browser icon
     *  - Static asset extensions (svg, png, jpg, jpeg, gif, webp)
     *
     * This avoids wasting Edge invocations on pure static files while
     * still running on all HTML pages, API routes, and Server Actions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
