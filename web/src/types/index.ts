/**
 * Shared TypeScript types for the Bismay Blog.
 *
 * Phase 1 types only — covers the database tables created in the
 * initial migration (profiles, posts, categories, tags, post_tags).
 *
 * These are plain TypeScript interfaces that mirror the DB schema
 * from PRD Section 11. They're kept here (not in a separate package)
 * since we're not using a monorepo.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string | undefined
  avatar_url?: string
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type Profile = {
  id: string // FK → auth.users.id
  name: string
  username: string
  avatar_url: string | null
  bio: string | null
  github_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  website_url: string | null
  created_at: string
}

// ─── Category ────────────────────────────────────────────────────────────────

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export type Tag = {
  id: string
  name: string
  slug: string
  created_at: string
}

// ─── Post Status / Visibility ────────────────────────────────────────────────

export type PostStatus = 'draft' | 'published' | 'scheduled'
export type PostVisibility = 'public' | 'private'

// ─── Post ────────────────────────────────────────────────────────────────────

export type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  /** Tiptap ProseMirror JSON document — the source of truth. */
  content: Record<string, unknown>
  /** Pre-rendered HTML cache — generated on save, never hand-edited. */
  rendered_html: string | null
  cover_image_url: string | null
  status: PostStatus
  visibility: PostVisibility
  series_id: string | null
  series_order: number | null
  author_id: string
  reading_time_minutes: number | null
  word_count: number | null
  views_count: number
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  featured: boolean
  pinned: boolean
  published_at: string | null
  scheduled_for: string | null
  created_at: string
  updated_at: string
}

/**
 * Post with joined relations — used in list views and the editor.
 * The relations are optional because some queries may not join them.
 */
export type PostWithRelations = Post & {
  author?: Profile
  category?: Category | null
  tags?: Tag[]
}

// ─── Post form input ─────────────────────────────────────────────────────────

/**
 * The shape of data submitted when creating or updating a post.
 * Omits server-computed fields (id, created_at, updated_at, etc.).
 */
export type PostInput = Pick<
  Post,
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'content'
  | 'rendered_html'
  | 'cover_image_url'
  | 'status'
  | 'visibility'
  | 'series_id'
  | 'series_order'
  | 'seo_title'
  | 'seo_description'
  | 'canonical_url'
  | 'featured'
  | 'pinned'
  | 'scheduled_for'
> & {
  tag_ids?: string[]
}
