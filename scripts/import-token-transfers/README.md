# Envio `Transfer` → `tokens_transfers` (Postgres / Supabase)

Exports ERC-20 `Transfer` events from an **Envio HyperIndex** GraphQL endpoint, writes chunked CSV files, and merges them into `public.tokens_transfers` using `\copy` + `INSERT … ON CONFLICT` on `(chain_id, tx_hash, log_index)`.

All commands below assume you run them from the **repository root** (`seer-pm/`).

## Requirements

- **Node.js** 18+ (`npx` available).
- **PostgreSQL client** (`psql`) installed.
- **`DATABASE_URL`**: a **direct** Postgres connection string (avoid transaction-pooling mode for PgBouncer; `\copy` and long-running scripts often fail or behave poorly behind some poolers).

## Scripts

| File | Purpose |
|------|---------|
| `envio_export_transfers.ts` | Paginated download from Envio GraphQL → CSV files `tokens_transfers_*.csv` |
| `verify_tokens_transfers_csv.ts` | Row counts and min/max `timestamp` across CSVs |
| `load_tokens_transfers_to_supabase.sh` | `\copy` into a temp table + merge via [`supabase/sql/tokens_transfers_bulk_load.sql`](../../supabase/sql/tokens_transfers_bulk_load.sql) |
| `envio_to_supabase_bulk.sh` | Orchestrates export → optional verification → load |

## Indexer URL

In this project, **all chains are indexed behind one shared Envio HyperIndex GraphQL URL**. You must pass that URL explicitly—there is **no default**:

- Set **`ENVIO_URL`** when running the bulk script (required whenever the export step runs).
- Pass **`--url`** when running `envio_export_transfers.ts` directly.

To export **one chain at a time** from that shared indexer, use **`WHERE_JSON`** (Hasura-style filter on `Transfer`, e.g. `chainId`). Use a dedicated **`OUT_DIR`** per export if you want separate CSV trees or `resume.json` files.

## First-time import (from scratch)

1. Use your team’s shared HyperIndex GraphQL URL (same for every chain in the indexer).

2. Run the full pipeline:

```bash
export ENVIO_URL='https://indexer.hyperindex.xyz/<deployment>/v1/graphql'
export DATABASE_URL='postgresql://user:password@host:5432/postgres'
./scripts/import-token-transfers/envio_to_supabase_bulk.sh
```

Defaults:

- **`OUT_DIR`**: `./tmp/envio` (under the repo root). CSV chunks and `resume.json` (if you interrupt the export) land here.

3. **Quick test** (only the first CSV file, roughly one chunk size):

```bash
ENVIO_URL='https://indexer.hyperindex.xyz/<deployment>/v1/graphql' \
MAX_CSV_FILES=1 DATABASE_URL='postgresql://…' ./scripts/import-token-transfers/envio_to_supabase_bulk.sh
```

Or load only, when CSVs already exist (`ENVIO_URL` not needed):

```bash
SKIP_EXPORT=1 MAX_CSV_FILES=1 DATABASE_URL='postgresql://…' \
  ./scripts/import-token-transfers/envio_to_supabase_bulk.sh
```

## Importing another chain (new `chain_id`)

Keep the **same `ENVIO_URL`**. Scope the export to one chain with **`WHERE_JSON`**, and optionally a fresh **`OUT_DIR`** so you do not mix or overwrite CSVs:

```bash
export ENVIO_URL='https://indexer.hyperindex.xyz/<deployment>/v1/graphql'
export WHERE_JSON='{"chainId":{"_eq":"100"}}'    # example: chain id as a string
export OUT_DIR='./tmp/envio-chain-100'
export DATABASE_URL='postgresql://…'
./scripts/import-token-transfers/envio_to_supabase_bulk.sh
```

The database upsert key is `(chain_id, tx_hash, log_index)`; you **do not** need to truncate the table when adding a new chain—rows for different `chain_id` values coexist.

## Environment variables (cheat sheet)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Required for loading (the bulk script checks connectivity up front). |
| `ENVIO_URL` | **Required** for any run that exports from Envio (omit only with `SKIP_EXPORT=1`). No default. |
| `OUT_DIR` | Output directory for CSVs and `resume.json` (default `./tmp/envio`). |
| `WHERE_JSON` | Optional filter on `Transfer` (e.g. single chain on a multi-chain indexer). |
| `SKIP_EXPORT=1` | Run verification + load only, using CSVs already in `OUT_DIR`. |
| `SKIP_VERIFY=1` | Skip the CSV verification step. |
| `MAX_CSV_FILES` | Load only the first N CSV files after sorting (useful for dry runs). |
| `FROM_TS` / `TO_TS` | Unix time window (seconds); passed through to the export by the bulk script. |
| `RPM`, `CHUNK_SIZE`, `WINDOW_SECONDS` | Request rate, rows per CSV file, and time window size per query batch. |

## Manual export or verification

```bash
npx --yes tsx ./scripts/import-token-transfers/envio_export_transfers.ts \
  --url "$ENVIO_URL" \
  --outDir ./tmp/envio \
  --autoRange \
  --whereJson '{"chainId":{"_eq":"100"}}'

npx --yes tsx ./scripts/import-token-transfers/verify_tokens_transfers_csv.ts ./tmp/envio

DATABASE_URL='postgresql://…' ./scripts/import-token-transfers/load_tokens_transfers_to_supabase.sh ./tmp/envio
```

## Resuming an interrupted export

The exporter saves state to `resume.json` under **`OUT_DIR`**. Re-run the same command (matching relevant flags). If you change the CSV format or other incompatible options, the script may ignore the old resume file.
