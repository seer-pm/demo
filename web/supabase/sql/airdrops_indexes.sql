-- Indexes for the airdrops table.
--
-- The user-facing read path (netlify/functions/get-airdrop-data-by-user.ts, and the
-- get_airdrop_summary_by_user RPC) filters by address and scans that user's whole history:
--
--   where address = $1 order by "timestamp" asc
--
-- The table grows by one row per user per day since genesis (2024-10-11), so without a
-- supporting index this is a sequential scan that eventually trips Supabase's statement
-- timeout (57014, "canceling statement due to statement timeout") and surfaces as an error
-- on the portfolio Airdrop tab.
--
-- The INCLUDE columns are exactly the ones both read paths project, so the planner can use
-- an index-only scan with no heap fetches, and the ordering removes the sort node.

-- Check what already exists before applying:
--   select indexname, indexdef from pg_indexes where tablename = 'airdrops';
--
-- NOTE: create index concurrently cannot run inside a transaction block. Run it as a
-- standalone statement (the Supabase SQL editor wraps multi-statement scripts), otherwise
-- it fails with 25001.

create index concurrently if not exists airdrops_address_timestamp_idx
  on public.airdrops (address, "timestamp")
  include (share_of_holding, share_of_holding_poh, seer_tokens_count);

-- Index-only scans only skip the heap when the visibility map is current, and this table is
-- append-heavy, so vacuum it more eagerly than the 20% default.
alter table public.airdrops set (autovacuum_vacuum_scale_factor = 0.02);

analyze public.airdrops;

-- Verify the plan afterwards — want "Index Only Scan using airdrops_address_timestamp_idx"
-- with "Heap Fetches: 0" and no Sort node:
--
--   explain (analyze, buffers)
--   select "timestamp", share_of_holding, share_of_holding_poh, seer_tokens_count
--   from public.airdrops where address = '0x...' order by "timestamp" asc;
--
-- A Seq Scan here means the index wasn't used: check that every stored address is lowercase,
-- since the application always queries with a lowercased address. If some rows are stored
-- mixed-case, index lower(address) instead of address.
