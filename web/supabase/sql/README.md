# Supabase SQL

Definitions for database objects the application depends on: RPCs called via
`supabase.rpc(...)`, plus indexes the query patterns rely on.

## These files are not applied automatically

There is no migration runner, no `supabase db push`, and no CI step. Applying anything here is
a **manual step**: paste the file into the Supabase SQL editor (or run it with `psql`).

This directory is the reviewable record of what production is supposed to contain — not the
mechanism that puts it there. If you change a definition here, apply it by hand as well.

`create index concurrently` cannot run inside a transaction block, and the SQL editor wraps
multi-statement scripts in one, so run those statements individually.

## Contents

| File | What it does |
| --- | --- |
| `airdrops_indexes.sql` | Indexes on `airdrops`: covering `(address, timestamp)` for the per-user read path, narrow `(timestamp)` for the leaderboard refresh. Fixes the statement timeout on the portfolio Airdrop tab. |
| `airdrop_leaderboard.sql` | Table + index + `refresh_airdrop_leaderboard(period)` (writer, one period per call) and `get_airdrop_leaderboard_page(...)` (reader, assigns global ranks). Materializes SEER airdrop totals per wallet per period (`1d/1w/1m/all`) for the public `/leaderboard/airdrop` board; rebuilt nightly by `refresh-airdrop-leaderboard-background`. Refresh writes require `SUPABASE_API_KEY` = **service_role**. |
| `dex_pool_hour_prices.sql` | Table + indexes + `dex_pool_hour_prices_nearest_before_for_pairs`. Hour candles written by `dex-pool-prices-background`; read by portfolio history and the airdrop calculation. Captured from the live project — the objects predate the file. Ingest writes require `SUPABASE_API_KEY` = **service_role**. |
| `AIRDROP_RESEED.md` | Runbook for replacing the contents of `airdrops` after the calculation fixes in `fix/airdrop-calculation`. Not SQL to apply — a sequence to follow, including the ordering constraint around the daily scheduled function. |
| `get_airdrop_summary_by_user.sql` | Aggregates a user's whole airdrop history into one row for `get-airdrop-data-by-user`. |
| `pnl_market_leaderboard.sql` | Per-market P/L: `pnl_market_leaderboard` (source of truth), `pnl_market_daily_delta` (sparse daily cashflow, so the window roll adds one day instead of replaying), and the refresh cursor. `pnl_leaderboard` becomes the derived read model. |
| `pnl_leaderboard.sql` | Table + indexes + refresh cursor table. Refresh writes require `SUPABASE_API_KEY` = **service_role** (`anon` is SELECT-only). Public reads go through the Netlify `get-pnl-leaderboard` function (rollup in TS). |
| `tokens_transfers_indexes.sql` | `(chain_id, from, timestamp)` and `(chain_id, to, timestamp)` for wallet-scoped `tokens_transfers` scans (airdrop / transfers queries). |

Analytics matview RPC `refresh_market_outcome_tokens` lives in
[`dashboard/supabase/sql/analytics_rpcs.sql`](../../dashboard/supabase/sql/analytics_rpcs.sql)
(same DB). `scheduled-markets-import` calls it when new market ids are upserted. Apply that
function in the SQL editor before relying on the auto-refresh.

## Apply for PnL leaderboard / portfolio fixes

After pulling these changes, run in the Supabase SQL editor (in order):

1. `tokens_transfers_indexes.sql` (each `create index concurrently` as its own statement, if not already applied)
2. `pnl_leaderboard.sql` (if not already applied; re-run to pick up `volume` / `volume_usd` / `capital_deployed` / `roi` and the refresh cursor table). If production still has the unused `pnl_leaderboard_all_chains` / `pnl_leaderboard_all_chains_rank` functions, drop them manually:

```sql
drop function if exists public.pnl_leaderboard_all_chains(text, text, text, integer, integer);
drop function if exists public.pnl_leaderboard_all_chains_rank(text, text, text);
```

3. `pnl_market_leaderboard.sql` — **required before any per-market refresh runs.** It creates all
   three per-market objects (`pnl_market_leaderboard`, `pnl_market_daily_delta`,
   `pnl_market_refresh_cursor`) and turns `pnl_leaderboard` into a derived read model, so
   `get-market-pnl-leaderboard`, `refresh-pnl-market-mtm-background` and the per-market half of the
   wallet pass all query tables that do not exist until it is applied. Safe to re-run; if you
   applied an earlier copy, the re-run picks up the `market_id` column the MTM sweep's scan cursor
   needs (`alter table ... add column if not exists`).

App code no longer calls the old transfer-replay RPCs
(`list_distinct_user_transfer_tokens`, `list_user_token_transfers_in_window`,
`earliest_user_transfer_timestamp`), nor the latest-hour price RPCs
(`dex_pool_hour_prices_latest_for_tokens`, `dex_pool_hour_prices_latest_for_pairs`) — current prices
are read from the pools on-chain, and hour candles are only used for history.
Those live functions can be left in place or dropped manually in production later.

## Apply for the airdrop leaderboard

New in this change. Run in the Supabase SQL editor (in order):

1. Confirm the column type the refresh compares against, and how big the source is:

```sql
select data_type from information_schema.columns
where table_name = 'airdrops' and column_name = 'timestamp';

select count(*) as rows, count(distinct address) as addrs,
       count(distinct "timestamp") as snapshot_days
from public.airdrops;
```

   `refresh_airdrop_leaderboard` declares its cutoff variable with
   `public.airdrops."timestamp"%TYPE`, so it is correct for either `timestamp` or `timestamptz`
   with nothing to adjust. The check is to know what you are applying to.

2. The new `create index concurrently ... airdrops_timestamp_idx` at the end of
   `airdrops_indexes.sql` — **as its own statement** (the editor wraps multi-statement scripts in
   a transaction, and `concurrently` fails there with 25001), then the `analyze`.

3. `airdrop_leaderboard.sql`. It ends by building all four periods. The `'all'` pass is a
   full-table aggregate and is the one that might need a longer `statement_timeout`; the SQL
   editor has a longer budget than the API gateway, so **do the first `'all'` build here** even if
   the nightly job later struggles with it. Note that
   `alter function ... set statement_timeout` does *not* reliably extend the timer — raise it at
   the role level if needed:

```sql
select rolname, rolconfig from pg_roles
where rolname in ('anon','authenticated','service_role','authenticator','postgres');
```

4. Check the windows are what you expect. `max_days` must be exactly 1 / 7 / 30 for `1d` / `1w` /
   `1m`; anything else means the cutoff logic is wrong. `all` must have at least as many rows as
   any other period:

```sql
select period, count(*) as rows, max(day_count) as max_days, max(updated_at)
from public.airdrop_leaderboard group by period order by period;
```

   Then cross-check one wallet: its `period='all'` `seer_tokens` must equal `totalAllocation` from
   `get-airdrop-data-by-user` for the same address.

5. If PostgREST answers `PGRST202`, the `notify pgrst, 'reload schema'` did not land — re-run it.

## Apply for SER-LPP in the board total

Adding the SER-LPP column and ranking on the combined total needs `airdrop_leaderboard.sql`
re-applied — the whole file, one paste, in the SQL editor. It is idempotent: the table is created
`IF NOT EXISTS` and the two new columns go on with `alter table ... add column if not exists`.

Two things in it are not just `create or replace`:

- `get_airdrop_leaderboard_page` gained two output columns, and Postgres will not let
  `CREATE OR REPLACE` change a function's return type, so the file drops it first. The drop names
  the exact signature `(text, text, text, text, integer, integer)`. If production somehow holds a
  different overload the drop is a no-op and the create then fails with *cannot change return type
  of existing function* — list what is actually there before blaming the script:

```sql
select oid::regprocedure from pg_proc where proname = 'get_airdrop_leaderboard_page';
```

- `airdrop_leaderboard_period_seer_idx` is dropped in favour of
  `airdrop_leaderboard_period_total_idx`, since the default view now orders on `total_seer`.

The file ends by rebuilding all four periods, and only the `'all'` pass reads `ser_lpp_balances`,
so **the rebuild is what puts SER-LPP on the board** — until it runs, every row reads 0. If the
editor times out on `'all'`, the other three are already committed; finish with:

```sql
select public.refresh_airdrop_leaderboard('all');
```

Then check the new columns, and that `'all'` is the only period carrying a balance:

```sql
select period,
       count(*)                            as rows,
       count(*) filter (where ser_lpp > 0) as with_lpp,
       sum(ser_lpp)                        as lpp_total,
       max(total_seer - seer_tokens)       as max_lpp
from public.airdrop_leaderboard group by period order by period;
```

`with_lpp` must be 0 on `1d` / `1w` / `1m`. On `'all'` it should match

```sql
select count(distinct lower(address)) from public.ser_lpp_balances where balance > 0;
```

minus any holder that is somehow absent from the board — there should be none, the refresh full
joins. Expect the `'all'` row count to grow by however many LP-only wallets have no `airdrops`
history; they land with `day_count = 0`.

## Not yet captured

Several objects are called from application code but their definitions still live only in the
live Supabase project. Worth dumping and committing here:

- `get_direct_holdings_at` — referenced by `netlify/functions/utils/airdropCalculation/computeDailyAirdrop.ts`
- `insert_airdrop_safely`
- `markets_by_question_ids`

`dex_pool_hour_prices_nearest_before_for_pairs` is now captured in `dex_pool_hour_prices.sql`,
dumped from the live project. Always dump rather than re-derive: an attempt to reconstruct it
from the calling code produced `(integer, integer, integer, ...)` against the live
`(integer, bigint, bigint, ...)`, so `CREATE OR REPLACE` silently added a second overload and
PostgREST could no longer resolve the call. Signature mismatches do not replace — they overload.

Dump one with:

```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'get_direct_holdings_at';
```
