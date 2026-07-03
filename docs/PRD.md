# PRD — Bismay Blog

**Status:** Draft v1.3
**Owner:** Bismay
**Last updated:** 2026-07-03

**Changelog v1.2 → v1.3:** Adopted a monorepo repository structure (`apps/web`, `apps/mobile`, `packages/types`, `packages/lib`) in anticipation of a future native Android app, added as new Section 7.2. `apps/mobile` is reserved as an empty folder only — no mobile-specific work, libraries, or scope added to Phases 1–4. Added "Native Android app" explicitly to Non-Goals (Section 4) to keep this from creeping into v1 scope. Deliberately did **not** adopt Turborepo, `packages/ui`, or `packages/config` yet — see rationale in 7.2.

**Changelog v1.1 → v1.2:** Added layout specs for Homepage, Admin Dashboard, and Settings (previously just named, not designed). Added Mermaid + KaTeX support to the editor. Made callouts an explicit block type. Added Content Import (Markdown/MDX/HTML) and "Copy as Markdown" export. Added JSON Feed alongside RSS/Atom. Added Reading Preferences (reader-controlled font size/width/theme). Expanded Accessibility into concrete checklist. Added Branding, Error Pages, Loading States, and a lightweight Integrations reference table. Added a short Testing Strategy note. Added Series Progress widget (fits the daily-series workflow). Renamed `content_html` → `rendered_html` for clarity. Kept everything phase-gated — new items were slotted into existing phases or Phase 4, not bolted on as a parallel scope.

---

## 1. Summary

A personal technical blogging platform — your own writing + publishing surface, built to eventually replace "write on Dev.to/Hashnode" with "write here, syndicate everywhere." Optimized for one author (you), Markdown-first writing, fast reading experience, and strong SEO, with room to grow into multi-author/community features later without a rewrite.

This is a solo project with finite time. The single biggest risk isn't picking the wrong tech — it's building 40 features and shipping nothing. This PRD is written to force sequencing: a real v1 you can deploy and use in ~3–4 weeks, with everything else explicitly deferred.

---

## 2. Problem Statement

You write technical content regularly but currently have no owned home for it — content is scattered across platforms you don't control (algorithm changes, no custom domain equity, no full data ownership, limited design control, no reusable component library for embeds like diagrams/callouts). You want:

1. A place that is unambiguously "yours" — for SEO, portfolio, and personal brand equity
2. A writing experience good enough that you _prefer_ it over Notion/Hashnode's editor
3. Low-friction publishing (no `git commit` → `git push` → wait for build just to fix a typo)

## 3. Goals

| #   | Goal                                                | Why it matters                                                         |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| G1  | Publish and edit posts without touching Git         | Removes friction that kills posting frequency                          |
| G2  | Reading experience competitive with Medium/Hashnode | Retention, shareability                                                |
| G3  | Lighthouse 95+ on all public pages                  | SEO + credibility as a dev-focused product                             |
| G4  | Ship a real v1 in 3–4 weeks                         | Solo dev, day-job constraint — momentum matters more than completeness |
| G5  | Portfolio-grade codebase                            | Secondary but real: this is also a full-stack demonstration piece      |

## 4. Non-Goals (v1)

Explicitly **not** building in v1 — this is the list that keeps you honest:

- Public user signup / multi-author support
- Comments, reactions, or any social feature
- Newsletter / email
- AI-assisted writing (summary, SEO suggestions, grammar)
- Native Android app / iOS app / PWA / offline reading — the `apps/mobile` folder (Section 7.2) is reserved in the repo structure so it doesn't require a later reorganization, but **zero mobile-specific code, libraries, or design work happens in Phases 1–4 of this document.** Revisit only after the web v1 has been live and used for real.
- Algolia search (Postgres full-text is enough at this scale)
- Realtime collaboration
- Monetization/paywalls
- Formal automated test suite (see Section 20 — tested manually against acceptance criteria per phase instead)

If a "future feature" from the original brainstorm isn't in Section 11's phases, it's out of scope until v1 ships and gets used for a month.

---

## 5. Users & Use Cases

Single-author admin tool + public-facing readers. Two personas:

**You (Admin/Author)**

- Wants to go from "idea" to "published post" in minutes, not a PR review cycle
- Writes long-form technical posts with code blocks, images, occasional embeds, diagrams, and math
- Needs drafts that don't disappear, and a way to fix a typo on a live post in 10 seconds

**Reader (anonymous, no account)**

- Arrives from Google, X, or a direct link
- Wants fast load, readable typography, working code copy buttons, and to find related posts
- Never signs up, never comments (v1) — pure consumption

### Core user stories (v1)

1. As the author, I can log in with GitHub or Google and reach a dashboard — no public signup exists.
2. As the author, I can create a new post, write in a rich Markdown-style editor, and it autosaves every ~5s of inactivity without me clicking anything.
3. As the author, I can upload a cover image and inline images via drag-and-drop or paste.
4. As the author, I can save a post as a draft indefinitely and it never appears publicly until I hit Publish.
5. As the author, I can edit a published post and the change goes live immediately (no rebuild wait beyond ISR revalidation).
6. As the author, I can assign categories and tags to a post.
7. As a reader, I can open a post and see accurate reading time, syntax-highlighted code with a copy button, and a table of contents for long posts.
8. As a reader, I can browse all posts, filter by category/tag, and search by title/content.
9. As a reader, I get correct Open Graph tags when I share a post link on X/LinkedIn.
10. As a reader on mobile, the site is fully usable — no desktop-only interactions.

---

## 6. Writing Workflow

Since you're the only user, this end-to-end flow _is_ the product — every feature in this PRD exists to make this sequence frictionless:

```
Open dashboard
      ↓
New post → autosave starts immediately (server + localStorage mirror)
      ↓
Upload cover image
      ↓
Write — markdown shortcuts, slash commands, paste-to-embed
      ↓
Preview (identical render path to the live page)
      ↓
Save as draft (indefinitely, no pressure to publish)
      ↓
Publish → ISR revalidates within 60s → live on the public site
      ↓
(optional, Phase 4) Copy as Markdown → cross-post to Dev.to / Hashnode
```

If any step in this chain feels slower than "write in Notion, paste into Hashnode," the platform has failed at its core job regardless of how complete the feature list is. Use this as the practical acceptance test for Phase 2.

---

## 7. Tech Stack

| Layer               | Choice                                                        | Rationale                                                                                                                                        |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework           | Next.js 15 (App Router), React 19, TypeScript                 | Server components + ISR fit "fast public pages, dynamic admin" split well                                                                        |
| Styling             | Tailwind CSS v4 + shadcn/ui                                   | Fast to build, easy to keep consistent, no design-system overhead for a solo project                                                             |
| Backend             | Supabase (Postgres, Auth, Storage)                            | One provider for DB + auth + file storage; generous free tier; Row Level Security maps well to "admin-only writes, public reads"                 |
| Data fetching/cache | TanStack Query (admin/dynamic parts only)                     | Server Components handle public pages; TanStack Query is for the dashboard's interactive bits (drafts list, autosave status, search-as-you-type) |
| Editor              | Tiptap                                                        | Extensible, ProseMirror-based, has first-class Markdown support and the extensions you need (code block, tables, task list)                      |
| Code highlighting   | Shiki                                                         | Same highlighter VS Code uses — accurate, theme-matched                                                                                          |
| Diagrams            | Mermaid                                                       | Renders on the client from a fenced ` ```mermaid ` block; see Section 12, Phase 2                                                                |
| Math                | KaTeX                                                         | Renders `$inline$` and `$$block$$` LaTeX; see Section 12, Phase 2                                                                                |
| Forms/validation    | React Hook Form + Zod                                         | Standard, type-safe, shared schemas between client and server actions                                                                            |
| Search (v1)         | Postgres full-text search (`tsvector`)                        | Zero extra infra; sufficient below ~10k posts                                                                                                    |
| Deployment          | Vercel                                                        | Native Next.js support, ISR, image optimization, zero-config previews                                                                            |
| Repository          | pnpm workspace monorepo (`apps/web` + reserved `apps/mobile`) | See Section 7.2 — chosen now to avoid a painful restructure when Android development starts, without adding any mobile scope to v1               |

**Deferred:** Algolia (search), Edge Functions, Realtime — add only when there's a concrete need (e.g., comments in Phase 4 would want Realtime).

### 7.1 Integrations reference

Everything the platform actually touches, in one place, so it's not scattered across the doc:

| Integration                                                | Purpose                                             | Phase                                                    |
| ---------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| GitHub OAuth                                               | Admin login                                         | 1                                                        |
| Google OAuth                                               | Admin login                                         | 1                                                        |
| Supabase (Postgres, Auth, Storage)                         | Core backend                                        | 1                                                        |
| Vercel                                                     | Hosting, ISR, image optimization, cron (scheduling) | 1                                                        |
| Shiki                                                      | Code syntax highlighting                            | 2                                                        |
| Tiptap                                                     | Editor                                              | 2                                                        |
| Mermaid / KaTeX                                            | Diagrams / math rendering                           | 2                                                        |
| `next/og` (OpenGraph images)                               | Auto-generated social cards                         | 3                                                        |
| Google Search Console                                      | Indexing/search performance monitoring              | 3                                                        |
| Analytics provider (Plausible or GA4 — pick one, not both) | Traffic visibility                                  | 3, optional                                              |
| Dev.to / Hashnode APIs                                     | Direct cross-posting                                | 4, deferred until manual cross-posting is a proven habit |

No integration is added earlier than the phase that needs it — this table is a reference, not a commitment to build all of it in Phase 1.

### 7.2 Repository Structure

You mentioned wanting a future native Android app (view + post to the blog) sharing one repository with the web app. That's a real architectural fork: if the web app is built today as a standalone Next.js project at the repo root, adding a second app later means moving every file and rewriting import paths and CI config. Setting up a monorepo shell now avoids that — and it costs almost nothing, since `apps/mobile` stays empty until you actually start it.

```
bismay-blog/
├── apps/
│   ├── web/                 # Next.js 15 app — everything in Phases 1–4 lives here
│   └── mobile/               # RESERVED, empty — Android (Expo/React Native), not started
│       └── .gitkeep
├── packages/
│   ├── types/                # Shared TS types: Post, Tag, Category, Series, Profile
│   └── lib/                  # Shared Zod schemas + generated Supabase database types
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── docs/
│   └── PRD.md
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

**What's included now, and why:**

- `apps/web` — the actual Phase 1–4 build. Nothing here changes vs. the rest of this PRD.
- `apps/mobile` — a single empty folder with a `.gitkeep` (or short `README.md` noting "not started, see PRD Section 4"). Zero dependencies, zero code. Its only job is to exist so the eventual Android app doesn't force a repo restructure.
- `packages/types` and `packages/lib` — plain TypeScript, no build tooling required to benefit from them. Post/Tag/Series/Profile types and Zod validation schemas belong here instead of inside `apps/web` from the start, since it costs nothing today and means the web app already imports from the "shared" location rather than needing a later refactor when mobile starts consuming the same types.
- `pnpm-workspace.yaml` — the one piece of actual monorepo tooling adopted now. Lightweight, well-supported, and is what lets `apps/web` import from `packages/*` via workspace references.
- `supabase/` at the repo root (not inside `apps/web`) — this is just correct practice for the Supabase CLI regardless of monorepo or not, since migrations apply to one shared database that both future apps will use.

**Deliberately deferred — not adopted now:**

- **Turborepo.** Its value is caching/orchestrating builds across multiple apps. With one real app (`apps/web`), there's nothing to orchestrate yet. Add it the day `apps/mobile` gets real code and a real build step.
- **`packages/ui`.** Sharing UI components between a Tailwind/shadcn web app and a future React Native app depends on a cross-platform UI decision that hasn't been made (NativeWind? React Native Paper? no shared components at all, just shared logic?). Stubbing this now would guess at an answer you don't have yet — better to decide it when mobile actually starts.
- **`packages/config`.** Shared eslint/tsconfig configs matter once two apps need to stay consistent. With one app, `apps/web` just keeps its own config.

**Note for later:** when `packages/types` or `packages/lib` are actually imported into `apps/web`, Next.js may need `transpilePackages` set in `next.config.js` to compile workspace packages correctly — a one-line config change, not a blocker, just worth remembering.

This section is infrastructure-only. It does not add any feature, phase, or line item to Sections 13 or 23 — `apps/mobile` remains explicitly out of scope per Section 4 until v1 web is live and used for a month.

---

## 8. Design Language

Not a full design system — just enough constraint that the site doesn't drift into generic-shadcn-default territory.

| Element                 | Spec                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography              | Sans: Geist or Inter for UI/body. Mono: JetBrains Mono for code and metadata (dates, reading time)                                                                                                        |
| Reading width           | Max 700–750px for article body — long lines hurt readability                                                                                                                                              |
| Spacing                 | 8px base grid throughout                                                                                                                                                                                  |
| Corners                 | Rounded, consistently (e.g., `rounded-lg` for cards, `rounded-md` for buttons) — no mixing radii                                                                                                          |
| Motion                  | Motion library, 150–250ms, ease-out for entrances, ease-in-out for toggles. No animation on content reflow (avoid layout shift). Respect `prefers-reduced-motion` — disable non-essential motion when set |
| Theme                   | Dark mode is the default/primary; light mode is a fully-supported secondary, not an afterthought                                                                                                          |
| Aesthetic guardrails    | No glassmorphism, no gradient-heavy hero sections, generous whitespace, minimal chrome around the reading experience                                                                                      |
| Cards (article preview) | Cover image (16:9), category pill, title, excerpt (1–2 lines), reading time, date, tag chips                                                                                                              |

### 8.1 Branding assets (Phase 1)

Minimum set needed before v1 is presentable as "your site," not a template:

- Logo (wordmark is enough — no need for an icon mark day one)
- Favicon (16×16, 32×32, and an `apple-touch-icon`)
- `manifest.json` (name, short_name, theme_color, icons) — required for a correct favicon/PWA-adjacent experience even without building a PWA
- OG image template (see Section 12, Phase 3 — auto-generated, not a static asset)
- Brand color tokens (primary/accent, mapped into the Tailwind theme, not hardcoded per-component)

Typography and iconography are already covered by Section 8's design language and shadcn/lucide icons — no separate work needed.

---

## 9. Homepage Layout Specification

The previous draft just said "Home." This is the actual layout, top to bottom:

```
Navbar
  (logo, nav links: Posts / Series / About, search icon, theme toggle)
      ↓
Hero — Latest Featured Post
  (large card: cover image, title, excerpt, "Read more" — driven by posts.featured)
      ↓
Recent Posts
  (grid of 6, cards per Section 8, "View all" → /posts)
      ↓
Series
  (horizontal scroll or 3-card row of active series, each showing progress
   e.g. "React Learning Journey — Day 6 of ~14")
      ↓
Categories
  (pill/chip row linking to /categories/[slug], no page navigation needed to browse)
      ↓
Popular Posts
  (top 3–4 by views_count — optional for launch, cut if views_count isn't
   populated yet; don't block Phase 1 on this)
      ↓
Latest Projects
  (optional, static/manual content block — only if you want a projects
   section on the same site; not part of the blog schema, cut entirely if
   out of scope)
      ↓
Newsletter signup
  (visually reserved slot, non-functional in v1 — explicitly deferred per
   Section 4 Non-Goals; don't wire up a form, just leave the layout gap or
   omit the section until Phase 4)
      ↓
Footer
  (socials, RSS/Atom/JSON Feed links, copyright, "built with" credit — optional)
```

**Phase placement:** Hero, Recent Posts, Categories, Footer ship in Phase 1 (they only need `posts`, `categories` — already in the Phase 1 schema). Series section ships when Series support ships (Phase 2). Popular Posts ships in Phase 3+ once view tracking exists. Newsletter and Projects are out of scope for v1; leave them out of the initial build entirely rather than shipping dead UI — add the section only when the feature behind it is real.

---

## 10. Admin Dashboard & Settings Layout Specification

### 10.1 Dashboard (`/admin`)

Previously just "Dashboard." Concrete widget layout:

```
Top bar: "New Post" button (primary action, always visible)

Stats row (4 cards):
  Drafts (count)  |  Published (count)  |  Scheduled (count)  |  Total views (30d)

Recent Posts (table, last 5, any status)
  title · status · last edited · quick actions (edit / view / delete)

Storage Usage
  simple bar: X MB / Supabase free-tier limit — early warning before
  you hit a plan wall

Quick Actions
  New Post · New Series · View Site
```

Keep this to what Phase 1's schema already supports (`posts` status/counts) plus Storage usage, which is a Supabase API call, not a new table. Nothing here requires new backend work beyond what Phase 1–3 already builds.

### 10.2 Settings (`/admin/settings`)

Previously just "Settings." Sectioned as tabs or a single scrollable page:

```
Profile
  name, username, avatar, bio, social links (maps directly to `profiles` table)

SEO Defaults
  default seo_title/description fallback pattern, default OG image template

Theme
  default theme for new visitors (dark/light/system) — site-wide, distinct
  from the reader's own Section 13 reading-preference override

Social Links
  (may fold into Profile — don't duplicate fields if so)

Analytics
  connected provider, tracking ID — only if an analytics provider is wired up

Integrations
  read-only status of connected services (GitHub/Google OAuth, storage
  usage) — informational, not a settings-writer for OAuth itself

Export
  "Export all posts as Markdown/MDX" (see Section 12, Phase 4)

Custom Domain
  future — placeholder only, Vercel domain config happens outside the app

Danger Zone
  delete account / wipe data — low priority for a single-admin site, but
  cheap to stub as a confirmation-gated destructive action
```

**Phase placement:** Profile and SEO Defaults ship in Phase 1 (profile already exists in schema; SEO defaults are a few columns/config, not a subsystem). Theme, Analytics, Integrations status, and Export land in Phase 3–4 as their underlying features ship. Custom Domain and Danger Zone are stubs, not committed work.

---

## 11. Database Schema

Notes:

- `id` fields are `uuid default gen_random_uuid()` unless stated otherwise.
- All tables have `created_at timestamptz default now()`; mutable tables also get `updated_at` maintained by a trigger.
- RLS is **on** for every table from day one (see Section 15).

### `profiles`

Extends Supabase `auth.users` (1:1 via `id`).

| Column                                             | Type                         | Notes                                                  |
| -------------------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| id                                                 | uuid, PK, FK → auth.users.id |                                                        |
| name                                               | text, not null               |                                                        |
| username                                           | text, unique, not null       | for future `/u/:username` if multi-author ever happens |
| avatar_url                                         | text                         | Supabase Storage path                                  |
| bio                                                | text                         |                                                        |
| github_url, linkedin_url, twitter_url, website_url | text                         | nullable                                               |

### `posts`

| Column               | Type                                                            | Notes                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                   | uuid, PK                                                        |                                                                                                                                                                                                     |
| title                | text, not null                                                  |                                                                                                                                                                                                     |
| slug                 | text, unique, not null                                          | auto-generated from title, editable                                                                                                                                                                 |
| excerpt              | text                                                            | manual or auto-truncated from content                                                                                                                                                               |
| content              | jsonb, not null                                                 | Tiptap JSON doc (source of truth)                                                                                                                                                                   |
| rendered_html        | text                                                            | rendered cache, regenerated on save — avoids re-rendering Tiptap JSON on every page view. Renamed from `content_html` for clarity; **treat as fully generated, never hand-edited** (see Section 19) |
| cover_image_url      | text                                                            |                                                                                                                                                                                                     |
| status               | text, not null, check in ('draft','published','scheduled')      |                                                                                                                                                                                                     |
| visibility           | text, not null, default 'public', check in ('public','private') |                                                                                                                                                                                                     |
| series_id            | uuid, FK → series.id, nullable                                  |                                                                                                                                                                                                     |
| series_order         | int, nullable                                                   | position within series                                                                                                                                                                              |
| author_id            | uuid, FK → profiles.id, not null                                |                                                                                                                                                                                                     |
| reading_time_minutes | int, computed on save                                           |                                                                                                                                                                                                     |
| word_count           | int, computed on save                                           |                                                                                                                                                                                                     |
| views_count          | int, default 0                                                  | denormalized counter, incremented via RPC                                                                                                                                                           |
| seo_title            | text, nullable                                                  | falls back to `title`                                                                                                                                                                               |
| seo_description      | text, nullable                                                  | falls back to `excerpt`                                                                                                                                                                             |
| canonical_url        | text, nullable                                                  | for cross-posted content                                                                                                                                                                            |
| featured             | boolean, default false                                          | controls homepage hero slot                                                                                                                                                                         |
| pinned               | boolean, default false                                          | pins to top of `/posts` regardless of date                                                                                                                                                          |
| published_at         | timestamptz, nullable                                           |                                                                                                                                                                                                     |
| scheduled_for        | timestamptz, nullable                                           |                                                                                                                                                                                                     |
| search_vector        | tsvector, generated column                                      | indexed for full-text search                                                                                                                                                                        |

Indexes: `slug` (unique), `status`, `published_at desc`, GIN on `search_vector`.

### `categories`

`id, name, slug (unique), description`

### `tags`

`id, name, slug (unique)`

### `post_tags` (join table)

`post_id FK, tag_id FK` — composite PK `(post_id, tag_id)`

### `series`

`id, title, slug (unique), description, cover_image_url`

Post ordering within a series uses `posts.series_order` rather than a separate table — simpler, and reorder = update one int.

### `post_views` (for basic analytics, Phase 3+)

`id, post_id FK, viewer_hash text (hashed IP+UA, not raw PII), created_at`

Deferred to Phase 4: `comments`, `reactions` — not in v1 schema at all, added when the feature is actually built, to avoid maintaining unused RLS policies.

---

## 12. Information Architecture / Pages

**Public**

- `/` — home (see Section 9 for full layout)
- `/posts` — all posts, paginated, filterable
- `/posts/[slug]` — single post
- `/categories/[slug]`, `/tags/[slug]`, `/series/[slug]`
- `/author/[username]` — bio, socials, recent articles (see Phase 3)
- `/search`
- `/about`
- `/rss.xml`, `/atom.xml`, `/feed.json`, `/sitemap.xml`
- `/404`, `/500`, offline fallback (see Section 16)

**Admin** (all behind auth, `/admin/*`)

- `/admin` — dashboard (see Section 10.1)
- `/admin/posts` — all posts table (status, filters)
- `/admin/posts/new`, `/admin/posts/[id]/edit`
- `/admin/media` — uploaded assets browser
- `/admin/categories`, `/admin/tags`, `/admin/series`
- `/admin/settings` — profile, SEO defaults, and the rest of Section 10.2

---

## 13. Feature Spec by Phase

Each phase ends in something deployable and usable. **Do not start a later phase before the current one is live on production.**

### Phase 1 — Foundation (target: ~1 week)

Goal: you can log in and publish a plain post; a reader can see it.

- Repository setup per Section 7.2: `apps/web` (Next.js), reserved empty `apps/mobile`, `packages/types`, `packages/lib`, `pnpm-workspace.yaml`, `supabase/` — one-time setup, not ongoing scope
- Supabase Auth: GitHub + Google OAuth only, no email/password, no public signup
- RLS policies: only `author_id = auth.uid()` can write; anyone can read `status = 'published'`
- Post CRUD (title, content as plain Tiptap without exotic extensions yet, status draft/published)
- Categories & tags CRUD (admin) + assignment on post
- Image upload to Supabase Storage (cover image only)
- Public post list + single post page, basic styling
- Homepage: Hero, Recent Posts, Categories, Footer (Section 9 subset)
- Dashboard: stats row + recent posts table (Section 10.1 subset)
- Settings: Profile + SEO Defaults (Section 10.2 subset)
- Branding assets: logo, favicon, manifest, brand color tokens (Section 8.1)
- Basic 404 page
- Responsive layout, dark/light mode

**Done when:** you can write and publish a post from the dashboard, and it's readable on the public site on mobile and desktop.

### Phase 2 — Writing Experience (target: ~1.5–2 weeks)

Goal: the editor is good enough that you _want_ to write here. This is the phase most worth over-investing in, since it's the daily-use surface.

**Core editing**

- Full Tiptap extension set: code block (with language select), tables, blockquote, task list, headings H1–H6, image, link, underline/strike, horizontal rule
- Floating bubble menu on text selection (bold/italic/link/code) and a floating "+"-style block toolbar on empty lines — this is the single biggest feel-difference between "a textarea with buttons" and Hashnode/Notion-style editing
- Standard keyboard shortcuts: `Cmd/Ctrl+B` bold, `Cmd/Ctrl+I` italic, `Cmd/Ctrl+K` link, `Cmd/Ctrl+Shift+7` ordered list, etc. — Tiptap's `StarterKit` provides most of these by default, verify the rest
- Markdown shortcuts (typing `## ` → H2, ` ``` ` → code block, `- ` → bullet list, `1. ` → ordered list) and full paste-Markdown support
- Slash commands (`/heading`, `/image`, `/code`, `/table`, `/quote`, `/callout`, `/divider`, `/mermaid`, `/math`)

**Callouts** — explicit block type, not just a styled blockquote

- Four variants: Note, Warning, Tip, Success — each its own Tiptap node with an icon + accent color, insertable via `/callout` or typing `> [!note]` style markdown
- Renders identically in editor preview and public page (same rule as everything else — one render path)

**Diagrams & math**

- Mermaid: fenced ` ```mermaid ` block, rendered client-side to SVG on the public page (server-render at build/ISR time if feasible, client fallback otherwise). High value for a technical blog explaining architecture/flows
- KaTeX: `$inline$` and `$$block$$` math syntax, rendered via `remark-math`/`rehype-katex` equivalent in the Tiptap → HTML pipeline

**Media**

- Drag-and-drop + paste-to-upload for images, anywhere in the doc (not just a designated cover slot)
- Image captions and basic alignment (left/center/full-width) — Tiptap image extension supports this via a small custom node
- Image resize handles are a nice-to-have, not a blocker — defer if it adds significant Tiptap complexity; captions/alignment matter more for a technical blog than resize
- **Media Library** (`/admin/media`): browsable grid of everything in Supabase Storage — thumbnail, filename, upload date, "copy URL," delete, basic search by filename. Needed by end of Phase 2, otherwise Storage becomes an unmanaged pile within a few weeks of regular posting

**Embeds** (paste-to-embed, auto-detected by URL pattern)

- YouTube, GitHub Gist, CodePen, Tweet/X — these four cover the overwhelming majority of technical-blog embed needs
- Vimeo, Figma, Loom — nice-to-have, add only if you actually use them; each is a small independent Tiptap node, low cost to add incrementally later

**Content import**

- Import Markdown/MDX files (paste raw text or upload a `.md`/`.mdx` file → parsed into Tiptap JSON) — this is what actually makes migrating existing Dev.to/Hashnode/Medium posts practical, since all three export to Markdown
- Import from raw HTML — lower priority than Markdown; add only if you have specific posts that only exist as HTML

**Reliability**

- Autosave (debounced, 5s idle) with a visible "Saved" / "Saving…" indicator; conflict handling = last-write-wins with a warning if the doc changed elsewhere (out of scope: real operational-transform conflict resolution — YAGNI for a single author)
- Draft recovery: mirror the current editor state to `localStorage` alongside the server autosave. If a server save fails or the tab crashes before the debounce fires, on next load offer "Restore unsaved changes?" — cheap insurance, prevents the one failure mode (crash mid-edit) that actually loses work
- Draft preview (renders through the exact same render function used on the public page — no separate preview-only rendering path, to avoid preview/production drift)

**Publishing**

- Post scheduling (`scheduled_for` + a Vercel cron to flip status at the right time)
- Series support: create series, assign posts, auto-generate prev/next navigation, and a Series Progress widget (e.g., "React Learning Journey — Day 6 ✓ / ~14 · ██████░░░░") shown on the series page and homepage — fits the daily-series workflow directly and is a nice differentiator vs. Hashnode's plain series list

**Loading states**

- Skeleton loaders for Home, Post, Dashboard, Editor, Search — cheap to add alongside each page as it's built, don't bolt on retroactively

**Done when:** writing a post here is faster and less annoying than writing it in Notion first and pasting over.

### Phase 3 — Reader Experience & SEO (target: ~1–1.5 weeks)

Goal: the site performs well and is discoverable.

- Postgres full-text search (title, content, tags, categories) + `/search` UI
- Table of contents (auto-generated from headings, scroll-spy highlighting)
- Shiki syntax highlighting + copy-code button
- Reading progress bar, "back to top"
- Related posts (same category/tags, simple relevance score)
- Reading preferences (reader-controlled, stored in `localStorage`, not the DB — no reason to sync per-device reading prefs server-side): font size (small/medium/large), line height, reading width, light/dark override
- SEO: per-post title/description overrides, canonical URL, `sitemap.xml`, `robots.txt`, JSON-LD structured data (Article schema)
- Auto-generated OG/Twitter Card images via `next/og` (`ImageResponse`) — one template composing cover image, title, author, and date, rendered at request time and cached, same pattern as the Vercel blog. No manual image creation per post.
- Author page (`/author/[username]`): bio, social links, recent articles, categories/series authored — set up for one author now, structurally ready if this ever becomes multi-author
- RSS feed, Atom feed, JSON Feed — same underlying post query, three serializers; cheap to add all three once one exists
- Accessibility pass (see Section 17 for the concrete checklist)
- Custom `/404`, `/500`, and offline fallback pages (basic — on-brand, with a way back to `/`)
- Lighthouse pass: target 95+ on Performance, Accessibility, SEO, Best Practices for the post page template

**Done when:** a post shared on X renders a proper card, and a Lighthouse audit on `/posts/[slug]` scores 95+.

### Phase 4 — Optional / Post-launch (only after v1 has been live and used for real)

Not committed — revisit based on actual usage:

- View analytics dashboard (`post_views` aggregation: unique visitors, avg. read time, completion %, traffic sources)
- Comments (would need Realtime + moderation + spam handling — a real subproject on its own)
- Reactions
- Newsletter
- Multi-author
- AI-assisted SEO/summary suggestions
- **Cross-posting**: starts cheap — "Copy as Markdown" / "Export MDX" button on the post editor, since that alone covers manually pasting into Dev.to/Hashnode/Medium. "Export all posts" (bulk) lives in Settings → Export (Section 10.2). Direct API publishing (Dev.to API, Hashnode API) is a real integration with its own auth/error-handling surface — only worth it once manual cross-posting is a proven, repeated habit
- **Article version history**: snapshot `content` on every publish (not every autosave — that'd be excessive volume) into a `post_versions` table, with a simple restore-to-version action
- **SEO analyzer**: live score in the editor sidebar (title length, meta description present, heading structure, alt text coverage) — genuinely useful but is its own small rules engine; not worth building before you have enough posts to need the discipline
- **Command palette** (`Cmd/Ctrl+K`): quick-jump to new post/drafts/settings/search — nice polish once the admin has enough surface area to justify a shortcut
- **Internal linking / `[[wiki-links]]`**: autocomplete-linking to other posts by title — genuinely useful for a growing technical blog with cross-referencing series, but needs a reasonable post count to matter
- **Interactive content components** (tabs, accordion, steps, timeline, cards as insertable blocks inside a post) — high novelty, but a meaningfully bigger Tiptap investment than callouts/diagrams; revisit once the core writing surface (Phase 2) has been used for real and you know which of these you'd actually reach for
- **Image optimization pipeline**: `next/image` on Vercel already handles resizing, WebP/AVIF conversion, and responsive `srcset` automatically at request time — a custom compress/convert-on-upload pipeline would be duplicating what the framework already does for free. Not planned.
- **Native Android app** (`apps/mobile`): Expo + React Native, consuming `packages/types` and `packages/lib` for shared types/validation, and either the same Supabase client pattern or a thin `GET /api/*` Route Handler layer per Section 22 if a documented external contract becomes necessary. Only starts after web v1 has real, sustained usage — the reserved folder in Section 7.2 exists purely so this doesn't require a repo restructure when it does start.

---

## 14. Non-Functional Requirements

| Category        | Requirement                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance     | LCP < 2.0s on 4G for post pages; ISR revalidation ≤ 60s after publish/edit                                                                           |
| Accessibility   | WCAG 2.1 AA on public pages — see Section 17 for the concrete checklist                                                                              |
| SEO             | Every public page has unique title/description; no duplicate-content issues between `/posts/[slug]` and any future cross-post                        |
| Security        | RLS on every table; signed URLs for private storage objects; rate limiting on auth and search endpoints                                              |
| Reliability     | No data loss on autosave failure — client retries with exponential backoff and warns the user before letting them navigate away with unsaved changes |
| Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge; mobile Safari and Chrome                                                                           |

---

## 15. Security

- **Auth:** Supabase Auth, GitHub + Google OAuth providers only. No public signup route exists — the admin account is provisioned manually (allowlist by email in a Supabase policy or a single seeded admin row).
- **RLS policies (concrete, not just "role based access"):**
  - `posts`: `SELECT` allowed where `status = 'published' AND visibility = 'public'` OR `author_id = auth.uid()`. `INSERT/UPDATE/DELETE` allowed only where `author_id = auth.uid()`.
  - `categories`, `tags`, `series`: public `SELECT`; writes restricted to authenticated admin.
  - Storage buckets: `covers/` and `posts/` public-read, admin-write; validate MIME type and max file size (e.g., 5MB images, 50MB video) at upload time via a storage policy + client-side check.
- **Rate limiting:** on auth callback and `/search` (basic IP-based limiter, e.g., via Vercel middleware or Upstash) to prevent abuse.
- **Input validation:** every server action validated with Zod before hitting the DB, including on the server (never trust client-side validation alone).

---

## 16. Error Pages & Loading States

Cheap to spec explicitly so they don't get skipped:

- **`/404`** — on-brand, links back to `/` and `/posts`, optionally a search box
- **`/500`** — generic apology + link home, no stack traces exposed
- **Offline fallback** — only relevant if a service worker ever exists; for v1, a plain "you're offline" static page is enough, no real offline reading (that's explicitly out of scope per Section 4)
- **Empty states** — no posts yet in a category/tag/search result: a plain message, not a blank page ("No posts here yet — check back soon")
- **Loading skeletons** — Home, Post, Dashboard, Editor, Search (built alongside each page in the phase that ships it, per Section 13, Phase 2)

---

## 17. Accessibility Checklist

Expanding "WCAG 2.1 AA" into what that actually means for this build:

- Skip-to-content link, visible on keyboard focus
- Semantic heading hierarchy (one `h1` per page, no skipped levels)
- `alt` text required (not optional) on image upload in the editor — block publish if a content image has no alt text; decorative images use `alt=""`
- Full keyboard navigation on all interactive elements (nav, editor toolbar, dashboard tables) — no mouse-only interactions
- Visible focus states on every focusable element (no `outline: none` without a replacement)
- Color contrast meeting AA (4.5:1 body text, 3:1 large text/UI) in both dark and light themes
- `prefers-reduced-motion` respected (Section 8)
- ARIA labels on icon-only buttons (theme toggle, copy-code button, etc.)

No dedicated screen-reader testing pass is planned for v1 given solo-dev bandwidth — the above checklist gets you most of the way there; a manual VoiceOver/NVDA spot-check on the post template is worth doing once during Phase 3, not an ongoing commitment.

---

## 18. Testing Strategy

Deliberately lightweight for a solo project — an automated suite is not in Phase 1–3 scope (Section 4), but skipping _all_ verification is how regressions slip into a live blog silently. The practical approach:

- **Manual acceptance testing** against each phase's "Done when" criteria (Section 13) before moving to the next phase — this is the primary gate, already built into the PRD's structure
- **Lighthouse** as the one automated check that's already required (Section 13, Phase 3) — run in CI (Vercel's Lighthouse integration or a GitHub Action) so it's not a manual step you forget
- **Type safety** (TypeScript + Zod schemas shared client/server) catches a meaningful chunk of what a unit-test suite would otherwise cover, for comparatively little extra effort
- If the project grows past solo-use (multi-author, real traffic), revisit: unit tests on the Tiptap → HTML render pipeline (the one piece of logic most likely to silently drift) would be the first thing worth adding, not a full E2E suite

---

## 19. Rationale Notes (responses to review feedback)

A couple of schema decisions got questioned during review; keeping the reasoning here so it isn't relitigated later:

- **`rendered_html` (formerly `content_html`) stays, renamed.** The read:write ratio on a blog is extreme — a post gets written once, read thousands of times. Caching rendered HTML alongside the Tiptap JSON source avoids re-rendering on every single page view. This is the standard pattern, not premature optimization; removing it would mean recomputing the same render on every request for no benefit. Renamed for clarity: "content" was ambiguous between the JSON source and the rendered output; `rendered_html` makes the derived, generated, don't-hand-edit nature of the column explicit at the schema level.
- **`views_count` stays.** A denormalized integer, incremented via one RPC call, is simpler to read from than aggregating `post_views` on every page load — keeping it isn't over-engineering, dropping it would add a query for no simplification. `post_views` remains the detailed log for Phase 4 analytics; the two aren't redundant, they serve different granularities.
- **Monorepo shell adopted in v1.3, but only the shell.** The question was whether reserving `apps/mobile` and `packages/types`/`packages/lib` now constitutes scope creep against Section 21's #1 risk. It doesn't, because none of it is a feature: `apps/mobile` never gets a dependency installed into it until Phase 4 at the earliest, and `packages/types`/`packages/lib` are just the same TypeScript that would otherwise live inside `apps/web` — moving their location costs nothing today and avoids a real refactor later. Turborepo, `packages/ui`, and `packages/config` were deliberately left out for the same reason in reverse: they'd add tooling with zero present benefit.

---

## 20. Success Metrics

Since this is a solo project, "success" is behavioral, not vanity metrics:

- **Adoption (self):** you publish at least 1 post/week for 4 consecutive weeks post-launch, using this platform as the primary writing surface (not drafting elsewhere first)
- **Performance:** Lighthouse 95+ maintained on post template after Phase 3
- **Reach:** organic (Google) traffic appears in Search Console within 4 weeks of sitemap submission
- **Reliability:** zero reported/observed data loss incidents from autosave

---

## 21. Risks & Open Questions

| Risk                                                                               | Mitigation                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scope creep (this is the #1 risk for a solo dev with a feature-rich reference PRD) | Hard phase gates — Section 13 order is not optional. This v1.2 revision itself is a scope-creep risk — every addition was slotted into an existing phase rather than added as new parallel work; if a phase starts running long, cut from the _end_ of that phase's list first |
| Tiptap JSON → HTML rendering drift between editor preview and public page          | Use one shared rendering function for both preview and public page, no duplicate logic — this now also covers Mermaid/KaTeX/callout rendering, not just base Markdown                                                                                                          |
| Postgres full-text search feels worse than expected at scale                       | Acceptable for v1; Algolia is a clean swap-in later since search is isolated behind one query function                                                                                                                                                                         |
| Autosave conflicts if editing from two tabs/devices                                | Single-author risk is low; add a "this post was edited elsewhere" banner as a cheap guard rather than building real conflict resolution                                                                                                                                        |
| Monorepo shell (Section 7.2) turns into premature mobile work                      | `apps/mobile` stays literally empty — a `.gitkeep` and nothing else — until Phase 4 is reached and web v1 has real usage data. Any PR touching `apps/mobile` before then is out of scope by definition                                                                         |

**Open questions to resolve before Phase 1 starts:**

1. Custom domain ready to point at Vercel?
2. Is GitHub OAuth or Google OAuth the primary login you'll actually use day-to-day?
3. Any existing content (from Dev.to/Hashnode/Medium) to migrate, or starting fresh? (This now has a concrete answer path — Markdown import in Phase 2 — but still worth deciding before Phase 1 so the schema/slug strategy accounts for existing URLs if SEO equity needs preserving via `canonical_url` or redirects.)

---

## 22. API Design

Admin mutations go through Next.js Server Actions, not a separate REST layer — no reason to build/maintain a second API surface when the only client is this app's own admin UI. Documented here as actions, not routes:

```
createPost(input)
updatePost(id, input)
deletePost(id)
publishPost(id)
schedulePost(id, scheduledFor)
uploadMedia(file, folder)
deleteMedia(path)
importMarkdown(fileOrText)          // Phase 2 — parses to Tiptap JSON, creates draft
exportPostAsMarkdown(id)            // Phase 4 — for manual cross-posting
exportAllPosts()                    // Phase 4 — bulk, Settings → Export
createCategory(input) / updateCategory / deleteCategory
createTag(input) / updateTag / deleteTag
createSeries(input) / updateSeries / reorderSeriesPost(seriesId, postId, newOrder)
```

Read paths (public pages) use Server Components querying Supabase directly — no action layer needed for reads.

If a genuine external API ever becomes necessary (e.g., the future Android app in Phase 4, or Dev.to/Hashnode cross-posting needing a documented contract), formalize `GET /api/posts`, `GET /api/posts/[slug]`, `GET /api/search` as Route Handlers at that point — premature to build now against zero external consumers. When the Android app does reach this point, it can reuse the same `packages/types`/`packages/lib` validation schemas that these Route Handlers would validate against, since both live in the same repo per Section 7.2.

---

## 23. Out of Scope (restated for clarity)

Comments, reactions, newsletter, multi-author, AI features, native Android app, iOS app, PWA, offline reading, monetization, Algolia, Realtime collaboration, interactive in-article components (tabs/accordion/steps), automated test suite, direct Dev.to/Hashnode API cross-posting — all deliberately excluded from this document's committed scope (Phases 1–3). The `apps/mobile` folder reserved in Section 7.2 is infrastructure, not a commitment — revisit the app itself only after v1 has real usage data.
