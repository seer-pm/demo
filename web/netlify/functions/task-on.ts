import { gnosis } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { getPrimaryCollateralAddress } from "@seer-pm/sdk/collateral";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import { swaprGraphQLClient } from "@seer-pm/sdk/subgraph";
import { OrderDirection, Swap_OrderBy, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";
import { searchAllMarkets } from "./utils/markets";
import { getMappings } from "./utils/portfolio";

/** Only count swaps strictly after this Unix timestamp (seconds). */
const MIN_SWAP_TIMESTAMP = 1776773809;

/**
 * Subgraph Swap amounts are signed decimal strings (token units), e.g. '-0.2286...', '0.1'.
 * Volume is the absolute amount on the primary-collateral side.
 */
function absTokenUnitsFromSubgraph(amountStr: string): number {
  return Math.abs(Number.parseFloat(amountStr.trim()));
}

/** Sum absolute primary-collateral amount (human token units, not wei). */
function addPrimaryCollateralAmount(
  primaryLower: string,
  swap: {
    amount0: string;
    amount1: string;
    token0: { id: string; decimals: string };
    token1: { id: string; decimals: string };
  },
  sum: number,
): number {
  const id0 = swap.token0.id.toLowerCase();
  const id1 = swap.token1.id.toLowerCase();

  if (id0 === primaryLower) {
    return sum + absTokenUnitsFromSubgraph(swap.amount0);
  }
  if (id1 === primaryLower) {
    return sum + absTokenUnitsFromSubgraph(swap.amount1);
  }

  return sum;
}

async function fetchSeerOutcomePrimaryCollateralVolume(account: Address): Promise<number> {
  const chainId = gnosis.id as SupportedChain;

  const { markets } = await searchAllMarkets({ chainIds: [chainId] });

  if (markets.length === 0) {
    return 0;
  }

  const { outcomeTokenToCollateral } = await getMappings(markets, chainId);
  if (outcomeTokenToCollateral.size === 0) {
    return 0;
  }

  const primaryAddr = getPrimaryCollateralAddress(chainId).toLowerCase();

  const poolPairs = Array.from(outcomeTokenToCollateral, ([outcomeToken, collateralToken]) =>
    getToken0Token1(outcomeToken, collateralToken),
  ).filter((pair) => pair.token0.toLowerCase() === primaryAddr || pair.token1.toLowerCase() === primaryAddr);

  if (poolPairs.length === 0) {
    return 0;
  }

  const poolOrFilters = poolPairs.map((pair) => ({ pool_: pair }));

  const graphQLClient = swaprGraphQLClient(chainId, "algebra");
  if (!graphQLClient) {
    throw new Error("Swapr subgraph not available for this chain");
  }

  const sdk = getSwaprSdk(graphQLClient);
  let timestamp: string | undefined;
  let volumeInTokenUnits = 0;

  const recipient = account.toLowerCase() as Address;

  while (true) {
    const data = await sdk.GetSwaps({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny: SDK enum typing
      orderBy: Swap_OrderBy.Timestamp as any,
      // biome-ignore lint/suspicious/noExplicitAny: SDK enum typing
      orderDirection: OrderDirection.Desc as any,
      where: {
        and: [
          {
            or: poolOrFilters,
          },
          {
            recipient,
            timestamp_gte: MIN_SWAP_TIMESTAMP.toString(),
            ...(timestamp ? { timestamp_lt: timestamp } : {}),
          },
        ],
      },
    });

    const swaps = data.swaps;
    for (const swap of swaps) {
      volumeInTokenUnits = addPrimaryCollateralAmount(primaryAddr, swap, volumeInTokenUnits);
    }

    if (swaps.length === 0 || swaps[swaps.length - 1]?.timestamp === timestamp) {
      break;
    }

    timestamp = swaps[swaps.length - 1]?.timestamp;

    if (swaps.length < 1000) {
      break;
    }
  }

  return volumeInTokenUnits;
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("address");

    if (!raw) {
      return new Response(JSON.stringify({ error: "address query parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAddress(raw)) {
      return new Response(JSON.stringify({ error: "Invalid address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const account = getAddress(raw);
    const primaryVolume = await fetchSeerOutcomePrimaryCollateralVolume(account);

    return new Response(
      JSON.stringify({
        result: {
          point: Math.floor(primaryVolume),
          sinceTimestamp: MIN_SWAP_TIMESTAMP,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    console.error(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
