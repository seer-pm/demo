import { tradeQuoterAbi, tradeQuoterAddress } from "@/hooks/contracts/generated-trade-manager";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { getAccount, simulateContract } from "@wagmi/core";
import { ethers } from "ethers";
import { Address, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { marketAbi } from "../contracts/generated-market-factory";

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
      address: tradeQuoterAddress[gnosis.id],
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
      chainId: gnosis.id,
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
      address: tradeQuoterAddress[gnosis.id],
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
      chainId: gnosis.id,
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

async function getTradePaths(
  marketId: string,
  outcomeTokenAddress: string,
  initialAmountIn: bigint,
  isUseXDai: boolean,
  isBuy: boolean,
) {
  let amountIn = initialAmountIn;
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const market = new ethers.Contract(marketId, marketAbi, provider);
  const ancestorMarkets: { marketId: string; token: string }[] = [
    { marketId: market.address, token: outcomeTokenAddress },
  ];
  let currentMarketAddress = await market.parentMarket();
  let [currentToken] = await market.parentWrappedOutcome();
  while (currentMarketAddress !== zeroAddress) {
    ancestorMarkets.push({ marketId: currentMarketAddress, token: currentToken });
    currentMarketAddress = await new ethers.Contract(currentMarketAddress, marketAbi, provider).parentMarket();
    currentToken = (await market.parentWrappedOutcome())[0];
  }
  ancestorMarkets.push({
    marketId: zeroAddress,
    token: isUseXDai ? NATIVE_TOKEN : COLLATERAL_TOKENS[gnosis.id].primary.address,
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
  marketId: string,
  outcomeTokenAddress: string,
  amountIn: bigint,
  isUseXDai: boolean,
  isBuy: boolean,
) {
  return useQuery<{ paths: TradeManagerTokenPath[]; amountOut: bigint; amountIns: bigint[] } | undefined, Error>({
    queryKey: ["useTradeQuoter", marketId, outcomeTokenAddress, Number(amountIn), isUseXDai, isBuy],
    enabled: Number(amountIn) > 0,
    retry: false,
    queryFn: async () => getTradePaths(marketId, outcomeTokenAddress, amountIn, isUseXDai, isBuy),
  });
}
