-- Apply after scripts/backfill-usernames.ts has populated every existing row.
alter table public.users alter column username set not null;
