import { type CreditCardRow, advanceCard, supabase } from "./utils/creditCards";

// Claims deliver inline; give that a head start before the sweeper touches a fresh card.
const CLAIM_GRACE_MS = 30_000;
// Scheduled functions are cut off at 30s.
const RUN_BUDGET_MS = 20_000;

export default async () => {
  const startedAt = Date.now();

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .or("status.in.(pending,sent),drip_status.in.(pending,sent)")
    .lt("claimed_at", new Date(startedAt - CLAIM_GRACE_MS).toISOString())
    // Every attempt bumps `updated_at`, so cards that keep failing rotate to the back instead of starving the rest.
    .order("updated_at", { ascending: true })
    .limit(25);
  if (error) {
    console.error("scheduled-credit-cards-transfer: query failed", error);
    return;
  }

  const cards = (data ?? []) as CreditCardRow[];
  if (cards.length === 0) {
    return;
  }
  console.log(`scheduled-credit-cards-transfer: ${cards.length} cards to advance`);

  // Sequential on purpose: every send takes the distributor's next nonce.
  for (const card of cards) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
      break;
    }
    try {
      const advanced = await advanceCard(card);
      if (advanced.status !== card.status || advanced.drip_status !== card.drip_status) {
        console.log(
          `card ${card.serial}: credits ${card.status} -> ${advanced.status}, drip ${card.drip_status} -> ${advanced.drip_status}`,
        );
      }
    } catch (advanceError) {
      console.error(`scheduled-credit-cards-transfer: card ${card.serial} failed`, advanceError);
    }
  }
};

export const config = {
  schedule: "* * * * *",
};
