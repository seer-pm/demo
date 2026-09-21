# Resuming the airdrop reseed

Companion to `AIRDROP_RESEED.md`. That document is the full procedure; this one records where the
run of 2026-09-01 stopped, why, and the exact commands to finish it. Read `AIRDROP_RESEED.md` for
the steps this one does not repeat.

## Status: step 4 (CSV generation) is 525 of 690 days complete

| | |
| --- | --- |
| Days written | **525 / 690** (through 2026-03-19) |
| Rows | 112,930 |
| Remaining | 165 days, the heaviest in the dataset |
| Blocked by | a 30s `statement_timeout` that the heavy queries now exceed |

Nothing has been written to the database. No backup, staging, swap or cursor step has been run.

## 0. Do not delete `web/tmp/`

```
web/tmp/airdrop-backfill.csv                 19.3 MB, 112,930 rows, header + 525 days
web/tmp/airdrop-backfill.csv.progress.json   completedThrough = 1773933091
web/tmp/backfill.log                          full run log, 177 timeouts recorded
```

`web/tmp/` is in `web/.gitignore`, so these files are **untracked and exist only on this machine**.
A `git clean -xdf` destroys them and costs ~2 hours of recomputation. `--resume` reads the progress
file; if it is gone, the run starts from genesis.

## 1. The blocker, and how to clear it

The heaviest `get_direct_holdings_at` calls now take 29-32s against a 30s ceiling. Measured on a
healthy database: statements at 28.8s and 29.0s returned; every statement reaching 31.9s was
cancelled with `57014`.

Setting `statement_timeout` on `service_role` alone does **not** work. PostgreSQL applies
`ALTER ROLE ... SET` at *login*, and PostgREST logs in as `authenticator` then issues `SET ROLE
service_role` per request — `SET ROLE` does not re-apply role-level GUC defaults. Existing pooled
connections also keep whatever value they logged in with, indefinitely.

```sql
alter role authenticator set statement_timeout = '120s';   -- the login role; this is the one that applies
alter role service_role  set statement_timeout = '120s';   -- harmless to keep

-- Force PostgREST to reconnect. Without this, pooled connections keep the old 30s value.
select pg_terminate_backend(pid) from pg_stat_activity
where usename = 'authenticator' and pid <> pg_backend_pid();
```

Restarting the API from the Supabase dashboard (Settings -> Restart project) does the same thing.

Revert when the reseed is finished:

```sql
alter role authenticator reset statement_timeout;
alter role service_role  reset statement_timeout;
```

### Verify before launching anything

A query finishing quickly proves nothing — it is under both ceilings. The only valid test is a
statement that **runs past 30s and still returns rows**. Save as `web/tmp/verify-timeout.ts`:

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);
const TS = [1788200616, 1788119016, 1788012010, 1787941416, 1787850000, 1787760000];
(async () => {
  const res = await Promise.all(TS.map(async (ts) => {
    const s = Date.now();
    const { data, error } = await supabase.rpc("get_direct_holdings_at", { p_chain_id: 10, p_timestamp: ts });
    return { ms: Date.now() - s, err: error?.code, rows: (data as any[])?.length ?? 0 };
  }));
  for (const r of res) console.log(`  ${String(r.ms).padStart(6)}ms  ${r.err ? "ERROR " + r.err : r.rows + " rows"}`);
  const past30 = res.filter((r) => r.ms > 31000 && !r.err).length;
  console.log(past30 > 0 ? "PASS: raised timeout is active" : "FAIL: still cancelling at ~30s");
})();
```

```bash
cd web && set -a && . ./.env && set +a && npx tsx tmp/verify-timeout.ts
```

Do not start a backfill until this prints PASS. Six consecutive attempts on 2026-09-01 failed
against the 30s ceiling and gained zero days, while degrading the database further each time.

## 2. Running the script (three gotchas)

`AIRDROP_RESEED.md` step 4's command does not run as written in this checkout:

1. **The script never loads `.env`.** There is no `dotenv` import and it is not a dependency, so it
   dies at import time with `supabaseUrl is required`. Source the env into the shell first.
2. **`node_modules/tsx` does not exist.** tsx is not a project dependency; `npx tsx` fetches it.
3. **Run from `web/`**, so `tsconfig` paths and `.env` resolve.

```bash
cd web
set -a; . ./.env; set +a
NODE_OPTIONS="--max-old-space-size=16384" npx tsx scripts/backfill-airdrop.ts <args>
```

## 3. The resume command

```bash
cd web
set -a; . ./.env; set +a
NODE_OPTIONS="--max-old-space-size=16384" npx tsx scripts/backfill-airdrop.ts \
  --resume --batch-days 50 --concurrency 4 --out ./tmp/airdrop-backfill.csv
```

- `--resume` is **required**. Without it the script refuses to start rather than overwrite the CSV.
  It appends, re-reads the snapshot timestamps from `airdrops`, and computes only
  `timestamp > completedThrough` — so any day the nightly job adds is picked up automatically and
  none of the 525 finished days are recomputed.
- **Never pass `--fresh`.** It generates new random-in-day timestamps and makes the result
  undiffable against `airdrops_backup_20260901`.
- `--batch-days` is what makes progress durable. With the default single pass, *nothing* is written
  until the entire run finishes and a failure discards everything (see the script's own note at
  `backfill-airdrop.ts:202`). Each extra pass re-fetches every chain's history (~5 min).

### Concurrency, measured 2026-09-01

| Setting | Result |
| --- | --- |
| 8 | Fails. Every statement lands at ~31s. |
| 4 | Succeeded in isolation (27.4s worst) but **failed inside the backfill**. |
| 2 | Failed inside the backfill. |
| 1 | Worked while the database was healthy; failed once degraded. |

Isolated probes over-predict what survives. Each pass first pulls ~176k pool-hour rows for Optimism
plus markets and liquidity events, so the database is already warm before the first timed query. If
the 120s timeout is confirmed, 4 is a reasonable start and 8 should also fit; if it is not
confirmed, do not run at all.

The first 500 days ran at concurrency 8 in ~40 minutes. The remaining 165 are far heavier.

## 4. When the CSV completes

Run the validation in `AIRDROP_RESEED.md` step 6, plus one check specific to the executor roll-up in
`f6b95a02` — no TradeExecutor address may survive as a holder:

```sql
-- expect zero rows
select s.address from airdrops_staging s
join (select jsonb_object_keys(value->'owners') as executor
      from key_value where key like 'seer_pnl_leaderboard_owners_%') e
  on lower(s.address) = e.executor;
```

For reference, a 3-day sample validated on 2026-09-01: `sum(share_of_holding)` and
`sum(share_of_holding_poh)` both exactly `1.000000000` per day, zero of 764 known executors present
as holders, and **613 executor addresses holding ~188,000 SEER/day** in the live table that the
roll-up reassigns to owner EOAs. Row counts drop ~20/day as executors collapse into owners.

## 5. Before importing — four blockers

1. **`DISABLE_SCHEDULED_FUNCTIONS=true`** in the Netlify environment
   (`scheduled-airdrop-calculation.ts:4`). Confirm a scheduled run is skipped first.
2. **Deploy the branch.** `airdrop-leaderboard` carries three unpushed commits, including
   `f6b95a02` (the executor roll-up) — the reason this reseed is needed at all. If production is
   still running `main`, the nightly job appends non-rolled-up rows on top of rolled-up data and the
   two become indistinguishable. This is `AIRDROP_RESEED.md` step 2 and it is not optional.
3. **Drop the stale staging table.** `airdrops_staging` from the 2026-09-01 reseed still exists and
   will contaminate a fresh `\copy`. `airdrops_backup_20260901` also exists, so pick a new backup
   name or drop it deliberately.
4. **The swap deletes days newer than the CSV.** Step 7's unconditional `delete from
   public.airdrops` removes any snapshot the nightly job added after generation. Those days are
   recomputed on the next scheduled run — but only correctly if blocker 2 is done first.

## 6. Separate issues found, not yet fixed

- **`get_direct_holdings_at` is approaching its limit.** 29-32s on Optimism on a healthy database,
  growing daily, and it aggregates full transfer history per call. The nightly job calls the same
  RPC; it survives today only because it is sequential. An index or a materialized holdings table is
  the durable fix, and it is the root cause of everything in section 1.
- **`AIRDROP_RESEED.md` step 4 is out of date**: the command does not run (section 2 above), and its
  claim that the default `--concurrency 8` completes in ~1 hour no longer holds for the recent days.
