import { MarketDataMapping, getMappings } from "@/hooks/portfolio/getMappings";
import { SupportedChain } from "@/lib/chains";
import { getBlock } from "@wagmi/core";
import { Address } from "viem";
import { config } from "./utils/config";
import { searchMarkets } from "./utils/markets";
import { getLiquidityEvents } from "./utils/transactions/getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./utils/transactions/getLiquidityWithdrawEvents";
import { getSplitMergeRedeemEvents } from "./utils/transactions/getSplitMergeRedeemEvents";
import { getSwapEvents } from "./utils/transactions/getSwapEvents";

async function getBlockTimestamp(initialBlockNumber: number) {
  let blockNumber = initialBlockNumber;
  const maxAttempts = 10; // Limit the number of attempts
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const block = await getBlock(config, { blockNumber: BigInt(blockNumber) });
      if (block.timestamp) {
        return Number(block.timestamp);
      }
      // Increment block number and attempts
      blockNumber++;
      attempts++;
    } catch (error) {
      blockNumber++;
      attempts++;
    }
  }
}

async function getEvents(
  mappings: MarketDataMapping,
  account: Address,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
) {
  const events = await Promise.all([
    getSwapEvents(mappings, account, chainId, startTime, endTime),
    getLiquidityEvents(mappings, account, chainId, startTime, endTime),
    getLiquidityWithdrawEvents(mappings, account, chainId, startTime, endTime),
    getSplitMergeRedeemEvents(account, chainId),
  ]);
  return events.flat();
}

async function getTransactions(account: Address, chainId: SupportedChain, startTime?: number, endTime?: number) {
  const { markets } = await searchMarkets([chainId]);

  if (markets.length === 0) {
    return [];
  }

  const mappings = await getMappings(markets, chainId);

  const { tokenIdToTokenSymbolMapping } = mappings;

  const data = await getEvents(mappings, account, chainId, startTime, endTime);

  // get timestamp
  const timestamps = await Promise.all(data.map((x) => x.timestamp ?? getBlockTimestamp(x.blockNumber)));

  return data
    .map((x, index) => {
      function parseSymbol(tokenAddress?: string) {
        return tokenAddress ? tokenIdToTokenSymbolMapping[tokenAddress.toLocaleLowerCase()] : undefined;
      }
      return {
        ...x,
        timestamp: timestamps[index],
        collateralSymbol: parseSymbol(x.collateral),
        token0Symbol: x.token0Symbol ?? parseSymbol(x.token0),
        token1Symbol: x.token1Symbol ?? parseSymbol(x.token1),
        tokenInSymbol: x.tokenInSymbol ?? parseSymbol(x.tokenIn),
        tokenOutSymbol: x.tokenOutSymbol ?? parseSymbol(x.tokenOut),
      };
    })
    .sort((a, b) => b.blockNumber - a.blockNumber);
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const account = url.searchParams.get("account");
    const chainId = url.searchParams.get("chainId");
    const startTime = url.searchParams.get("startTime");
    const endTime = url.searchParams.get("endTime");

    // Validate required parameters
    if (!account) {
      return new Response(JSON.stringify({ error: "Account parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!chainId) {
      return new Response(JSON.stringify({ error: "ChainId parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Convert startTime and endTime to numbers if present
    const startTimeNum = startTime ? Number.parseInt(startTime, 10) : undefined;
    const endTimeNum = endTime ? Number.parseInt(endTime, 10) : undefined;

    // Validate that startTime and endTime are valid numbers if present
    if (startTime && Number.isNaN(startTimeNum!)) {
      return new Response(JSON.stringify({ error: "startTime must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (endTime && Number.isNaN(endTimeNum!)) {
      return new Response(JSON.stringify({ error: "endTime must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Convert chainId to number and validate it's a supported chain
    const chainIdNum = Number.parseInt(chainId, 10);
    if (Number.isNaN(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const transactions = await getTransactions(
      account as Address,
      chainIdNum as SupportedChain,
      startTimeNum,
      endTimeNum,
    );

    return new Response(JSON.stringify(transactions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
