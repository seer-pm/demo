-- Airdrop leaderboard materialization (address × period) + its read path.
-- Apply manually in the Supabase SQL editor (see web/supabase/sql/README.md).
--
-- Ranks wallets by SEER earned in a trailing window. Written once a day by
-- `refresh-airdrop-leaderboard-background`, read by `get-airdrop-leaderboard`, which serves
-- the public /leaderboard/airdrop page.
--
-- WHY MATERIALIZE
-- ---------------
-- `airdrops` holds one row per address per snapshot day since genesis (2024-10-11). A public
-- board that grouped it live would aggregate millions of rows per request and trip the
-- statement timeout (57014) the way the per-user path did before airdrops_indexes.sql. The
-- source data changes exactly once a day, so a nightly rebuild is always fresh.
--
-- RAW SUMS, NOT SEER AMOUNTS
-- --------------------------
-- sum_share_of_holding / sum_share_of_holding_poh are stored raw, exactly as
-- get_airdrop_summary_by_user does, so SEER_PER_DAY and the 0.25 factor stay defined only in
-- TypeScript (netlify/functions/utils/airdropAllocation.ts) and cannot drift.
--
-- seer_tokens = sum(seer_tokens_count) is stored anyway because it is the number the portfolio
-- Airdrop tab already shows, so a user can cross-check the board against their own page. It is
-- redundant with the two share sums — computeDailyAirdrop.ts:221 defines
--     seerTokens = SEER_PER_DAY * (shareOfHolding * 0.25 + shareOfHoldingPoh * 0.25)
-- so total == holdings + PoH up to float addition ordering (~1e-15 relative), invisible at
-- formatSeer's 3 decimal places.
--
-- Sorting on the raw sums is equivalent to sorting on the SEER amounts: the conversion is
-- multiplication by SEER_PER_DAY * 0.25, a strictly positive constant, so it preserves order
-- and maps ties to ties. The read path therefore sorts on the stored columns and converts only
-- for display.
--
-- WINDOW BOUNDARIES ARE SNAPSHOT DAYS
-- -----------------------------------
-- Snapshots are written at a RANDOM time inside each UTC day (airdropCalculation/utils.ts
-- getRandomNextDayTimestamp: UTC midnight + a random offset in [0, 86400)), so
-- `now() - interval '7 days'` would clip a partial day at each end and include 6, 7 or 8
-- snapshots depending on when the job happened to run. The cutoff is instead the Nth-newest
-- DISTINCT snapshot timestamp.
--
-- Every row for one day carries one identical "timestamp": insert_airdrop_safely takes a single
-- top-level new_timestamp and the per-row records carry none (computeDailyAirdrop.ts:347). So
-- `select distinct "timestamp"` IS the snapshot-day list.
--
-- Do NOT "simplify" this to date_trunc('day', "timestamp"): date_trunc on a timestamptz
-- resolves in the session TimeZone, so under any non-UTC session a 23:50 UTC snapshot and the
-- next day's 00:10 UTC snapshot collapse into one local day, silently making '1w' cover 8 days.
-- Using the stored values directly is both correct under any session TimeZone and indexable.
--
-- Consequence worth knowing: '1w' is the last 7 *snapshot* days, not the last 7 calendar days.
-- If the airdrop job misses a day the window stretches. day_count is surfaced in the UI so this
-- is visible rather than silent.

CREATE TABLE IF NOT EXISTS public.airdrop_leaderboard (
  address                   text             NOT NULL,
  period                    text             NOT NULL CHECK (period IN ('1d', '1w', '1m', 'all')),
  -- sum(seer_tokens_count) over the window. Already a SEER amount.
  seer_tokens               numeric          NOT NULL DEFAULT 0,
  -- Raw share sums; multiplied by SEER_PER_DAY * 0.25 in TypeScript.
  sum_share_of_holding      double precision NOT NULL DEFAULT 0,
  sum_share_of_holding_poh  double precision NOT NULL DEFAULT 0,
  -- PoH-verified on at least one day of the window (bool_or).
  is_poh                    boolean          NOT NULL DEFAULT false,
  -- Snapshot days the address actually appears in. Lower than the window span when the wallet
  -- held nothing on some days — computeDailyAirdrop skips zero-holding addresses.
  day_count                 integer          NOT NULL DEFAULT 0,
  updated_at                timestamptz      NOT NULL DEFAULT now(),
  PRIMARY KEY (address, period)
);

-- Every numeric column is NOT NULL DEFAULT 0 on purpose: the read path orders on all four, and
-- NULLs would need explicit NULLS FIRST/LAST handling in the SQL, the endpoint and the page —
-- the mess pnl_leaderboard.roi already has.

-- ONE index, for the default view. The table is n_addresses × 4 rows, and the read path sorts a
-- single period partition to assign ranks, so extra indexes would not be used for that anyway
-- while costing write time on every nightly delete+insert. Add more only if EXPLAIN on real
-- data asks for them.
CREATE INDEX IF NOT EXISTS airdrop_leaderboard_period_seer_idx
  ON public.airdrop_leaderboard (period, seer_tokens DESC);

-- Rewritten wholesale every night, so dead tuples accumulate fast relative to live rows.
ALTER TABLE public.airdrop_leaderboard SET (autovacuum_vacuum_scale_factor = 0.05);

COMMENT ON TABLE public.airdrop_leaderboard IS
  'Materialized airdrop leaderboard (address x period) for /leaderboard/airdrop. seer_tokens = sum(seer_tokens_count); the share sums are RAW (multiply by SEER_PER_DAY * 0.25 in TypeScript). Windows are the last N distinct snapshot days, not calendar days. Cross-chain: airdrops.chain_ids is an array, so there is no chain dimension. Rebuilt daily by refresh-airdrop-leaderboard-background.';

-- Refresh writes require SUPABASE_API_KEY = service_role. anon/authenticated are SELECT-only,
-- same reasoning as pnl_leaderboard.sql: an anon-key write can return 200 with 0 rows under
-- RLS, so updated_at never moves and the staleness is silent.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airdrop_leaderboard TO service_role;
GRANT SELECT ON public.airdrop_leaderboard TO anon, authenticated;


-- ---------------------------------------------------------------------------------------------
-- Refresh: recompute ONE period.
--
-- Called four times, once per period, by refresh-airdrop-leaderboard-background.
--
-- WHY ONE PERIOD PER CALL rather than all four in a single statement:
--   1. Joining a 4-row cutoff set to `airdrops` on `a."timestamp" >= c.since` is a non-equi,
--      non-sargable join predicate. No index on "timestamp" can serve it, so every period costs
--      a full table scan. Binding the cutoff to a local variable makes 1d/1w/1m indexable range
--      scans; only 'all' stays a full scan, as it must.
--   2. Supabase's API gateway caps a PostgREST request at roughly 60s. A single call that
--      recomputed everything would exceed that on the 'all' pass no matter what
--      statement_timeout says.
--   3. Each call is its own transaction, so the long 'all' pass does not pin a snapshot and hold
--      off autovacuum on `airdrops` while the cheap windows run.
--
-- On statement_timeout: `ALTER FUNCTION ... SET statement_timeout` does NOT reliably extend the
-- timer. Postgres arms it when the top-level statement begins, before the function's SET takes
-- effect, and there is no assign hook to re-arm it. Raise it at the role level if the 'all' pass
-- needs it, and check what is currently set with:
--   select rolname, rolconfig from pg_roles
--   where rolname in ('anon','authenticated','service_role','authenticator','postgres');
--
-- Atomicity: the delete and the insert run in the function's implicit transaction, so concurrent
-- readers keep seeing the previous rows on their MVCC snapshot until commit — the table is never
-- observed empty and no reader blocks. Do NOT switch to TRUNCATE: it takes ACCESS EXCLUSIVE and
-- would block every reader for the whole refresh.
CREATE OR REPLACE FUNCTION public.refresh_airdrop_leaderboard(p_period text)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_days  integer;
  -- %TYPE so this is correct whether airdrops."timestamp" is timestamptz or timestamp.
  v_since public.airdrops."timestamp"%TYPE;
  v_rows  integer;
BEGIN
  IF p_period NOT IN ('1d', '1w', '1m', 'all') THEN
    RAISE EXCEPTION 'refresh_airdrop_leaderboard: period must be one of 1d, 1w, 1m, all (got %)', p_period;
  END IF;

  v_days := CASE p_period
              WHEN '1d' THEN 1
              WHEN '1w' THEN 7
              WHEN '1m' THEN 30
              ELSE NULL           -- 'all' has no cutoff
            END;

  IF v_days IS NOT NULL THEN
    -- Oldest of the v_days newest distinct snapshot timestamps, inclusive.
    SELECT min(t.ts) INTO v_since
    FROM (
      SELECT DISTINCT a."timestamp" AS ts
      FROM public.airdrops a
      ORDER BY 1 DESC
      LIMIT v_days
    ) t;

    IF v_since IS NULL THEN
      -- Source table empty: clear the period rather than leaving stale rows behind.
      DELETE FROM public.airdrop_leaderboard WHERE period = p_period;
      RETURN 0;
    END IF;
  END IF;

  DELETE FROM public.airdrop_leaderboard WHERE period = p_period;

  -- The two branches are deliberately not folded into `WHERE v_since IS NULL OR ...`: that
  -- predicate defeats the index for the windowed periods.
  IF v_since IS NULL THEN
    INSERT INTO public.airdrop_leaderboard (
      address, period, seer_tokens, sum_share_of_holding, sum_share_of_holding_poh,
      is_poh, day_count, updated_at
    )
    SELECT a.address,
           p_period,
           coalesce(sum(a.seer_tokens_count::numeric), 0),
           coalesce(sum(a.share_of_holding::double precision), 0),
           coalesce(sum(a.share_of_holding_poh::double precision), 0),
           bool_or(a.is_poh),
           count(*)::integer,
           now()
    FROM public.airdrops a
    GROUP BY a.address;
  ELSE
    INSERT INTO public.airdrop_leaderboard (
      address, period, seer_tokens, sum_share_of_holding, sum_share_of_holding_poh,
      is_poh, day_count, updated_at
    )
    SELECT a.address,
           p_period,
           coalesce(sum(a.seer_tokens_count::numeric), 0),
           coalesce(sum(a.share_of_holding::double precision), 0),
           coalesce(sum(a.share_of_holding_poh::double precision), 0),
           bool_or(a.is_poh),
           count(*)::integer,
           now()
    FROM public.airdrops a
    WHERE a."timestamp" >= v_since
    GROUP BY a.address;
  END IF;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RAISE NOTICE 'refresh_airdrop_leaderboard(%): % rows, since=%', p_period, v_rows, v_since;
  RETURN v_rows;
END;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on new functions. Without this revoke, anon could
-- POST to the RPC and burn a full-table aggregate per request — the table grants stop the write
-- but not the CPU.
REVOKE EXECUTE ON FUNCTION public.refresh_airdrop_leaderboard(text) FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_airdrop_leaderboard(text) TO service_role;


-- ---------------------------------------------------------------------------------------------
-- Read: one page of the board, with GLOBAL ranks.
--
-- WHY AN RPC INSTEAD OF A PLAIN POSTGREST SELECT
-- ----------------------------------------------
-- Rank has to be assigned over the whole period partition, before any address filter. With
-- PostgREST the endpoint could only do `.ilike(...).range(...)` and label rows `offset + i + 1`,
-- which is the position within the *filtered* set — so searching would report a wallet as rank 1
-- when it is actually rank 4,812. get-pnl-leaderboard avoids that by loading every row and
-- ranking in TypeScript; doing the ranking in SQL keeps the response O(page).
--
-- It also makes rankFor exact. Counting "rows strictly better, + 1" gives every member of a tie
-- block the same rank, and day_count / a zero seer_tokens produce tie blocks thousands of rows
-- long, so `page = floor((rank - 1) / pageSize)` would land nowhere near the wallet. row_number()
-- over the same total order the page uses (sort column, then address) is the true position.
--
-- The endpoint calls this with p_search = the full address to answer rankFor, reading `rank` off
-- the single returned row — one code path for the list, the search box and "Your Rank".
--
-- p_sort / p_dir are whitelisted into identifiers below; no caller text reaches the SQL text.
-- p_search is passed as a bind parameter, never interpolated.
CREATE OR REPLACE FUNCTION public.get_airdrop_leaderboard_page(
  p_period text,
  p_sort   text DEFAULT 'seer',
  p_dir    text DEFAULT 'desc',
  p_search text DEFAULT '',
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  rank                     bigint,
  address                  text,
  seer_tokens              numeric,
  sum_share_of_holding     double precision,
  sum_share_of_holding_poh double precision,
  is_poh                   boolean,
  day_count                integer,
  updated_at               timestamptz,
  -- Rows matching p_search (equals board_count when p_search is empty). Drives pagination.
  total_count              bigint,
  -- Rows in the period, ignoring p_search. Used as the denominator for "rank X of Y".
  board_count              bigint
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_col text;
  v_dir text;
BEGIN
  IF p_period NOT IN ('1d', '1w', '1m', 'all') THEN
    RAISE EXCEPTION 'get_airdrop_leaderboard_page: period must be one of 1d, 1w, 1m, all (got %)', p_period;
  END IF;

  v_col := CASE p_sort
             WHEN 'seer'     THEN 'seer_tokens'
             WHEN 'holdings' THEN 'sum_share_of_holding'
             WHEN 'poh'      THEN 'sum_share_of_holding_poh'
             WHEN 'days'     THEN 'day_count'
             ELSE NULL
           END;
  IF v_col IS NULL THEN
    RAISE EXCEPTION 'get_airdrop_leaderboard_page: sort must be one of seer, holdings, poh, days (got %)', p_sort;
  END IF;

  v_dir := CASE lower(p_dir) WHEN 'asc' THEN 'ASC' WHEN 'desc' THEN 'DESC' ELSE NULL END;
  IF v_dir IS NULL THEN
    RAISE EXCEPTION 'get_airdrop_leaderboard_page: dir must be asc or desc (got %)', p_dir;
  END IF;

  RETURN QUERY EXECUTE format($f$
    WITH ranked AS (
      SELECT l.address, l.seer_tokens, l.sum_share_of_holding, l.sum_share_of_holding_poh,
             l.is_poh, l.day_count, l.updated_at,
             -- The address tiebreak makes the order total, so row_number() is the true
             -- position. The endpoint must not re-sort the rows it gets back.
             row_number() OVER (ORDER BY l.%1$I %2$s, l.address ASC) AS rank
      FROM public.airdrop_leaderboard l
      WHERE l.period = $1
    ),
    filtered AS (
      SELECT r.* FROM ranked r
      -- Addresses are stored lowercase and 0x-prefixed; the endpoint strips 0x and lowercases,
      -- so a plain substring test is enough and needs no LIKE escaping.
      -- Explicit ::text so the parameter's type never has to be inferred from `= ''`.
      WHERE $2::text = '' OR position($2::text IN r.address) > 0
    )
    SELECT f.rank, f.address, f.seer_tokens, f.sum_share_of_holding, f.sum_share_of_holding_poh,
           f.is_poh, f.day_count, f.updated_at,
           -- Window functions run before LIMIT, so this is the full filtered count.
           count(*) OVER () AS total_count,
           (SELECT count(*) FROM ranked) AS board_count
    FROM filtered f
    ORDER BY f.rank
    LIMIT $3 OFFSET $4
  $f$, v_col, v_dir)
  USING p_period, p_search, p_limit, p_offset;
END;
$$;

-- Public board data; the same audience that can SELECT the table.
GRANT EXECUTE ON FUNCTION public.get_airdrop_leaderboard_page(text, text, text, text, integer, integer)
  TO anon, authenticated, service_role;

-- PostgREST caches the schema; without this the RPCs 404 (PGRST202) until the next reload.
notify pgrst, 'reload schema';

-- Build the board now, so a hand-apply does not leave it empty until the next nightly refresh.
-- Cheap periods first; 'all' is the one that might need a longer statement_timeout.
SELECT public.refresh_airdrop_leaderboard('1d');
SELECT public.refresh_airdrop_leaderboard('1w');
SELECT public.refresh_airdrop_leaderboard('1m');
SELECT public.refresh_airdrop_leaderboard('all');
