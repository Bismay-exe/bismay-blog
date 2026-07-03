-- Migration: 20260704_initial_schema
-- Phase 1 — Foundation
-- Creates: profiles, categories, tags, series, posts, post_tags, post_views
-- + RLS policies, indexes, triggers, and helper functions

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- updated_at auto-maintenance trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  username     text unique not null,
  avatar_url   text,
  bio          text,
  github_url   text,
  linkedin_url text,
  twitter_url  text,
  website_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create index idx_profiles_username on public.profiles (username);

-- Anyone can read profiles (for public author pages)
create policy "profiles_public_select"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- Only the profile owner can update their own profile
create policy "profiles_owner_update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profile row is inserted by the handle_new_user trigger
create policy "profiles_owner_insert"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ============================================================
-- CATEGORIES
-- ============================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger handle_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

alter table public.categories enable row level security;

create index idx_categories_slug on public.categories (slug);

create policy "categories_select"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Single-admin blog: any authenticated user = the admin
create policy "categories_insert"
  on public.categories for insert
  to authenticated
  with check (true);

create policy "categories_update"
  on public.categories for update
  to authenticated
  using (true) with check (true);

create policy "categories_delete"
  on public.categories for delete
  to authenticated
  using (true);

-- ============================================================
-- TAGS
-- ============================================================

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

create index idx_tags_slug on public.tags (slug);

create policy "tags_select"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "tags_insert"
  on public.tags for insert
  to authenticated
  with check (true);

create policy "tags_update"
  on public.tags for update
  to authenticated
  using (true) with check (true);

create policy "tags_delete"
  on public.tags for delete
  to authenticated
  using (true);

-- ============================================================
-- SERIES
-- ============================================================

create table public.series (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  description     text,
  cover_image_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger handle_series_updated_at
  before update on public.series
  for each row execute function public.handle_updated_at();

alter table public.series enable row level security;

create index idx_series_slug on public.series (slug);

create policy "series_select"
  on public.series for select
  to anon, authenticated
  using (true);

create policy "series_insert"
  on public.series for insert
  to authenticated
  with check (true);

create policy "series_update"
  on public.series for update
  to authenticated
  using (true) with check (true);

create policy "series_delete"
  on public.series for delete
  to authenticated
  using (true);

-- ============================================================
-- POSTS
-- ============================================================

create table public.posts (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  slug                 text unique not null,
  excerpt              text,
  -- Tiptap ProseMirror JSON document — the source of truth
  content              jsonb not null default '{}'::jsonb,
  -- Pre-rendered HTML cache — generated on save, never hand-edited
  rendered_html        text,
  cover_image_url      text,
  status               text not null default 'draft'
                         check (status in ('draft','published','scheduled')),
  visibility           text not null default 'public'
                         check (visibility in ('public','private')),
  series_id            uuid references public.series(id) on delete set null,
  series_order         int,
  author_id            uuid not null references public.profiles(id) on delete cascade,
  reading_time_minutes int,
  word_count           int,
  -- Denormalized counter, incremented via RPC to avoid aggregation on every page view
  views_count          int not null default 0,
  seo_title            text,        -- Falls back to title
  seo_description      text,        -- Falls back to excerpt
  canonical_url        text,        -- For cross-posted content
  featured             boolean not null default false,  -- Homepage hero slot
  pinned               boolean not null default false,  -- Pins to top of /posts
  published_at         timestamptz,
  scheduled_for        timestamptz,
  -- Full-text search vector — maintained by trigger below
  search_vector        tsvector,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger handle_posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

alter table public.posts enable row level security;

-- Indexes per PRD Section 11
create index idx_posts_status       on public.posts (status);
create index idx_posts_published_at on public.posts (published_at desc);
create index idx_posts_author_id    on public.posts (author_id);
create index idx_posts_series_id    on public.posts (series_id);
create index idx_posts_slug         on public.posts (slug);
create index idx_posts_featured     on public.posts (featured) where featured = true;
create index idx_posts_pinned       on public.posts (pinned)   where pinned = true;
create index idx_posts_search_vector on public.posts using gin(search_vector);

-- Public readers can see published + public posts
create policy "posts_public_select"
  on public.posts for select
  to anon
  using (
    status = 'published'
    and visibility = 'public'
  );

-- The admin can see all their own posts (any status)
create policy "posts_author_select"
  on public.posts for select
  to authenticated
  using ((select auth.uid()) = author_id);

create policy "posts_author_insert"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "posts_author_update"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "posts_author_delete"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- ============================================================
-- POST_TAGS (join table)
-- ============================================================

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

create index idx_post_tags_tag_id on public.post_tags (tag_id);

create policy "post_tags_select"
  on public.post_tags for select
  to anon, authenticated
  using (true);

create policy "post_tags_insert"
  on public.post_tags for insert
  to authenticated
  with check (true);

create policy "post_tags_delete"
  on public.post_tags for delete
  to authenticated
  using (true);

-- ============================================================
-- POST_VIEWS (Phase 3 analytics stub)
-- ============================================================

create table public.post_views (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  -- Hashed IP+UA — no raw PII stored
  viewer_hash text not null,
  created_at  timestamptz not null default now()
);

alter table public.post_views enable row level security;

create index idx_post_views_post_id    on public.post_views (post_id);
create index idx_post_views_created_at on public.post_views (created_at desc);

create policy "post_views_anon_insert"
  on public.post_views for insert
  to anon, authenticated
  with check (true);

create policy "post_views_admin_select"
  on public.post_views for select
  to authenticated
  using (true);

-- ============================================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================================

create or replace function public.posts_search_vector_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')),           'A') ||
    setweight(to_tsvector('english', coalesce(new.seo_title, '')),       'B') ||
    setweight(to_tsvector('english', coalesce(new.excerpt, '')),         'B') ||
    setweight(to_tsvector('english', coalesce(new.seo_description, '')), 'C');
  return new;
end;
$$;

create trigger posts_search_vector_trigger
  before insert or update of title, seo_title, excerpt, seo_description
  on public.posts
  for each row execute function public.posts_search_vector_update();

-- ============================================================
-- VIEWS COUNT RPC
-- ============================================================

create or replace function public.increment_post_views(post_slug text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.posts
  set views_count = views_count + 1
  where slug = post_slug
    and status = 'published'
    and visibility = 'public';
$$;

grant execute on function public.increment_post_views(text) to anon, authenticated;

-- ============================================================
-- AUTO-CREATE PROFILE ON OAUTH SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _name     text;
  _username text;
begin
  _name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  _username := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g'));

  if exists (select 1 from public.profiles where username = _username) then
    _username := _username || '-' || substring(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, name, username, avatar_url)
  values (
    new.id,
    _name,
    _username,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- This is a trigger function only — block direct REST API calls
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- GRANTS (Data API access)
-- ============================================================

grant select on public.profiles   to anon;
grant select on public.posts      to anon;
grant select on public.categories to anon;
grant select on public.tags       to anon;
grant select on public.series     to anon;
grant select on public.post_tags  to anon;
grant insert on public.post_views to anon;

grant all on public.profiles   to authenticated;
grant all on public.posts      to authenticated;
grant all on public.categories to authenticated;
grant all on public.tags       to authenticated;
grant all on public.series     to authenticated;
grant all on public.post_tags  to authenticated;
grant all on public.post_views to authenticated;
