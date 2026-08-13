-- Market comments (replaces Orbis Social threads).
-- Apply in Supabase SQL editor (or via migration tooling).

create table if not exists public.market_comments (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  author text not null,
  body text not null,
  parent_id uuid references public.market_comments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists market_comments_market_id_created_at_idx
  on public.market_comments (market_id, created_at desc)
  where deleted_at is null;

create index if not exists market_comments_parent_id_idx
  on public.market_comments (parent_id)
  where deleted_at is null;

create table if not exists public.market_comment_likes (
  comment_id uuid not null references public.market_comments (id) on delete cascade,
  author text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, author)
);

create index if not exists market_comment_likes_author_idx
  on public.market_comment_likes (author);
