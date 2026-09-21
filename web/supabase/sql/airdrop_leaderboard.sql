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
-- seer_tokens = p_pool_seer_per_day * (sum_share_of_holding + sum_share_of_holding_poh), with the
-- factor passed in by the TypeScript caller. It is not sum(airdrops.seer_tokens_count): that
-- column bakes in the frozen daily PoH share, which is legacy (next section).
--
-- THE PoH COLUMN IS RECOMPUTED, NOT SUMMED
-- ----------------------------------------
-- sum_share_of_holding_poh does NOT come from airdrops.share_of_holding_poh. Every refresh
-- recomputes the whole PoH distribution for the window from the stored daily holdings
-- (airdrops.total_holding, plus airdrop_chain_holdings where a per-chain split exists), the CURRENT
-- links (poh_links) and the CURRENT verified set (poh_humans). A link, a new verification or an
-- expiry therefore applies to every past day on the next refresh. It is an estimate until the
-- announced PoH snapshot day, when the same computation is final. Tables and link resolution are
-- documented in poh_links.sql, which must be applied first.
--
-- A PoH profile that holds nothing itself but receives linked holdings gets its own row, with
-- day_count 0. is_poh means "verified now", not "verified on some day of the window".
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
--
-- SER-LPP IS 'all' ONLY
-- ---------------------
-- ser_lpp is the wallet's CURRENT SER LP-program balance, summed over Gnosis and Mainnet from
-- `ser_lpp_balances` (rewritten every 12h by ser-lpp-calculation-background). It is a running
-- balance, not a per-day emission: there is no history to slice, so it cannot be windowed and is
-- stored as 0 on '1d'/'1w'/'1m'. Only the 'all' rows carry it, and the endpoint reports it as
-- null on the other three so the UI shows "not applicable" rather than a real zero.
--
-- It is in the same unit as seer_tokens (1 SER-LPP = 1 SEER of allocation), which is why
-- total_seer can add them. It does NOT feed the holdings/PoH percentages: those measure the two
-- daily-emission pools against the whole programme, and the LP half was always in their
-- denominator.
--
-- Its OWN percentage is built the other way round. There is no emission to measure a balance
-- against, so the read RPC returns board_ser_lpp -- sum(ser_lpp) over the whole period partition --
-- and the endpoint reports balance / board_ser_lpp of the LP programme's 50% (computePctOfLpp in
-- airdropCalculation/constants.ts). That makes the exclusion below load-bearing twice over: an
-- excluded contract dropped from the numerators but left in the denominator would deflate every
-- real LP's percentage, and the column would no longer add to 50% across the board.
--
-- The 'all' refresh FULL JOINs the two sources, so a wallet that only ever provided liquidity —
-- no outcome-token holdings, no PoH, no `airdrops` rows at all — now appears on the board with
-- day_count 0. That is intended: it has an allocation. Note `ser_lpp_balances` holds whatever
-- addresses hold the LP token, and nothing prunes a wallet that has since exited (getTokenHolders
-- filters balance > 0, but the writer only upserts, never deletes). The treasury and the two
-- custody contracts hold the LP token without providing liquidity, and the `lpp` CTE below drops
-- them by address — the board's view only, the table itself keeps every holder.

CREATE TABLE IF NOT EXISTS public.airdrop_leaderboard (
  address                   text             NOT NULL,
  period                    text             NOT NULL CHECK (period IN ('1d', '1w', '1m', 'all')),
  -- Holdings + recomputed PoH over the window, as SEER (factor passed by the caller). Airdrop only: no SER-LPP.
  seer_tokens               numeric          NOT NULL DEFAULT 0,
  -- Current SER LP-program balance across chains, same unit as seer_tokens. 'all' rows only.
  ser_lpp                   numeric          NOT NULL DEFAULT 0,
  -- What the board ranks and the UI shows as Total. GENERATED so the ranking column and the two
  -- parts of it cannot drift: there is no code path that can write one without the other.
  total_seer                numeric          GENERATED ALWAYS AS (seer_tokens + ser_lpp) STORED,
  -- Raw share sums; multiplied by SEER_PER_DAY * 0.25 in TypeScript.
  sum_share_of_holding      double precision NOT NULL DEFAULT 0,
  sum_share_of_holding_poh  double precision NOT NULL DEFAULT 0,
  -- In poh_humans now: counted if today were the PoH snapshot day.
  is_poh                    boolean          NOT NULL DEFAULT false,
  -- Snapshot days the address actually appears in. Lower than the window span when the wallet
  -- held nothing on some days — computeDailyAirdrop skips zero-holding addresses.
  day_count                 integer          NOT NULL DEFAULT 0,
  updated_at                timestamptz      NOT NULL DEFAULT now(),
  PRIMARY KEY (address, period)
);

-- Existing deployments: add the two columns in place. Both are no-ops on a fresh CREATE above.
-- total_seer must come second, it reads ser_lpp.
ALTER TABLE public.airdrop_leaderboard
  ADD COLUMN IF NOT EXISTS ser_lpp numeric NOT NULL DEFAULT 0;
ALTER TABLE public.airdrop_leaderboard
  ADD COLUMN IF NOT EXISTS total_seer numeric GENERATED ALWAYS AS (seer_tokens + ser_lpp) STORED;

-- Every numeric column is NOT NULL DEFAULT 0 on purpose: the read path orders on all four, and
-- NULLs would need explicit NULLS FIRST/LAST handling in the SQL, the endpoint and the page —
-- the mess pnl_leaderboard.roi already has.

-- ONE index, for the default view. The table is n_addresses × 4 rows, and the read path sorts a
-- single period partition to assign ranks, so extra indexes would not be used for that anyway
-- while costing write time on every nightly delete+insert. Add more only if EXPLAIN on real
-- data asks for them.
CREATE INDEX IF NOT EXISTS airdrop_leaderboard_period_total_idx
  ON public.airdrop_leaderboard (period, total_seer DESC);

-- Superseded: the default view ranks on total_seer now, so an index on seer_tokens serves nothing.
DROP INDEX IF EXISTS public.airdrop_leaderboard_period_seer_idx;

-- Rewritten wholesale every night, so dead tuples accumulate fast relative to live rows.
ALTER TABLE public.airdrop_leaderboard SET (autovacuum_vacuum_scale_factor = 0.05);

COMMENT ON TABLE public.airdrop_leaderboard IS
  'Materialized airdrop leaderboard (address x period) for /leaderboard/airdrop. seer_tokens = holdings + recomputed PoH share sums times the caller-supplied SEER-per-day pool factor, airdrop only; the PoH sum is recomputed every refresh from current poh_links / poh_humans (an estimate until the PoH snapshot day); ser_lpp = current SER LP-program balance, ''all'' rows only (it is a running balance and cannot be windowed); total_seer = the two added, and what the board ranks on. The share sums are RAW (multiply by SEER_PER_DAY * 0.25 in TypeScript). Windows are the last N distinct snapshot days, not calendar days. Cross-chain: airdrops.chain_ids is an array, so there is no chain dimension. Rebuilt daily by refresh-airdrop-leaderboard-background.';

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
-- Signature changed (p_pool_seer_per_day added), so the old one must go or PostgREST sees two
-- overloads and a stale caller keeps hitting the frozen-PoH version.
DROP FUNCTION IF EXISTS public.refresh_airdrop_leaderboard(text);

-- p_pool_seer_per_day = SEER_PER_DAY * POOL_SHARE_FACTOR, passed by the TypeScript caller so the
-- constants stay defined only there (see RAW SUMS above). It turns the two share sums into
-- seer_tokens, now that the stored seer_tokens_count bakes in the frozen, legacy PoH share.
CREATE OR REPLACE FUNCTION public.refresh_airdrop_leaderboard(p_period text, p_pool_seer_per_day double precision)
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
  IF NOT (p_pool_seer_per_day > 0) THEN
    RAISE EXCEPTION 'refresh_airdrop_leaderboard: p_pool_seer_per_day must be > 0 (got %)', p_pool_seer_per_day;
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
  ELSE
    -- 'all': an open lower bound. A concrete value rather than `v_since IS NULL OR ...`, which
    -- would defeat the timestamp index for the windowed periods. plpgsql plans these statements
    -- with the actual value, so the windows get a range scan and 'all' the full scan it needs.
    v_since := '-infinity';
  END IF;

  -- ---- PoH recompute (see poh_links.sql) -----------------------------------------------------
  -- _poh_day: per (day, verified identity), the holdings that resolve to it. Only verified
  -- identities survive, which keeps this small next to `airdrops` itself.
  DROP TABLE IF EXISTS _poh_day;
  CREATE TEMP TABLE _poh_day ON COMMIT DROP AS
  WITH default_link AS (
    -- A wallet's most recent link, whatever chain it was made on: the one other chains follow.
    SELECT DISTINCT ON (l.address) l.address, l.poh_address
    FROM public.poh_links l
    ORDER BY l.address, l.created_at DESC, l.chain_id
  ),
  parts AS (
    -- Days with a per-chain split (multi-chain holders, from deploy on): one part per chain, so a
    -- link made on that chain can override the default. The join drops orphans of a day whose
    -- airdrops insert failed.
    SELECT c."timestamp" AS ts, c.address, c.chain_id, c.holding AS h
    FROM public.airdrop_chain_holdings c
    JOIN public.airdrops a ON a."timestamp" = c."timestamp" AND a.address = c.address
    WHERE c."timestamp" >= v_since
    UNION ALL
    -- Everything else: the whole cross-chain holding, resolved through the default link.
    SELECT a."timestamp", a.address, NULL::integer, a.total_holding::double precision
    FROM public.airdrops a
    WHERE a."timestamp" >= v_since
      AND NOT EXISTS (
        SELECT 1 FROM public.airdrop_chain_holdings c
        WHERE c."timestamp" = a."timestamp" AND c.address = a.address
      )
  ),
  resolved AS (
    SELECT p.ts,
           -- A verified wallet is its own identity: it cannot link away.
           CASE WHEN self.address IS NOT NULL THEN p.address
                ELSE coalesce(cl.poh_address, dl.poh_address, p.address)
           END AS identity,
           p.h
    FROM parts p
    LEFT JOIN public.poh_humans self ON self.address = p.address
    LEFT JOIN public.poh_links cl ON cl.address = p.address AND cl.chain_id = p.chain_id
    LEFT JOIN default_link dl ON dl.address = p.address
  )
  -- Summed BEFORE the sqrt: two wallets linked to one profile earn sqrt(a + b), not
  -- sqrt(a) + sqrt(b). That is the pool's sybil resistance, and the same invariant the
  -- distribution.ts fold docblock describes. Dust threshold = DUST_HOLDING, on the identity total.
  SELECT r.ts, r.identity, sum(r.h) AS h
  FROM resolved r
  JOIN public.poh_humans hu ON hu.address = r.identity
  GROUP BY r.ts, r.identity
  HAVING sum(r.h) > 1e-9;

  -- Per-day denominator over exactly the identities in the numerators, so each day sums to 1.
  DROP TABLE IF EXISTS _poh_tot;
  CREATE TEMP TABLE _poh_tot ON COMMIT DROP AS
  SELECT d.ts, sum(sqrt(d.h)) AS poh_total
  FROM _poh_day d
  GROUP BY d.ts;

  IF p_period = 'all' THEN
    -- Only 'all' covers every day; get_poh_potential reads these.
    -- WHERE true: Supabase runs pg-safeupdate for API roles, which rejects an unqualified DELETE.
    DELETE FROM public.airdrop_poh_day_totals WHERE true;
    INSERT INTO public.airdrop_poh_day_totals ("timestamp", poh_total)
    SELECT t.ts, t.poh_total FROM _poh_tot t;
  END IF;

  -- ---- Board rows -----------------------------------------------------------------------------
  DELETE FROM public.airdrop_leaderboard WHERE period = p_period;

  INSERT INTO public.airdrop_leaderboard (
    address, period, seer_tokens, ser_lpp, sum_share_of_holding, sum_share_of_holding_poh,
    is_poh, day_count, updated_at
  )
  WITH air AS (
    SELECT a.address,
           coalesce(sum(a.share_of_holding::double precision), 0) AS share_holding,
           count(*)::integer                                       AS day_count
    FROM public.airdrops a
    WHERE a."timestamp" >= v_since
    GROUP BY a.address
  ),
  poh AS (
    SELECT d.identity AS address,
           sum(sqrt(d.h) / t.poh_total) AS share_poh
    FROM _poh_day d
    JOIN _poh_tot t ON t.ts = d.ts
    GROUP BY d.identity
  ),
  lpp AS (
    -- 'all' only: a running balance cannot be attributed to a window (see SER-LPP above). One row
    -- per (address, chain_id) upstream, so this sums Gnosis + Mainnet. lower() because the board
    -- joins on `airdrops.address`, which is always lowercase.
    SELECT lower(s.address) AS address,
           coalesce(sum(s.balance::numeric), 0) AS ser_lpp
    FROM public.ser_lpp_balances s
    WHERE p_period = 'all'
      -- The treasury and two custody contracts hold the LP token without providing liquidity, so
      -- their balances are not an allocation and would otherwise take the top of the board.
      --
      -- Excluded HERE and nowhere else, on purpose. `ser_lpp_balances` is a faithful record of who
      -- holds the token on-chain and stays that way — ser-lpp-calculation-background writes every
      -- holder it finds, and the per-wallet portfolio path reads it unfiltered. This is the board's
      -- own view of that data, so this is where "not a participant" belongs.
      --
      -- It also cannot move any further out. The read RPC assigns rank with row_number() over the
      -- whole period partition and pages on it, so an endpoint- or React-side filter would punch
      -- holes in the ranks, short the page and leave total_count counting rows nobody can see.
      AND lower(s.address) NOT IN (
        '0xcad3f887275c3b8409140ea61ebb0b9751eda287',  -- seer.eth
        '0x88ad09518695c6c3712ac10a214be5109a655671',
        '0x607bbfd4cebd869aad04331f8a2ad0c3c396674b'
      )
    GROUP BY lower(s.address)
    HAVING coalesce(sum(s.balance::numeric), 0) > 0
  ),
  -- FULL JOINs: a PoH profile that holds nothing itself but receives linked holdings is a row, and
  -- so is a wallet that only ever provided liquidity. Both show day_count 0.
  merged AS (
    SELECT coalesce(air.address, poh.address) AS address,
           coalesce(air.share_holding, 0)     AS share_holding,
           coalesce(poh.share_poh, 0)         AS share_poh,
           coalesce(air.day_count, 0)         AS day_count
    FROM air
    FULL JOIN poh ON poh.address = air.address
  )
  SELECT coalesce(m.address, lpp.address),
         p_period,
         (p_pool_seer_per_day * (coalesce(m.share_holding, 0) + coalesce(m.share_poh, 0)))::numeric,
         coalesce(lpp.ser_lpp, 0),
         coalesce(m.share_holding, 0),
         coalesce(m.share_poh, 0),
         -- Verified NOW, i.e. counted if today were the PoH snapshot day.
         EXISTS (SELECT 1 FROM public.poh_humans h WHERE h.address = coalesce(m.address, lpp.address)),
         coalesce(m.day_count, 0),
         now()
  FROM merged m
  FULL JOIN lpp ON lpp.address = m.address;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RAISE NOTICE 'refresh_airdrop_leaderboard(%): % rows, since=%', p_period, v_rows, v_since;
  RETURN v_rows;
END;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on new functions. Without this revoke, anon could
-- POST to the RPC and burn a full-table aggregate per request — the table grants stop the write
-- but not the CPU.
REVOKE EXECUTE ON FUNCTION public.refresh_airdrop_leaderboard(text, double precision) FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_airdrop_leaderboard(text, double precision) TO service_role;


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
--
-- 'seer' sorts on total_seer (airdrop + SER-LPP), which is what the UI labels Total. Outside the
-- 'all' period ser_lpp is 0, so there total_seer IS seer_tokens and the ordering is unchanged.
--
-- 'lpp' sorts on ser_lpp itself. It is only meaningful on 'all' — everywhere else the column is
-- uniformly 0 and the board falls back to the address tiebreak. The UI hides the column and drops
-- the sort key on those periods, so this is only reachable by hand-crafting a request; it returns
-- a well-defined (if useless) ordering rather than an error, the same as sorting a board where
-- every wallet happens to tie.
--
-- DROP first: CREATE OR REPLACE cannot change an existing function's return type, and this
-- signature gained output columns.
DROP FUNCTION IF EXISTS public.get_airdrop_leaderboard_page(text, text, text, text, integer, integer);

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
  ser_lpp                  numeric,
  total_seer               numeric,
  sum_share_of_holding     double precision,
  sum_share_of_holding_poh double precision,
  is_poh                   boolean,
  day_count                integer,
  updated_at               timestamptz,
  -- Rows matching p_search (equals board_count when p_search is empty). Drives pagination.
  total_count              bigint,
  -- Rows in the period, ignoring p_search. Used as the denominator for "rank X of Y".
  board_count              bigint,
  -- sum(ser_lpp) over the period, ignoring p_search: the denominator for the SER-LPP percentage.
  -- Computed here rather than in the endpoint because this is where the period partition already
  -- is, and because a separate SELECT sum(ser_lpp) would read the table on a different snapshot
  -- than the page did. 0 on every period but 'all', which is the only one that stores a balance.
  board_ser_lpp            numeric
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
             WHEN 'seer'     THEN 'total_seer'
             WHEN 'holdings' THEN 'sum_share_of_holding'
             WHEN 'poh'      THEN 'sum_share_of_holding_poh'
             WHEN 'lpp'      THEN 'ser_lpp'
             WHEN 'days'     THEN 'day_count'
             ELSE NULL
           END;
  IF v_col IS NULL THEN
    RAISE EXCEPTION 'get_airdrop_leaderboard_page: sort must be one of seer, holdings, poh, lpp, days (got %)', p_sort;
  END IF;

  v_dir := CASE lower(p_dir) WHEN 'asc' THEN 'ASC' WHEN 'desc' THEN 'DESC' ELSE NULL END;
  IF v_dir IS NULL THEN
    RAISE EXCEPTION 'get_airdrop_leaderboard_page: dir must be asc or desc (got %)', p_dir;
  END IF;

  RETURN QUERY EXECUTE format($f$
    WITH ranked AS (
      SELECT l.address, l.seer_tokens, l.ser_lpp, l.total_seer,
             l.sum_share_of_holding, l.sum_share_of_holding_poh,
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
    SELECT f.rank, f.address, f.seer_tokens, f.ser_lpp, f.total_seer,
           f.sum_share_of_holding, f.sum_share_of_holding_poh,
           f.is_poh, f.day_count, f.updated_at,
           -- Window functions run before LIMIT, so this is the full filtered count.
           count(*) OVER () AS total_count,
           (SELECT count(*) FROM ranked) AS board_count,
           -- coalesce: sum() over an empty period is NULL, and the endpoint would have to guard
           -- what is simply "no liquidity on the board".
           (SELECT coalesce(sum(r2.ser_lpp), 0) FROM ranked r2) AS board_ser_lpp
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

-- No refresh here any more. The PoH column needs poh_humans, which only
-- refresh-airdrop-leaderboard-background fills (from the PoH subgraphs); refreshing from SQL
-- against an empty poh_humans would publish a board with no PoH at all. After applying, trigger
-- that function once (see the "Apply for PoH links" section of README.md).
