-- Idempotent username schema. Apply before deploying username-aware functions.
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
