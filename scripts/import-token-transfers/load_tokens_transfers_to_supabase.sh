#!/usr/bin/env bash
set -euo pipefail

# Loads CSV chunks (created by envio_export_transfers.ts) into Supabase Postgres
# using psql \copy into a TEMP table, then UPSERT-merge into `tokens_transfers`.
#
# Requires:
# - psql installed locally
# - a DIRECT Postgres connection string (avoid transaction-pooling PgBouncer)
#
# Usage (from repository root):
#   DATABASE_URL='postgresql://...' \
#   ./scripts/import-token-transfers/load_tokens_transfers_to_supabase.sh ./tmp/envio
#
# Optional env vars:
#   PGSSLMODE=require
#   STATEMENT_TIMEOUT — passed to SET LOCAL (default: 0 = off). Examples: 0, '15min', '2h'
#   IDLE_IN_TX_TIMEOUT — SET LOCAL idle_in_transaction_session_timeout (default: 0 = off)
#   MAX_CSV_FILES — if set to a positive integer, only load that many CSV files (sorted by name).
#                   Example dry-run: MAX_CSV_FILES=1 (first chunk only, ~chunkSize rows from export).

STATEMENT_TIMEOUT="${STATEMENT_TIMEOUT:-0}"
IDLE_IN_TX_TIMEOUT="${IDLE_IN_TX_TIMEOUT:-0}"

# PostgreSQL: numeric statement_timeout is ms; 0 disables. Strings like '15min' must be quoted in SQL.
sql_timeout_val() {
  local v="${1:-0}"
  if [[ "${v}" =~ ^[0-9]+$ ]]; then
    printf '%s' "${v}"
  else
    printf "'%s'" "${v//\'/\'\'}"
  fi
}

ST_TIMEOUT_SQL="$(sql_timeout_val "${STATEMENT_TIMEOUT}")"
IDLE_TX_SQL="$(sql_timeout_val "${IDLE_IN_TX_TIMEOUT}")"

CSV_DIR="${1:-}"
if [[ -z "${CSV_DIR}" ]]; then
  echo "Missing CSV dir argument."
  echo "Usage: DATABASE_URL='postgresql://...' $0 ./tmp/envio"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Missing DATABASE_URL env var (direct connection)."
  exit 1
fi

SQL_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/supabase/sql/tokens_transfers_bulk_load.sql"

if [[ ! -f "${SQL_FILE}" ]]; then
  echo "SQL file not found: ${SQL_FILE}"
  exit 1
fi

shopt -s nullglob
mapfile -t files < <(printf '%s\n' "${CSV_DIR}"/tokens_transfers_*.csv | sort -V)
if (( ${#files[@]} == 0 )); then
  echo "No CSV files found in: ${CSV_DIR}"
  exit 1
fi

total_available=${#files[@]}
MAX_CSV_FILES="${MAX_CSV_FILES:-}"
if [[ -n "${MAX_CSV_FILES}" ]]; then
  if ! [[ "${MAX_CSV_FILES}" =~ ^[0-9]+$ ]] || (( MAX_CSV_FILES < 1 )); then
    echo "MAX_CSV_FILES must be a positive integer (got: ${MAX_CSV_FILES})"
    exit 1
  fi
  if (( MAX_CSV_FILES < total_available )); then
    files=( "${files[@]:0:MAX_CSV_FILES}" )
    echo "[load_tokens_transfers] limiting to first ${MAX_CSV_FILES} of ${total_available} CSV file(s) (MAX_CSV_FILES)"
  fi
fi

echo "[load_tokens_transfers] files=${#files[@]} dir=${CSV_DIR}"
echo "[load_tokens_transfers] STATEMENT_TIMEOUT=${STATEMENT_TIMEOUT} IDLE_IN_TX_TIMEOUT=${IDLE_IN_TX_TIMEOUT}"

for f in "${files[@]}"; do
  echo "[load_tokens_transfers] loading ${f}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<SQL
\timing on
BEGIN;
SET LOCAL statement_timeout = ${ST_TIMEOUT_SQL};
SET LOCAL idle_in_transaction_session_timeout = ${IDLE_TX_SQL};
-- Staging columns match CSV (no surrogate id); PK columns come from CSV for UPSERT.
DROP TABLE IF EXISTS tokens_transfers_tmp;
CREATE TEMP TABLE tokens_transfers_tmp ON COMMIT DROP AS
SELECT
  block_number,
  timestamp,
  "from",
  "to",
  tx_hash,
  chain_id,
  token,
  value,
  log_index
FROM public.tokens_transfers
WHERE false;
\copy tokens_transfers_tmp (block_number,timestamp,"from","to",tx_hash,chain_id,token,value,log_index) FROM '${f}' WITH (FORMAT csv, HEADER true);
SELECT COUNT(*) AS staged_rows FROM tokens_transfers_tmp;
\i '${SQL_FILE}'
COMMIT;
SQL
done

echo "[load_tokens_transfers] done"

