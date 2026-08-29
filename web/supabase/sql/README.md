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
| `airdrops_indexes.sql` | Covering index on `airdrops (address, timestamp)`. Fixes the statement timeout on the portfolio Airdrop tab. |
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

## Not yet captured

Several objects are called from application code but their definitions still live only in the
live Supabase project. Worth dumping and committing here:

- `get_direct_holdings_at` — referenced by `netlify/functions/utils/airdropCalculation/computeDailyAirdrop.ts`
- `insert_airdrop_safely`
- `dex_pool_hour_prices_nearest_before_for_pairs`
- `markets_by_question_ids`

Dump one with:

```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'get_direct_holdings_at';
```
