-- Seer credit cards: printed cards with a QR that transfers a random USD amount of credits.
-- Apply BEFORE deploying `admin-credit-campaigns`, `credit-card`, `claim-credit-card` and
-- `scheduled-credit-cards-transfer`.
--
-- Both tables are only reachable with the service_role key: RLS is on with no policies. The claim `code` is
-- stored in clear so an admin can re-download a campaign's QR codes; anyone holding it can claim the card.

create table if not exists public.credit_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default false,
  card_count integer not null check (card_count > 0),
  min_usd integer not null check (min_usd > 0),
  max_usd integer not null check (max_usd >= min_usd),
  total_usd integer not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- `status` is the credits transfer; `drip_status` is the optional xDAI gas top-up sent after it.
--   unclaimed -> pending (claimed, nothing broadcast yet) -> sent (tx_hash stored) -> confirmed | failed
-- Wei amounts are text: PostgREST serializes numeric as a JSON number, which loses precision in JS.
-- `credits_wei` is fixed at claim time so every retry transfers the same amount.
-- `tx_hashes` keeps every tx signed for the leg: a replacement at the same nonce can lose the race to the
-- original, so delivery is settled by whichever of them has a receipt.
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.credit_campaigns (id) on delete cascade,
  serial text not null,
  code text not null unique,
  amount_usd integer not null check (amount_usd > 0),
  status text not null default 'unclaimed'
    check (status in ('unclaimed', 'pending', 'sent', 'confirmed', 'failed')),
  claimed_by text,
  claimed_at timestamptz,
  credits_wei text,
  tx_hash text,
  tx_hashes text[] not null default '{}',
  tx_nonce integer,
  tx_sent_at timestamptz,
  drip_status text not null default 'none'
    check (drip_status in ('none', 'pending', 'sent', 'confirmed', 'failed', 'skipped')),
  drip_wei text,
  drip_tx_hash text,
  drip_tx_hashes text[] not null default '{}',
  drip_tx_nonce integer,
  drip_sent_at timestamptz,
  error text,
  updated_at timestamptz not null default now()
);

create index if not exists credit_cards_campaign_id_idx on public.credit_cards (campaign_id);

create index if not exists credit_cards_delivery_idx
  on public.credit_cards (claimed_at)
  where status in ('pending', 'sent') or drip_status in ('pending', 'sent');

alter table public.credit_campaigns enable row level security;
alter table public.credit_cards enable row level security;

-- Atomic claim: only one caller can move a card out of `unclaimed`, and only while its campaign is active.
-- Returns the claimed row, or nothing when the card was already claimed or the campaign is inactive.
create or replace function public.claim_credit_card(
  p_code text,
  p_address text,
  p_credits_wei text,
  p_drip_wei text
)
returns setof public.credit_cards
language sql
as $$
  update public.credit_cards c
  set status = 'pending',
      claimed_by = lower(p_address),
      claimed_at = now(),
      credits_wei = p_credits_wei,
      drip_status = case when p_drip_wei is null then 'none' else 'pending' end,
      drip_wei = p_drip_wei,
      updated_at = now()
  from public.credit_campaigns k
  where c.code = p_code
    and c.status = 'unclaimed'
    and k.id = c.campaign_id
    and k.active
  returning c.*;
$$;

-- Per-campaign aggregates for the admin page.
create or replace function public.credit_campaigns_overview()
returns table (
  id uuid,
  name text,
  active boolean,
  card_count integer,
  min_usd integer,
  max_usd integer,
  total_usd integer,
  created_by text,
  created_at timestamptz,
  claimed_count integer,
  claimed_usd integer,
  confirmed_count integer,
  confirmed_credits_wei text,
  in_flight_count integer,
  failed_count integer,
  unclaimed_usd integer
)
language sql
stable
as $$
  select
    k.id,
    k.name,
    k.active,
    k.card_count,
    k.min_usd,
    k.max_usd,
    k.total_usd,
    k.created_by,
    k.created_at,
    count(*) filter (where c.status <> 'unclaimed')::integer,
    coalesce(sum(c.amount_usd) filter (where c.status <> 'unclaimed'), 0)::integer,
    count(*) filter (where c.status = 'confirmed')::integer,
    coalesce(sum(c.credits_wei::numeric) filter (where c.status = 'confirmed'), 0)::text,
    count(*) filter (where c.status in ('pending', 'sent'))::integer,
    count(*) filter (where c.status = 'failed' or c.drip_status = 'failed')::integer,
    coalesce(sum(c.amount_usd) filter (where c.status = 'unclaimed'), 0)::integer
  from public.credit_campaigns k
  left join public.credit_cards c on c.campaign_id = k.id
  group by k.id
  order by k.created_at desc;
$$;

-- Credits the distributor still owes for claimed cards whose transfer has not confirmed yet.
create or replace function public.credit_cards_in_flight_wei()
returns text
language sql
stable
as $$
  select coalesce(sum(credits_wei::numeric), 0)::text
  from public.credit_cards
  where status in ('pending', 'sent');
$$;

revoke all on function public.claim_credit_card(text, text, text, text) from public, anon, authenticated;
revoke all on function public.credit_campaigns_overview() from public, anon, authenticated;
revoke all on function public.credit_cards_in_flight_wei() from public, anon, authenticated;
grant execute on function public.claim_credit_card(text, text, text, text) to service_role;
grant execute on function public.credit_campaigns_overview() to service_role;
grant execute on function public.credit_cards_in_flight_wei() to service_role;
