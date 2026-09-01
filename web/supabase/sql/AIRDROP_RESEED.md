# Airdrop reseed runbook

The calculation fixes in `fix/airdrop-calculation` change every historical `airdrops` row. This is
the sequence for replacing the table's contents with recomputed values.

Read it end to end before starting. The ordering constraint in step 1 is the one that bites: the
daily scheduled function must not run while the table is being replaced, and after the replacement
it must be running the FIXED code — otherwise it appends rows computed the old way on top of clean
data, and you cannot tell which rows are which.

## What changed, and why a reseed is needed

| Fix | Effect on stored values |
| --- | --- |
| Pool-hour price pagination (`getPoolHourDatas.ts`) | Up to ~45% of Optimism price candles were being discarded, so prices were stale or zero. Affects every Optimism snapshot since 2026-07-01. |
| LP positions revalued at snapshot price (`getLiquidityBalances.ts`, `utils.ts`) | `indirect_holding` was frozen at mint-time composition. 7-22% of all holdings, back to genesis. |
| Cross-chain sqrt denominator (`distribution.ts`) | `share_of_holding_poh` was under-distributed by 0.014-0.064%/day. |
| Recursive conditional pricing (`getPrices.ts`) | Outcome tokens more than two levels deep priced at 0. |
| Dust threshold (`distribution.ts`) | Sub-0.0005 holders were dropped from payouts but still counted in denominators. |
| Mint/burn pagination (`getLiquidityBalances.ts`) | Events were cursored on `timestamp`, which is not unique, so a page boundary inside a block dropped the rest of that second — and a full page sharing one timestamp abandoned the batch entirely. A lost burn leaves a closed position credited forever; a lost mint can drive net liquidity negative and delete a real position. Now cursored on `id`. Affects `indirect_holding`, back to genesis. |
| AMM pools excluded from direct holdings (`computeDailyAirdrop.ts`) | Pool contracts hold the outcome tokens backing every LP position and appear in `tokens_transfers` like any holder, so those reserves were counted twice: once as the pool's `direct_holding`, once as its LPs' `indirect_holding`. That inflated `total`, diluted every real holder's `share_of_holding`, and allocated a slice of the emission to contracts that cannot claim it. Affects every row, back to genesis. |

Because `indirect_holding` changes back to genesis, this is a **full** reseed, not the targeted
Optimism-only window.

## Assumptions deliberately left in place

Documented in code, not bugs to be surprised by later:

- **LP credit follows `tx.origin`** at mint and does not follow the position NFT if transferred.
- **Prices have no staleness bound** — the newest candle at or before the snapshot is used however
  old it is.
- **sDAI and sUSDS are summed 1:1** across chains; holdings are in collateral terms, not USD.

## Steps

### 0. Pre-flight: confirm the pool exclusion is not already applied in SQL

`get_direct_holdings_at` still lives only in the live project (see `README.md`). The pool exclusion
is implemented in TypeScript, in `collectExcludedHolders`, on the assumption that the RPC returns
every holder with a positive balance — which is what its TS predecessor `getHoldersAtTimestamp` did,
excluding only the zero address. Dump it and confirm:

```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'get_direct_holdings_at';
```

If it already filters pool addresses, drop the TS exclusion rather than applying it twice — the
result would be the same, but two half-documented filters in different languages is how this comes
back. Either way, commit the dump to `get_direct_holdings_at.sql` while you have it and take it off
the README's "Not yet captured" list.

### 1. Stop the daily job

Set `DISABLE_SCHEDULED_FUNCTIONS=true` in the Netlify environment (read by
`scheduled-airdrop-calculation.ts:4`). Confirm the next scheduled run is skipped before continuing.

### 2. Merge the fixes to main and let it deploy

`fix/airdrop-calculation` must be live before the new data lands, so that whatever runs next uses the
fixed code. Verify the deploy finished.

### 3. Back up

```sql
create table airdrops_backup_20260901 as select * from public.airdrops;
create table airdrop_state_backup_20260901 as select * from public.airdrop_state;
select count(*) from airdrops_backup_20260901;
```

This is also what you diff the new data against.

### 4. Generate the CSV locally

From `web/`, with `SUPABASE_PROJECT_URL` / `SUPABASE_API_KEY` (service_role) in `.env`:

```bash
node --max-old-space-size=16384 node_modules/tsx/dist/cli.mjs scripts/backfill-airdrop.ts --out ./tmp/airdrop-backfill.csv
```

It reuses the snapshot timestamps already in `airdrops` by default, so the output is directly
comparable to the backup. Do **not** pass `--fresh` — that generates new random-in-day timestamps
and makes old-vs-new diffing meaningless.

**One pass, one fetch.** Each chain's markets, mint/burn events and pool-hour prices are loaded once
and folded into every snapshot; only `get_direct_holdings_at` is unavoidably per (chain, day). That
is where the time goes: ~2,760 round trips (4 chains x ~690 days) at ~10-12s each.

Almost none of that is compute. The query itself runs in single-digit milliseconds; the ~10-12s is
connection overhead through the API/pooler. Run back to back that is **8-9 hours of waiting on
connection setup**, which is why `--concurrency` (default 8) overlaps them and brings the same run
down to **roughly an hour**. Lower it if the run is tight on heap — each in-flight day holds a
chain's holdings array — or if the pooler starts refusing connections. It affects this script only:
the scheduled function passes no `concurrency` and stays sequential.

Prefer the large heap over `--batch-days`. Batching splits the run into several passes and
**re-fetches every chain's full history on each one**, including the metered Uniswap gateway crawl
for mint/burn. Use it only if the run actually exhausts memory, and raise the heap first.

**If price coverage does not reach genesis**, do NOT reseed the uncovered days. A day with no
candles prices every holding at 0, which falls below the dust threshold, so the day produces no rows
at all and disappears — and because shares are normalised within a day, each lost snapshot removes
its full 3.33M SEER of allocation (1.67M holdings + 1.67M PoH) from whoever held then. Early days had
few holders, so the loss is concentrated on them.

Instead, start the reseed just after the earliest candle and leave older days on their original
values:

```bash
npx tsx scripts/backfill-airdrop.ts --from <unix of earliest usable snapshot> --out ./tmp/airdrop-backfill.csv
```

Then **scope the swap in step 7 to the same window** — the unconditional delete would otherwise wipe
the days you deliberately did not recompute. The script prints a warning for any day that yields
zero rows; treat those as a coverage problem, not an empty day.

To validate the fixes on a small window first — strongly recommended before committing to the full
run — pass `--from` for a recent cutoff and compare against the live rows for those days:

```bash
npx tsx scripts/backfill-airdrop.ts --from <unix 30 days ago> --out ./tmp/sample.csv
```

### 5. Import into a staging table

Do not drop `airdrops` yet. Load into a clone, validate, then swap.

```sql
create table airdrops_staging (like public.airdrops including all);
\copy airdrops_staging(address,chain_ids,direct_holding,indirect_holding,is_poh,seer_tokens_count,share_of_holding,share_of_holding_poh,timestamp,total_holding) FROM 'tmp/airdrop-backfill.csv' WITH (FORMAT csv, HEADER true)
```

### 6. Validate before swapping

```sql
-- Shares must now sum to 1 per snapshot day. This is the check that would have caught the sqrt bug:
-- before the fix, sum_poh was 0.9994-0.9999.
select "timestamp",
       sum(share_of_holding)     as sum_holding,
       sum(share_of_holding_poh) as sum_poh
from airdrops_staging
group by 1 order by 1 desc limit 10;

-- No AMM pool may appear as a holder any more. This must return zero rows.
select distinct s.address
from airdrops_staging s
where s.address in (select distinct pool_id from dex_pool_hour_prices);

-- What the exclusion actually removed. `total_holding` should fall by roughly the pool reserves,
-- and the addresses that vanished should all be pools — spot-check a few on the block explorer
-- before accepting the number.
select b."timestamp",
       count(*) filter (where s.address is null) as addresses_dropped,
       sum(b.total_holding) filter (where s.address is null) as holding_dropped
from airdrops_backup_20260901 b
left join airdrops_staging s using (address, "timestamp")
group by 1 order by 1 desc limit 10;

-- Same snapshot days as the backup, and no rows lost to a truncated run.
select (select count(distinct "timestamp") from airdrops_staging)          as new_days,
       (select count(distinct "timestamp") from airdrops_backup_20260901)  as old_days,
       (select count(*) from airdrops_staging)                             as new_rows,
       (select count(*) from airdrops_backup_20260901)                     as old_rows;

-- Where the change actually landed, per day.
select s."timestamp",
       sum(s.indirect_holding) as new_indirect,
       sum(b.indirect_holding) as old_indirect,
       sum(s.direct_holding)   as new_direct,
       sum(b.direct_holding)   as old_direct
from airdrops_staging s
join airdrops_backup_20260901 b using (address, "timestamp")
group by 1 order by 1 desc limit 10;
```

`sum_holding` and `sum_poh` both landing on 1.0 is the pass condition. If `sum_poh` is still below 1,
stop — the fold fix did not take effect.

### 7. Swap

Full reseed (the CSV covers every snapshot day):

```sql
begin;
delete from public.airdrops;
insert into public.airdrops select * from airdrops_staging;
commit;
```

**Partial reseed** (you used `--from`, so the CSV starts later than the table does) — scope the
delete to the window you actually recomputed, or you will destroy the older days you were trying to
preserve:

```sql
begin;
delete from public.airdrops
where "timestamp" >= (select min("timestamp") from airdrops_staging);
insert into public.airdrops select * from airdrops_staging;
commit;
```

Sanity-check the boundary before committing:

```sql
select (select min("timestamp") from airdrops_staging)                              as new_window_starts,
       (select max("timestamp") from public.airdrops
         where "timestamp" < (select min("timestamp") from airdrops_staging))        as preserved_up_to;
```

`delete` + `insert` rather than a table rename: it keeps indexes, grants and constraints attached to
the real table. It writes a lot of WAL, which is the price.

### 8. Advance the cursor and rebuild the leaderboard

```sql
insert into airdrop_state(id, last_timestamp) values ('latest_day', <lastTs printed by the script>)
  on conflict (id) do update set last_timestamp = excluded.last_timestamp;
```

Then, if `airdrop_leaderboard.sql` has been applied (it ships with the `airdrop-leaderboard` branch):

```sql
select public.refresh_airdrop_leaderboard('1d');
select public.refresh_airdrop_leaderboard('1w');
select public.refresh_airdrop_leaderboard('1m');
select public.refresh_airdrop_leaderboard('all');
```

### 9. Re-enable the daily job

Remove `DISABLE_SCHEDULED_FUNCTIONS`. The next run reads `airdrop_state.last_timestamp` and appends
from there using the fixed code.

### 10. Clean up once satisfied

```sql
drop table airdrops_staging;
-- keep the backups until at least one clean daily run has landed
-- drop table airdrops_backup_20260901;
-- drop table airdrop_state_backup_20260901;
```

## Rollback

Before step 9, restoring is:

```sql
begin;
delete from public.airdrops;
insert into public.airdrops select * from airdrops_backup_20260901;
update public.airdrop_state s set last_timestamp = b.last_timestamp
  from airdrop_state_backup_20260901 b where s.id = b.id;
commit;
```

After the daily job has appended new rows this is no longer a clean restore — those rows are not in
the backup. Delete anything newer than the backup's max timestamp first.
