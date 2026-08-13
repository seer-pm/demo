-- Indexes for wallet-scoped tokens_transfers scans (airdrop / transfer queries).
--
-- Queries that filter by address typically run two range scans:
--
--   where chain_id = $1 and "from" = $2 and timestamp > $3 and timestamp <= $4
--   where chain_id = $1 and "to"   = $2 and timestamp > $3 and timestamp <= $4
--
-- Existing analytics indexes are (chain_id, timestamp) / (token, timestamp) with from/to
-- only in INCLUDE columns — not usable as leading predicates for address filters.
--
-- Check what already exists before applying:
--   select indexname, indexdef from pg_indexes where tablename = 'tokens_transfers';
--
-- NOTE: create index concurrently cannot run inside a transaction block. Run each as a
-- standalone statement (the Supabase SQL editor wraps multi-statement scripts), otherwise
-- it fails with 25001.

create index concurrently if not exists tokens_transfers_chain_from_ts_idx
  on public.tokens_transfers (chain_id, "from", timestamp);

create index concurrently if not exists tokens_transfers_chain_to_ts_idx
  on public.tokens_transfers (chain_id, "to", timestamp);

analyze public.tokens_transfers;

-- Verify the plan afterwards — want Index Scan using the from/to indexes, not Seq Scan:
--
--   explain (analyze, buffers)
--   select distinct token from (
--     select token from tokens_transfers
--       where chain_id = 10 and "from" = '0x...' and timestamp > 0 and timestamp <= extract(epoch from now())::bigint
--     union
--     select token from tokens_transfers
--       where chain_id = 10 and "to" = '0x...' and timestamp > 0 and timestamp <= extract(epoch from now())::bigint
--   ) s;
--
-- Addresses in the table are stored lowercase; application code always queries lowercased.
