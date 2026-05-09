#!/usr/bin/env bash
set -euo pipefail

# End-to-end pipeline:
# 1) Export all Envio Transfer rows to CSV chunks
# 2) (optional) Verify CSV stats
# 3) Load into Supabase via TEMP table + \copy + UPSERT on (chain_id, tx_hash, log_index)
#
# Requires:
# - Node (for tsx via npx)
# - psql
# - DATABASE_URL: direct Postgres connection string (avoid transaction pooling)
# - ENVIO_URL: Envio HyperIndex GraphQL URL (required unless SKIP_EXPORT=1)
#
# Usage (from repository root):
#   ENVIO_URL='https://indexer.hyperindex.xyz/<deployment>/v1/graphql' \
#   DATABASE_URL='postgresql://...' ./scripts/import-token-transfers/envio_to_supabase_bulk.sh
#
# Common overrides:
#   OUT_DIR='./tmp/envio' RPM='150' CHUNK_SIZE='100000' WINDOW_SECONDS='86400' \
#   WHERE_JSON='{"chainId":{"_eq":"100"}}' \
#   DATABASE_URL='postgresql://...' ENVIO_URL='https://...' \
#   ./scripts/import-token-transfers/envio_to_supabase_bulk.sh
#
# Optional:
#   FROM_TS='0' TO_TS='<unixSeconds>'  (default: 0..now, capped by --autoRange)
#   SKIP_VERIFY='1'                   (skip CSV verification step)
#   SKIP_EXPORT='1'                   (only load existing CSVs; no Envio download)
#   MAX_CSV_FILES='1'                 (load only first N CSV chunks — inherited by load script; trial runs)
#   WHERE_JSON='{"chainId":{"_eq":"100"}}'  (Envio filter; multi-chain indexers)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMPORT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENVIO_URL="${ENVIO_URL:-}"
OUT_DIR="${OUT_DIR:-${ROOT_DIR}/tmp/envio}"
RPM="${RPM:-150}"
CHUNK_SIZE="${CHUNK_SIZE:-100000}"
WINDOW_SECONDS="${WINDOW_SECONDS:-86400}"
FROM_TS="${FROM_TS:-0}"
TO_TS="${TO_TS:-}"
SKIP_VERIFY="${SKIP_VERIFY:-0}"
SKIP_EXPORT="${SKIP_EXPORT:-0}"
WHERE_JSON="${WHERE_JSON:-}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Missing DATABASE_URL env var (direct connection)."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Missing 'psql' binary. Please install PostgreSQL client tools."
  exit 1
fi

echo "[envio_to_supabase] checking DATABASE_URL connectivity..."
if ! psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "select 1 as ok;" >/dev/null 2>&1; then
  echo "Could not connect using DATABASE_URL."
  echo "Make sure it's a DIRECT Postgres connection string (not transaction-pooling) and credentials are correct."
  exit 1
fi
echo "[envio_to_supabase] DATABASE_URL ok"

EXPORT_SCRIPT="${IMPORT_DIR}/envio_export_transfers.ts"
VERIFY_SCRIPT="${IMPORT_DIR}/verify_tokens_transfers_csv.ts"
LOAD_SCRIPT="${IMPORT_DIR}/load_tokens_transfers_to_supabase.sh"

if [[ ! -f "${EXPORT_SCRIPT}" ]]; then
  echo "Missing export script: ${EXPORT_SCRIPT}"
  exit 1
fi
if [[ ! -f "${LOAD_SCRIPT}" ]]; then
  echo "Missing load script: ${LOAD_SCRIPT}"
  exit 1
fi

mkdir -p "${OUT_DIR}"

if [[ "${SKIP_EXPORT}" != "1" ]] && [[ -z "${ENVIO_URL}" ]]; then
  echo "Missing ENVIO_URL (Envio HyperIndex GraphQL URL). Required unless SKIP_EXPORT=1."
  exit 1
fi

if [[ "${SKIP_EXPORT}" == "1" ]]; then
  echo "[envio_to_supabase] SKIP_EXPORT=1 — skipping Envio download (using CSVs in ${OUT_DIR})"
else
  echo "[envio_to_supabase] export start url=${ENVIO_URL} outDir=${OUT_DIR} rpm=${RPM} chunkSize=${CHUNK_SIZE} windowSeconds=${WINDOW_SECONDS}"

  export_args=(
    "npx" "--yes" "tsx" "${EXPORT_SCRIPT}"
    "--url" "${ENVIO_URL}"
    "--autoRange"
    "--outDir" "${OUT_DIR}"
    "--rpm" "${RPM}"
    "--chunkSize" "${CHUNK_SIZE}"
    "--windowSeconds" "${WINDOW_SECONDS}"
    "--fromTs" "${FROM_TS}"
  )

  if [[ -n "${TO_TS}" ]]; then
    export_args+=( "--toTs" "${TO_TS}" )
  fi

  if [[ -n "${WHERE_JSON}" ]]; then
    export_args+=( "--whereJson" "${WHERE_JSON}" )
  fi

  "${export_args[@]}"

  echo "[envio_to_supabase] export done"
fi

if [[ "${SKIP_VERIFY}" != "1" ]]; then
  if [[ -f "${VERIFY_SCRIPT}" ]]; then
    echo "[envio_to_supabase] verify CSVs"
    npx --yes tsx "${VERIFY_SCRIPT}" "${OUT_DIR}"
  else
    echo "[envio_to_supabase] verify skipped (script not found)"
  fi
else
  echo "[envio_to_supabase] verify skipped (SKIP_VERIFY=1)"
fi

echo "[envio_to_supabase] load into Supabase (TEMP + \\copy + UPSERT on PK chain_id,tx_hash,log_index)"
"${LOAD_SCRIPT}" "${OUT_DIR}"

echo "[envio_to_supabase] done"

