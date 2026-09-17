import { isAddress } from "viem";
import { CORS_HEADERS } from "./utils/common";
import {
  type CreditCardRow,
  GAS_DRIP_THRESHOLD_WEI,
  GAS_DRIP_WEI,
  deliverClaimedCard,
  getCreditsBalance,
  getDistributorAccount,
  getXdaiBalance,
  serializeClaimedCard,
  supabase,
  usdToCreditsWei,
} from "./utils/creditCards";

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

type CardLookupRow = {
  status: CreditCardRow["status"];
  amount_usd: number;
  credit_campaigns: { active: boolean; name: string } | { active: boolean; name: string }[] | null;
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { code, address } = await req.json();
    if (typeof code !== "string" || !code) {
      return json({ error: "Missing code" }, 400);
    }
    if (typeof address !== "string" || !isAddress(address)) {
      return json({ error: "Invalid address" }, 400);
    }

    const { data: lookup, error: lookupError } = await supabase
      .from("credit_cards")
      .select("status, amount_usd, credit_campaigns!inner(active, name)")
      .eq("code", code)
      .maybeSingle<CardLookupRow>();
    if (lookupError) {
      throw lookupError;
    }
    if (!lookup) {
      return json({ state: "not_found", error: "This card does not exist" }, 404);
    }
    if (lookup.status !== "unclaimed") {
      return json({ state: "claimed", error: "This card was already claimed" }, 409);
    }
    const campaign = Array.isArray(lookup.credit_campaigns) ? lookup.credit_campaigns[0] : lookup.credit_campaigns;
    if (!campaign?.active) {
      return json({ state: "inactive", error: "This card is not active" }, 403);
    }

    const creditsWei = await usdToCreditsWei(lookup.amount_usd);
    // Taken before the balance read: the claim counts cards confirmed since then as still owed.
    const balanceReadAt = new Date().toISOString();
    const [distributorBalance, recipientXdai] = await Promise.all([
      getCreditsBalance(getDistributorAccount().address),
      getXdaiBalance(address),
    ]);

    // The claim checks the balance against every recorded obligation under a lock, so concurrent claims
    // cannot both fit in the same credits.
    const { data: claimed, error: claimError } = await supabase
      .rpc("claim_credit_card", {
        p_code: code,
        p_address: address,
        p_credits_wei: creditsWei.toString(),
        p_drip_wei: recipientXdai < GAS_DRIP_THRESHOLD_WEI ? GAS_DRIP_WEI.toString() : null,
        p_balance_wei: distributorBalance.toString(),
        p_balance_read_at: balanceReadAt,
      })
      .maybeSingle<CreditCardRow>();
    if (claimError?.message === "credit_cards_insufficient_balance") {
      // Refused before claiming, so the card stays usable once the distributor is topped up.
      console.error("claim-credit-card: distributor balance too low", {
        distributorBalance: distributorBalance.toString(),
        creditsWei: creditsWei.toString(),
      });
      return json(
        { state: "unavailable", error: "Card claims are temporarily unavailable. Please try again later." },
        503,
      );
    }
    if (claimError) {
      throw claimError;
    }
    if (!claimed) {
      // Lost a race with another claim, or the campaign was deactivated in between.
      return json({ state: "claimed", error: "This card was already claimed" }, 409);
    }

    let card = claimed;
    try {
      card = await deliverClaimedCard(claimed);
    } catch (error) {
      // The claim stands; `scheduled-credit-cards-transfer` picks the card up.
      console.error("claim-credit-card: delivery deferred", error);
    }

    return json({ state: "claimed", data: { ...serializeClaimedCard(card), campaignName: campaign.name } }, 200);
  } catch (error) {
    console.error("claim-credit-card error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};
