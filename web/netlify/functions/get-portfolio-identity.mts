import { type Address, isAddress } from "viem";
import { resolvePortfolioIdentity } from "./utils/portfolioIdentity";

/**
 * The wallets a profile really covers: the account plus the TradeExecutor contracts it owns.
 *
 * Exists so the profile header can name them even when they currently hold nothing and produced no
 * history rows — deriving the list from the positions and activity responses would only ever show
 * the executors that happen to have data right now.
 */
export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const accountParam = url.searchParams.get("account");
    if (!accountParam || !isAddress(accountParam)) {
      return new Response(JSON.stringify({ error: "Account parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const identity = await resolvePortfolioIdentity(accountParam as Address);
    const executors = identity.wallets.filter((wallet) => wallet !== identity.account);

    return new Response(JSON.stringify({ account: identity.account, executors }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Deployment is a one-way event and the probe is cheap; a short edge cache is plenty.
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
