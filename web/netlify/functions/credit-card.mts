import { CORS_HEADERS } from "./utils/common";
import { type CreditCardRow, refreshCardReceipts, serializeClaimedCard, supabase } from "./utils/creditCards";

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS };

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

type CampaignSummary = { active: boolean; name: string; min_usd: number; max_usd: number };

type CardWithCampaign = CreditCardRow & {
  credit_campaigns: CampaignSummary | CampaignSummary[] | null;
};

/**
 * Public status of a card, keyed by its secret code. Before the claim it says whether the card can be claimed,
 * plus its serial and campaign range; the amount stays hidden until then. After the claim it reports delivery, settling any tx that
 * already has a receipt so the claim page does not wait for the next sweep.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const code = new URL(req.url).searchParams.get("code");
    if (!code) {
      return json({ state: "not_found" }, 404);
    }

    const { data: row, error } = await supabase
      .from("credit_cards")
      .select("*, credit_campaigns!inner(active, name, min_usd, max_usd)")
      .eq("code", code)
      .maybeSingle<CardWithCampaign>();
    if (error) {
      throw error;
    }
    if (!row) {
      return json({ state: "not_found" }, 404);
    }

    const { credit_campaigns: campaigns, ...card } = row;
    const campaign = Array.isArray(campaigns) ? campaigns[0] : campaigns;
    const campaignInfo = { serial: card.serial, campaignName: campaign?.name ?? null };
    if (card.status === "unclaimed") {
      return json(
        {
          state: campaign?.active ? "valid" : "inactive",
          card: { ...campaignInfo, minUsd: campaign?.min_usd ?? null, maxUsd: campaign?.max_usd ?? null },
        },
        200,
      );
    }

    let current: CreditCardRow = card;
    if (current.status === "sent" || current.drip_status === "sent") {
      try {
        current = await refreshCardReceipts(current);
      } catch (refreshError) {
        console.error("credit-card: receipt refresh failed", refreshError);
      }
    }

    return json({ state: "claimed", data: { ...serializeClaimedCard(current), ...campaignInfo } }, 200);
  } catch (error) {
    console.error("credit-card error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};
