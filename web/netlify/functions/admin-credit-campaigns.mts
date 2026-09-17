import { randomBytes, randomInt } from "node:crypto";
import { formatEther } from "viem";
import { verifyAdminToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";
import {
  type CreditCardRow,
  claimUrl,
  getCreditsBalance,
  getDistributorAccount,
  getInFlightCreditsWei,
  getXdaiBalance,
  retryFailedCard,
  supabase,
  usdToCreditsWei,
} from "./utils/creditCards";

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

const MAX_CARDS_PER_CAMPAIGN = 5000;
const MAX_CARD_USD = 10_000;
const PAGE_SIZE = 1000;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

type CampaignOverviewRow = {
  id: string;
  name: string;
  active: boolean;
  card_count: number;
  min_usd: number;
  max_usd: number;
  total_usd: number;
  created_by: string;
  created_at: string;
  claimed_count: number;
  claimed_usd: number;
  confirmed_count: number;
  confirmed_credits_wei: string;
  in_flight_count: number;
  failed_count: number;
  unclaimed_usd: number;
};

async function getDistributorStatus(unclaimedActiveUsd: number) {
  try {
    const address = getDistributorAccount().address;
    const [creditsBalance, xdaiBalance, inFlightWei, unclaimedWei] = await Promise.all([
      getCreditsBalance(address),
      getXdaiBalance(address),
      getInFlightCreditsWei(),
      unclaimedActiveUsd > 0 ? usdToCreditsWei(unclaimedActiveUsd) : Promise.resolve(0n),
    ]);
    return {
      address,
      credits: formatEther(creditsBalance),
      xdai: formatEther(xdaiBalance),
      // Informational: unclaimed cards are priced at today's sDAI rate.
      owedCredits: formatEther(inFlightWei + unclaimedWei),
      error: null,
    };
  } catch (error) {
    console.error("admin-credit-campaigns: distributor status failed", error);
    return {
      address: null,
      credits: null,
      xdai: null,
      owedCredits: null,
      error: "Could not read the distributor wallet. Check the function logs.",
    };
  }
}

async function listCampaigns() {
  const { data, error } = await supabase.rpc("credit_campaigns_overview");
  if (error) {
    throw error;
  }
  const campaigns = (data ?? []) as CampaignOverviewRow[];
  const unclaimedActiveUsd = campaigns.filter((c) => c.active).reduce((sum, c) => sum + c.unclaimed_usd, 0);

  return {
    campaigns: campaigns.map((c) => ({
      ...c,
      confirmed_credits: formatEther(BigInt(c.confirmed_credits_wei)),
    })),
    distributor: await getDistributorStatus(unclaimedActiveUsd),
  };
}

async function listCampaignCards(campaignId: string, origin: string) {
  const cards: CreditCardRow[] = [];
  // PostgREST caps responses at 1000 rows.
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("serial", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw error;
    }
    cards.push(...((data ?? []) as CreditCardRow[]));
    if (!data || data.length < PAGE_SIZE) {
      break;
    }
  }

  return cards.map((card) => ({
    id: card.id,
    serial: card.serial,
    url: claimUrl(origin, card.code),
    amount_usd: card.amount_usd,
    status: card.status,
    claimed_by: card.claimed_by,
    claimed_at: card.claimed_at,
    credits: card.credits_wei ? formatEther(BigInt(card.credits_wei)) : null,
    tx_hash: card.tx_hash,
    drip_status: card.drip_status,
    drip_tx_hash: card.drip_tx_hash,
    error: card.error,
  }));
}

function serialPrefix(name: string) {
  return (
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12) || "SEER"
  );
}

async function createCampaign(adminId: string, body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const cardCount = Number(body.cardCount);
  const minUsd = Number(body.minUsd);
  const maxUsd = Number(body.maxUsd);

  if (!name || name.length > 80) {
    return json({ error: "Name is required (max 80 characters)" }, 400);
  }
  if (!Number.isInteger(cardCount) || cardCount < 1 || cardCount > MAX_CARDS_PER_CAMPAIGN) {
    return json({ error: `Card count must be an integer between 1 and ${MAX_CARDS_PER_CAMPAIGN}` }, 400);
  }
  if (
    !Number.isInteger(minUsd) ||
    !Number.isInteger(maxUsd) ||
    minUsd < 1 ||
    maxUsd < minUsd ||
    maxUsd > MAX_CARD_USD
  ) {
    return json({ error: `Amounts must be whole USD with 1 ≤ min ≤ max ≤ ${MAX_CARD_USD}` }, 400);
  }

  const prefix = serialPrefix(name);
  const digits = Math.max(4, String(cardCount).length);
  const cards = Array.from({ length: cardCount }, (_, i) => ({
    serial: `${prefix}-${String(i + 1).padStart(digits, "0")}`,
    code: randomBytes(16).toString("base64url"),
    amount_usd: randomInt(minUsd, maxUsd + 1),
  }));
  const totalUsd = cards.reduce((sum, card) => sum + card.amount_usd, 0);

  const { data: campaign, error: campaignError } = await supabase
    .from("credit_campaigns")
    .insert({
      name,
      active: false,
      card_count: cardCount,
      min_usd: minUsd,
      max_usd: maxUsd,
      total_usd: totalUsd,
      created_by: adminId,
    })
    .select()
    .single();
  if (campaignError) {
    throw campaignError;
  }

  for (let from = 0; from < cards.length; from += PAGE_SIZE) {
    const { error } = await supabase
      .from("credit_cards")
      .insert(cards.slice(from, from + PAGE_SIZE).map((card) => ({ ...card, campaign_id: campaign.id })));
    if (error) {
      // Cards cascade with the campaign, so a half-written campaign never survives.
      await supabase.from("credit_campaigns").delete().eq("id", campaign.id);
      throw error;
    }
  }

  return json({ data: campaign }, 201);
}

async function retryCard(body: Record<string, unknown>) {
  if (typeof body.cardId !== "string") {
    return json({ error: "Missing cardId" }, 400);
  }
  const { data: card, error } = await supabase.from("credit_cards").select("*").eq("id", body.cardId).maybeSingle();
  if (error) {
    throw error;
  }
  if (!card) {
    return json({ error: "Card not found" }, 404);
  }
  const retried = await retryFailedCard(card as CreditCardRow);
  if (!retried) {
    return json({ error: "Card has nothing failed to retry" }, 400);
  }
  return json({ success: true }, 200);
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const adminId = verifyAdminToken(req.headers.get("Authorization"));
  if (!adminId) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    if (req.method === "GET") {
      const { origin, searchParams } = new URL(req.url);
      const campaignId = searchParams.get("campaignId");
      if (campaignId) {
        return json({ data: await listCampaignCards(campaignId, origin) }, 200);
      }
      return json({ data: await listCampaigns() }, 200);
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (body.action === "retry") {
        return await retryCard(body);
      }
      return await createCampaign(adminId, body);
    }

    if (req.method === "PATCH") {
      const { id, active } = await req.json();
      if (typeof id !== "string" || typeof active !== "boolean") {
        return json({ error: "Missing id or active" }, 400);
      }
      const { data, error } = await supabase
        .from("credit_campaigns")
        .update({ active })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) {
        throw error;
      }
      if (!data) {
        return json({ error: "Campaign not found" }, 404);
      }
      return json({ data }, 200);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("admin-credit-campaigns error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};
