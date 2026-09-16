-- Idempotent X (Twitter) account schema. Apply BEFORE deploying the functions that read it: `users` GET
-- selects `x_account`, so deploying first breaks every username lookup until the column exists.
--
-- Both columns are written only by `x-callback` after X's OAuth confirms the account, so a non-null value
-- means verified. There is no separate "verified" flag to drift out of sync.
--
--   * `x_user_id` is X's stable numeric id and is the identity: the unique index makes one X account back
--     at most one wallet, even across handle renames.
--   * `x_account` is the handle for display. It is deliberately NOT unique: X recycles handles, and a stale
--     copy on another wallet must not block the handle's new owner. `x-callback` clears such stale copies.
alter table public.users add column if not exists x_user_id text;
alter table public.users add column if not exists x_account text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_x_account_lowercase'
      and conrelid = 'public.users'::regclass
  ) then
    -- X handles are case-insensitive, so the stored form is canonical and comparisons stay exact.
    alter table public.users
      add constraint users_x_account_lowercase
      check (x_account = lower(x_account));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_x_account_pair'
      and conrelid = 'public.users'::regclass
  ) then
    -- The id is only ever set together with a handle, and disconnecting clears both. The one exception
    -- is a stale handle cleared by another wallet's verification, which nulls the pair together too.
    alter table public.users
      add constraint users_x_account_pair
      check ((x_user_id is null) = (x_account is null));
  end if;
end
$$;

create unique index if not exists users_x_user_id_unique
  on public.users (x_user_id);

create index if not exists users_x_account_idx
  on public.users (x_account);
