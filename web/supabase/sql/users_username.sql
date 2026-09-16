-- Idempotent username schema. Apply before deploying username-aware functions.
--
-- The column stays NULLABLE on purpose: a Seer username is opt-in, and the display layer falls back
-- to ENS and then to a nickname generated from the address. Two Postgres details make that safe, so
-- do not "tighten" either one:
--   * a btree unique index treats NULLs as distinct, so any number of users may have no username;
--   * a CHECK whose operand is NULL evaluates to NULL, which PASSES, so users_username_format below
--     already tolerates a null username without needing an explicit `username is null or ...`.
alter table public.users add column if not exists username text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_lowercase'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_username_lowercase
      check (username = lower(username));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_format'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_username_format
      check (
        char_length(username) between 3 and 50
        and username ~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$'
        and username not in ('admin', 'help', 'moderator', 'official', 'seer', 'support')
      );
  end if;
end
$$;

create unique index if not exists users_username_unique
  on public.users (username);
