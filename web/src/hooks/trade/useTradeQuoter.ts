import { tradeQuoterAbi, tradeQuoterAddress } from "@/hooks/contracts/generated-trade-manager";
import { SupportedChain } from "@/lib/chains";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult } from "@/lib/trade";
import { NATIVE_TOKEN, isTwoStringsEqual, parseFraction } from "@/lib/utils";
import { config } from "@/wagmi";
import { ChainId, CurrencyAmount, Percent, Token as SwaprToken, TokenAmount } from "@swapr/sdk";
import { useQuery } from "@tanstack/react-query";
import { getAccount, readContracts, simulateContract } from "@wagmi/core";
import { Address, parseUnits, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { marketAbi } from "../contracts/generated-market-factory";
import { TradeManagerTrade } from "./TradeManagerTrade";

const chainId = gnosis.id;

export interface TradeManagerTokenPath {
  tokenIn: Address;
  tokenOut: Address;
  tokenInMarket: Address;
  tokenOutMarket: Address;
  choice: number;
}

export type TradeQuoterResult = { paths: TradeManagerTokenPath[]; amountOut: bigint; amountIns: bigint[] };

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
  outcomeToken: Token,
  collateralToken: Token,
  enabled: boolean,
  chainId: SupportedChain,
  swapType: "buy" | "sell",
  amount: string,
  maxSlippage: string,
) {
  return useQuery<QuoteTradeResult | undefined, Error>({
    queryKey: [
      "useTradeQuoter",
      marketId,
      outcomeToken.address,
      collateralToken.address,
      swapType,
      chainId,
      amount,
      maxSlippage,
    ],
    enabled: enabled && Number(amount) > 0,
    retry: false,
    queryFn: async () => {
      // Calculate amountIn based on swapType
      const isBuy = swapType === "buy";
      const sellTokenForAmount = isBuy ? collateralToken : outcomeToken;
      const amountIn = parseUnits(amount || "0", sellTokenForAmount.decimals);

      const tradeQuoterData = await getTradePaths(
        marketId,
        outcomeToken.address,
        collateralToken.address,
        amountIn,
        isBuy,
      );
      const [buyToken, sellToken] =
        swapType === "buy" ? [outcomeToken, collateralToken] : [collateralToken, outcomeToken];

      // Create CurrencyAmount for input and output
      const sellTokenSwapr: SwaprToken = isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)
        ? (SwaprToken.getNative(chainId as ChainId) as SwaprToken)
        : new SwaprToken(chainId as ChainId, sellToken.address, sellToken.decimals, sellToken.symbol);
      const buyTokenSwapr: SwaprToken = isTwoStringsEqual(buyToken.address, NATIVE_TOKEN)
        ? (SwaprToken.getNative(chainId as ChainId) as SwaprToken)
        : new SwaprToken(chainId as ChainId, buyToken.address, buyToken.decimals, buyToken.symbol);

      const inputAmount = isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)
        ? CurrencyAmount.nativeCurrency(amountIn, chainId)
        : new TokenAmount(sellTokenSwapr, amountIn);

      const outputAmount = isTwoStringsEqual(buyToken.address, NATIVE_TOKEN)
        ? CurrencyAmount.nativeCurrency(tradeQuoterData.amountOut, chainId)
        : new TokenAmount(buyTokenSwapr, tradeQuoterData.amountOut);
      // Parse maxSlippage to Percent
      // maxSlippage is a percentage string (e.g., "1" for 1%)
      // Convert to fraction: 1% = 1/100
      const slippage = String(Number(maxSlippage) / 100);
      const [numerator, denominator] = parseFraction(slippage) ?? [];
      const maximumSlippage =
        Number.isInteger(numerator) && Number.isInteger(denominator)
          ? new Percent(String(numerator), String(denominator))
          : new Percent("1", "100");
      const tradeManagerTrade = new TradeManagerTrade({
        inputAmount,
        outputAmount,
        chainId: chainId as ChainId,
        maximumSlippage,
        paths: tradeQuoterData.paths,
        amountOut: tradeQuoterData.amountOut,
      });

      return {
        value: tradeQuoterData.amountOut,
        decimals: swapType === "buy" ? outcomeToken.decimals : collateralToken.decimals,
        buyToken: buyToken.address,
        sellToken: sellToken.address,
        sellAmount: amountIn.toString(),
        swapType,
        trade: tradeManagerTrade,
      };
    },
  });
}
