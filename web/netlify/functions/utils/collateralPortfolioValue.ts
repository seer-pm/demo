import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, getPrimaryCollateralAddress } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { ConditionalEvent_OrderBy, OrderDirection, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import { type Address, formatUnits } from "viem";

const PAGE_SIZE = 1000;

function signedWeiForConditionalEvent(type: string, amountWei: bigint): bigint {
  switch (type) {
    case "split":
      return -amountWei;
    case "merge":
    case "redeem":
      return amountWei;
    default:
      return 0n;
  }
}

async function fetchConditionalProtocolFlowsUpToEnd(
  account: Address,
  chainId: SupportedChain,
  primaryCollateral: Address,
  endTime: number,
): Promise<{ signedWei: bigint; timestamp: number }[]> {
  const client = graphQLClient(chainId);
  if (!client) {
    throw new Error("Subgraph not available for chain");
  }

  const sdk = getSeerSdk(client);
  const flows: { signedWei: bigint; timestamp: number }[] = [];

  let skip = 0;
  for (;;) {
    const { conditionalEvents } = await sdk.GetConditionalEvents({
      first: PAGE_SIZE,
      skip,
      orderBy: ConditionalEvent_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
      where: {
        accountId: account,
        collateral: primaryCollateral.toLowerCase() as Address,
        timestamp_lte: String(endTime),
        type_in: ["split", "merge", "redeem"],
      },
    });

    for (const ev of conditionalEvents) {
      const signed = signedWeiForConditionalEvent(ev.type, BigInt(ev.amount));
      if (signed !== 0n) {
        flows.push({ signedWei: signed, timestamp: Number(ev.timestamp) });
      }
    }

    if (conditionalEvents.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return flows;
}

function cumulativeSignedWeiUpTo(flows: { signedWei: bigint; timestamp: number }[], timestampMax: number): bigint {
  let sum = 0n;
  for (const row of flows) {
    if (row.timestamp > timestampMax) continue;
    sum += row.signedWei;
  }
  return sum;
}

/**
 * Protocol collateral flows from the Seer subgraph (`ConditionalEvent`): split / merge / redeem only, primary collateral token.
 * Cumulative signed wei up to `endTime` and `startTime` yield `valueEnd` / `valueStart` in primary token human units (e.g. sDAI on Gnosis).
 */
export async function computeCollateralPortfolioValuesForPeriod(
  account: Address,
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
): Promise<{ valueEnd: number; valueStart: number }> {
  let primaryToken: Address;
  try {
    primaryToken = getPrimaryCollateralAddress(chainId);
  } catch {
    return { valueEnd: 0, valueStart: 0 };
  }

  const decimals = COLLATERAL_TOKENS[chainId]?.primary.decimals ?? 18;

  const flows = await fetchConditionalProtocolFlowsUpToEnd(account, chainId, primaryToken, endTime);

  const weiEnd = cumulativeSignedWeiUpTo(flows, endTime);
  const weiStart = cumulativeSignedWeiUpTo(flows, startTime);

  return {
    valueEnd: Number(formatUnits(weiEnd, decimals)),
    valueStart: Number(formatUnits(weiStart, decimals)),
  };
}
