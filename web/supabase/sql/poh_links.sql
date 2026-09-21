-- Proof of Humanity linking + the inputs of the nightly PoH recompute.
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md), BEFORE the updated
-- airdrop_leaderboard.sql: its refresh reads every table below.
--
-- WHY THE PoH POOL IS RECOMPUTED RATHER THAN STORED
-- -------------------------------------------------
-- PoH eligibility is decided on an announced PoH snapshot day, and links credit all history, so
-- any link, new verification or expiry changes every past day. A share frozen into
-- airdrops.share_of_holding_poh / is_poh on the day it was computed cannot follow that. The
-- leaderboard refresh therefore recomputes the whole PoH distribution nightly from the stored
-- daily holdings, the CURRENT links (poh_links) and the CURRENT verified set (poh_humans). The
-- result is an estimate until the snapshot day, when the same computation is final.
-- airdrops.share_of_holding_poh / is_poh / seer_tokens_count are legacy: still written by the
-- daily job, read by nothing.
--
-- PRIVACY
-- -------
-- Every table here is service_role only. The browser never reads Supabase directly; the only
-- path to poh_links is netlify/functions/poh-links.ts, which filters on the caller's JWT address.

-- ---------------------------------------------------------------------------------------------
-- poh_links: "the PoH share of this wallet's holdings goes to this PoH profile".
--
-- One row per wallet per chain the link was made on (the SIWE sign-in proves control on that
-- chain, since a Safe can have different owners per network). Resolution, done in
-- refresh_airdrop_leaderboard:
--   1. wallet itself in poh_humans      → the wallet (a verified wallet cannot link away)
--   2. a link made on the holding chain → its poh_address
--   3. the wallet's most recent link    → its poh_address (other chains follow)
--   4. otherwise                        → the wallet
-- Step 2 needs per-chain holdings, which only exist in airdrop_chain_holdings (from deploy on);
-- older days resolve the whole cross-chain holding through step 3.
--
-- No history columns: nothing is frozen, so an unlink or change simply applies to all days on
-- the next recompute.
create table if not exists public.poh_links (
  address     text        not null check (address = lower(address)),
  chain_id    integer     not null,
  poh_address text        not null check (poh_address = lower(poh_address)),
  created_at  timestamptz not null default now(),
  primary key (address, chain_id),
  check (poh_address <> address)
);

-- ---------------------------------------------------------------------------------------------
-- poh_humans: addresses currently registered on PoH (Mainnet or Gnosis), not expired.
-- Rewritten by refresh-airdrop-leaderboard-background through replace_poh_humans() right before
-- the leaderboard refresh, so the recompute always sees one consistent set.
create table if not exists public.poh_humans (
  address      text        primary key check (address = lower(address)),
  refreshed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- airdrop_poh_day_totals: per snapshot day, sum(sqrt(identity holding)) over verified identities,
-- from the last 'all' recompute. The denominator get_poh_potential needs.
create table if not exists public.airdrop_poh_day_totals (
  "timestamp" timestamptz      primary key,
  poh_total   double precision not null
);

-- ---------------------------------------------------------------------------------------------
-- airdrop_chain_holdings: per-chain split of airdrops.total_holding, for MULTI-chain holders only
-- (a single-chain holder's row already says which chain). Written by the daily job just before
-- insert_airdrop_safely, keyed so a retried day overwrites rather than duplicates. Rows are only
-- used when they join an `airdrops` row, so a day whose insert later failed leaves no trace.
create table if not exists public.airdrop_chain_holdings (
  "timestamp" timestamptz      not null,
  address     text             not null,
  chain_id    integer          not null,
  holding     double precision not null,
  primary key ("timestamp", address, chain_id)
);

revoke all on public.poh_links, public.poh_humans, public.airdrop_poh_day_totals,
              public.airdrop_chain_holdings from anon, authenticated;
grant select, insert, update, delete on public.poh_links, public.poh_humans,
              public.airdrop_poh_day_totals, public.airdrop_chain_holdings to service_role;

-- ---------------------------------------------------------------------------------------------
-- Swap in a fresh verified set atomically: readers (the refresh) never see it half-written.
-- Refuses an empty set. That means the subgraph fetch failed, not that nobody is human, and
-- applying it would zero the whole PoH column.
create or replace function public.replace_poh_humans(p_addresses text[])
returns integer
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_rows integer;
begin
  if coalesce(array_length(p_addresses, 1), 0) = 0 then
    raise exception 'replace_poh_humans: refusing to replace the verified set with an empty one';
  end if;
  -- WHERE true: Supabase runs pg-safeupdate for API roles, which rejects an unqualified DELETE.
  delete from public.poh_humans where true;
  insert into public.poh_humans (address)
  select distinct lower(a) from unnest(p_addresses) a where a is not null;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke execute on function public.replace_poh_humans(text[]) from public;
grant execute on function public.replace_poh_humans(text[]) to service_role;

-- ---------------------------------------------------------------------------------------------
-- What an unlinked, unverified wallet would earn from the PoH pool if it linked a profile with
-- no holdings of its own: per day sqrt(h) / (poh_total + sqrt(h)), since its identity joins the
-- denominator too. RAW shares, multiplied by SEER_PER_DAY * POOL_SHARE_FACTOR in TypeScript.
--   to_date: summed over every day the wallet held something
--   latest:  the newest snapshot only, for the 30-day projection
-- Linking to a profile that already holds tokens yields a little less (sqrt is concave), which is
-- why the UI labels this an estimate.
create or replace function public.get_poh_potential(p_address text)
returns table (to_date double precision, latest double precision)
language sql
stable
security invoker
set search_path = public
as $$
  with rows as (
    select a."timestamp",
           sqrt(a.total_holding::double precision) / (t.poh_total + sqrt(a.total_holding::double precision)) as share
    from public.airdrops a
    join public.airdrop_poh_day_totals t on t."timestamp" = a."timestamp"
    where a.address = lower(p_address)
      and a.total_holding::double precision > 1e-9
  )
  select coalesce(sum(r.share), 0),
         coalesce((select r2.share from rows r2
                   where r2."timestamp" = (select max("timestamp") from public.airdrop_poh_day_totals)), 0)
  from rows r;
$$;

revoke execute on function public.get_poh_potential(text) from public;
grant execute on function public.get_poh_potential(text) to service_role;

notify pgrst, 'reload schema';
