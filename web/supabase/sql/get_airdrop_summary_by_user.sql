-- Aggregates a user's entire airdrop history into a single row.
--
-- Used by netlify/functions/get-airdrop-data-by-user.ts. That endpoint previously selected
-- every row for the user (one per day since genesis) and summed them in Node, which trips
-- the statement timeout as the table grows. Response size is now O(1) in account age.
--
-- This deliberately returns RAW sums rather than SEER amounts: SEER_PER_DAY and the 0.25
-- factor stay defined only in TypeScript, so the two implementations cannot silently drift.
--
-- p_week_start is supplied by the caller (date-fns startOfWeek(now, { weekStartsOn: 1 }))
-- so the "current week" boundary is defined in exactly one place. When null it falls back to
-- date_trunc('week', now()), which is also Monday-based.
--
-- Semantics map 1:1 onto what the Node code did:
--   sum(share_of_holding)                      <- reduce(acc + SEER_PER_DAY * share_of_holding * 0.25)
--   sum(share_of_holding_poh)                  <- reduce(acc + SEER_PER_DAY * share_of_holding_poh * 0.25)
--   sum(seer_tokens_count)                     <- reduce(acc + seer_tokens_count)
--   sum(...) filter (timestamp >= week start)  <- reduce with the startOfWeek check
--   order by timestamp desc limit 1            <- data[data.length - 1] on an ascending array
--
-- The explicit ::double precision casts keep Postgres summing in the same binary float
-- representation JS uses. Residual difference is float addition ordering (~1e-15 relative),
-- which is invisible after toLocaleString() in the UI.
--
-- If airdrops."timestamp" turns out to be `timestamp without time zone` rather than
-- `timestamptz`, change the filter comparison to `(select ts at time zone 'UTC' from week_start)`.
-- Confirm with:
--   select data_type from information_schema.columns
--   where table_name = 'airdrops' and column_name = 'timestamp';

create or replace function public.get_airdrop_summary_by_user(
  p_address text,
  p_week_start timestamptz default null
)
returns table (
  sum_share_of_holding      double precision,
  sum_share_of_holding_poh  double precision,
  total_seer_tokens         double precision,
  current_week_seer_tokens  double precision,
  last_share_of_holding     double precision,
  last_share_of_holding_poh double precision,
  row_count                 bigint
)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  with week_start as (
    select coalesce(p_week_start, date_trunc('week', now())) as ts
  ),
  user_rows as (
    select a."timestamp", a.share_of_holding, a.share_of_holding_poh, a.seer_tokens_count
    from public.airdrops a
    where a.address = lower(p_address)
  )
  select
    coalesce(sum(r.share_of_holding::double precision), 0),
    coalesce(sum(r.share_of_holding_poh::double precision), 0),
    coalesce(sum(r.seer_tokens_count::double precision), 0),
    coalesce(sum(r.seer_tokens_count::double precision)
             filter (where r."timestamp" >= (select ts from week_start)), 0),
    coalesce((select share_of_holding::double precision from user_rows
              order by "timestamp" desc limit 1), 0),
    coalesce((select share_of_holding_poh::double precision from user_rows
              order by "timestamp" desc limit 1), 0),
    count(*)
  from user_rows r;
$$;

grant execute on function public.get_airdrop_summary_by_user(text, timestamptz)
  to anon, authenticated, service_role;

-- PostgREST caches the schema; without this the RPC 404s (PGRST202) until the next reload.
-- The endpoint falls back to the row-scan path on PGRST202, so a missed reload degrades
-- rather than breaks.
notify pgrst, 'reload schema';
