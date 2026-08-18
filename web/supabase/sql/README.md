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
| `users_username.sql` | Adds the unique wallet-linked username column and validation constraints. |
| `users_username_not_null.sql` | Makes usernames required after existing users have been backfilled. |
| `pnl_leaderboard.sql` | Table + indexes + leaderboard RPCs (`pnl_leaderboard_single_chain`, `pnl_leaderboard_all_chains`, `pnl_leaderboard_all_chains_rank`) + refresh cursor table. Refresh writes require `SUPABASE_API_KEY` = **service_role** (`anon` is SELECT-only). |
| `tokens_transfers_indexes.sql` | `(chain_id, from, timestamp)` and `(chain_id, to, timestamp)` for wallet-scoped `tokens_transfers` scans (airdrop / transfers queries). |

## Apply for PnL leaderboard / portfolio fixes

Apply in this order:

1. `tokens_transfers_indexes.sql` (each `create index concurrently` as its own statement, if not already applied)
2. Put the app into maintenance mode so sign-ins and user creation stop.
3. Run `users_username.sql` to add the nullable username column.
4. From the repository root, backfill existing users with the production Supabase service-role key:

   ```bash
   SUPABASE_PROJECT_URL="https://PROJECT.supabase.co" \
   SUPABASE_API_KEY="SERVICE_ROLE_KEY" \
   yarn --cwd web tsx scripts/backfill-usernames.ts
   ```

5. Verify `select count(*) from public.users where username is null;` returns `0`.
6. Run `users_username_not_null.sql`.
7. Run `pnl_leaderboard.sql` (if not already applied; re-run to pick up `volume` / `volume_usd` / `roi`, the refresh cursor table, all-chains RPCs, and the username-aware leaderboard RPCs).
8. Deploy the new build, restore the app, and smoke-test sign-in, profiles, comments, and leaderboard search.

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
