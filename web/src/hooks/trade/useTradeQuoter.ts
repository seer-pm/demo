import { tradeQuoterAbi, tradeQuoterAddress } from "@/hooks/contracts/generated-trade-manager";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { getAccount, readContracts, simulateContract } from "@wagmi/core";
import { Address, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { marketAbi } from "../contracts/generated-market-factory";

const chainId = gnosis.id;

export interface TradeManagerTokenPath {
  tokenIn: Address;
  tokenOut: Address;
  tokenInMarket: Address;
  tokenOutMarket: Address;
  choice: number;
}

async function quoteSwapSingle(
  amountIn: bigint,
  {
    tokenIn,
    tokenOut,
    tokenInMarket,
    tokenOutMarket,
  }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
) {
  try {
    const { connector } = getAccount(config);
    const { result } = await simulateContract(config, {
      address: tradeQuoterAddress[chainId],
      abi: tradeQuoterAbi,
      functionName: "quoteSwapSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          tokenInMarket,
          tokenOutMarket,
          amountIn,
        },
      ],
      chainId,
      connector,
    });
    return result[0];
  } catch (e) {
    return 0n;
  }
}

async function quoteMintSingle(
  amountIn: bigint,
  {
    tokenIn,
    tokenOut,
    tokenInMarket,
    tokenOutMarket,
  }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
) {
  try {
    const { connector } = getAccount(config);
    const { result } = await simulateContract(config, {
      address: tradeQuoterAddress[chainId],
      abi: tradeQuoterAbi,
      functionName: "quoteMintSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          tokenInMarket,
          tokenOutMarket,
          amountIn,
        },
      ],
      chainId,
      connector,
    });
    return result[0];
  } catch (e) {
    return 0n;
  }
}

async function quoteTradeSingleAndCompare(
  amountIn: bigint,
  {
    tokenIn,
    tokenOut,
    tokenInMarket,
    tokenOutMarket,
  }: { tokenIn: Address; tokenOut: Address; tokenInMarket: Address; tokenOutMarket: Address },
) {
  const [amountOutSwap, amountOutMint] = await Promise.all([
    quoteSwapSingle(amountIn, { tokenIn, tokenOut, tokenInMarket, tokenOutMarket }),
    quoteMintSingle(amountIn, { tokenIn, tokenOut, tokenInMarket, tokenOutMarket }),
  ]);
  if (amountOutSwap === 0n && amountOutMint === 0n) {
    throw {
      message: "Not enough liquidity to trade.",
    };
  }

  return {
    choice: amountOutSwap > amountOutMint ? 0 : 1,
    amountOut: amountOutSwap > amountOutMint ? amountOutSwap : amountOutMint,
  };
}

async function readMarket(marketId: Address) {
  const [currentMarketAddress, [currentToken]] = await readContracts(config, {
    contracts: [
      {
        abi: marketAbi,
        address: marketId,
        functionName: "parentMarket",
        chainId,
      },
      {
        abi: marketAbi,
        address: marketId,
        functionName: "parentWrappedOutcome",
        chainId,
      },
    ],
    allowFailure: false,
  });

  return { currentMarketAddress, currentToken };
}

async function getTradePaths(
  marketId: Address,
  outcomeToken: Address,
  mainToken: Address,
  initialAmountIn: bigint,
  isBuy: boolean,
) {
  let amountIn = initialAmountIn;
  const ancestorMarkets: { marketId: string; token: string }[] = [{ marketId, token: outcomeToken }];
  let { currentMarketAddress, currentToken } = await readMarket(marketId);

  while (currentMarketAddress !== zeroAddress) {
    ancestorMarkets.push({ marketId: currentMarketAddress, token: currentToken });
    const result = await readMarket(currentMarketAddress);

    currentMarketAddress = result.currentMarketAddress;
    currentToken = result.currentToken;
  }
  ancestorMarkets.push({
    marketId: zeroAddress,
    token: mainToken,
  });
  if (isBuy) {
    ancestorMarkets.reverse();
  }
  const paths: TradeManagerTokenPath[] = [];
  const amountIns = [amountIn];
  // static call each step -> get result to use in the next step + trade choice
  for (let i = 0; i < ancestorMarkets.length - 1; i++) {
    const tokenInData = ancestorMarkets[i];
    const tokenOutData = ancestorMarkets[i + 1];
    const { amountOut, choice } = await quoteTradeSingleAndCompare(amountIn, {
      tokenIn: tokenInData.token as Address,
      tokenOut: tokenOutData.token as Address,
      tokenInMarket: tokenInData.marketId as Address,
      tokenOutMarket: tokenOutData.marketId as Address,
    });
    amountIn = amountOut;
    paths.push({
      tokenIn: tokenInData.token as Address,
      tokenOut: tokenOutData.token as Address,
      tokenInMarket: tokenInData.marketId as Address,
      tokenOutMarket: tokenOutData.marketId as Address,
      choice,
    });
    amountIns.push(amountOut);
  }
  return { paths, amountOut: amountIns[amountIns.length - 1], amountIns };
}

export function useTradeQuoter(
  marketId: Address,
  outcomeToken: Address,
  mainToken: Address,
  amountIn: bigint,
  isBuy: boolean,
) {
  return useQuery<{ paths: TradeManagerTokenPath[]; amountOut: bigint; amountIns: bigint[] } | undefined, Error>({
    queryKey: ["useTradeQuoter", marketId, outcomeToken, String(amountIn), mainToken, isBuy],
    enabled: Number(amountIn) > 0,
    retry: false,
    queryFn: async () => getTradePaths(marketId, outcomeToken, mainToken, amountIn, isBuy),
  });
}
