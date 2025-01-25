import {
  CoWTrade,
  CurrencyAmount,
  DAI,
  Percent,
  Token as SwaprToken,
  SwaprV3Trade,
  TokenAmount,
  Trade,
  TradeType,
  UniswapTrade,
  WXDAI,
} from "@swapr/sdk";
import { readContract } from "@wagmi/core";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { gnosis } from "viem/chains";
import { config } from "./config.ts";
import { Token } from "../../../src/lib/tokens.ts";
import { isTwoStringsEqual, NATIVE_TOKEN } from "../../../src/lib/utils.ts";
import { SupportedChain } from "../../../src/lib/chains.ts";
import { COLLATERAL_TOKENS } from "@/lib/config.ts";

const SDAI_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "convertToAssets",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
    ],
    name: "convertToShares",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "redeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function iswxsDAI(token: Token, chainId: number) {
  return (
    isTwoStringsEqual(token.address, COLLATERAL_TOKENS[chainId].primary.address) || // sDAI
    (chainId === gnosis.id && isTwoStringsEqual(token.address, NATIVE_TOKEN)) || // xDAI
    isTwoStringsEqual(token.address, WXDAI[chainId]?.address) || // wxDAI
    isTwoStringsEqual(token.address, DAI[chainId]?.address)
  );
}

export async function convertToSDAI({ chainId, amount }: { chainId: SupportedChain; amount: bigint }) {
  return readContract(config, {
    address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
    abi: SDAI_ABI,
    functionName: "convertToShares",
    args: [amount],
    chainId: chainId,
  });
}

async function convertCollateralToShares(
  chainId: number,
  amount: string,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  const sDAI = COLLATERAL_TOKENS[chainId].primary;
  if (swapType === "sell" || (swapType === "buy" && isTwoStringsEqual(collateralToken.address, sDAI.address))) {
    return { amount, collateralToken: sDAI };
  }

  const newAmount = await convertToSDAI({
    amount: parseUnits(String(amount), collateralToken.decimals),
    chainId: chainId as SupportedChain,
  });
  return { amount: formatUnits(newAmount, sDAI.decimals), collateralToken: sDAI };
}

async function getTradeArgs(
  chainId: number,
  initialAmount: string,
  outcomeToken: Token,
  initialCollateralToken: Token,
  swapType: "buy" | "sell",
) {
  // convert wxdai,xdai or dai to sDAI
  const { amount, collateralToken } = iswxsDAI(initialCollateralToken, chainId)
    ? await convertCollateralToShares(chainId, initialAmount, initialCollateralToken, swapType)
    : { amount: initialAmount, collateralToken: initialCollateralToken };
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const currencyIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
  const currencyOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);

  const currencyAmountIn = new TokenAmount(currencyIn, parseUnits(String(amount), currencyIn.decimals));

  const maximumSlippage = new Percent("1", "100");

  return {
    buyToken,
    sellToken,
    sellAmount,
    currencyIn,
    currencyOut,
    currencyAmountIn,
    maximumSlippage,
  };
}

function getUniswapTrade(
  _currencyIn: SwaprToken,
  currencyOut: SwaprToken,
  currencyAmountIn: TokenAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<UniswapTrade | null> {
  return UniswapTrade.getQuote({
    amount: currencyAmountIn,
    quoteCurrency: currencyOut,
    maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_INPUT,
  });
}

function getSwaprTrade(
  _currencyIn: SwaprToken,
  currencyOut: SwaprToken,
  currencyAmountIn: TokenAmount,
  maximumSlippage: Percent,
  account: Address | undefined,
  _chainId: number,
): Promise<SwaprV3Trade | null> {
  return SwaprV3Trade.getQuote({
    amount: currencyAmountIn,
    quoteCurrency: currencyOut,
    maximumSlippage,
    recipient: account || zeroAddress,
    tradeType: TradeType.EXACT_INPUT,
  });
}

export const getUniswapQuote = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

  const trade = await getUniswapTrade(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountIn,
    args.maximumSlippage,
    account,
    chainId,
  );
  if (!trade) {
    throw new Error("No route found");
  }

  return {
    value: BigInt(trade.outputAmount.raw.toString()),
    decimals: args.sellToken.decimals,
    trade,
    buyToken: args.buyToken.address,
    sellToken: args.sellToken.address,
    sellAmount: args.sellAmount.toString(),
    swapType,
  };
};

export const getSwaprQuote = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  const args = await getTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

  const trade = await getSwaprTrade(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountIn,
    args.maximumSlippage,
    account,
    chainId,
  );

  if (!trade) {
    throw new Error("No route found");
  }

  return {
    value: BigInt(trade.outputAmount.raw.toString()),
    decimals: args.sellToken.decimals,
    trade,
    buyToken: args.buyToken.address,
    sellToken: args.sellToken.address,
    sellAmount: args.sellAmount.toString(),
    swapType,
  };
};

async function getCowTradeArgs(
  chainId: number,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) {
  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const sellAmount = parseUnits(String(amount), sellToken.decimals);

  const currencyIn = new SwaprToken(chainId, sellToken.address, sellToken.decimals, sellToken.symbol);
  const currencyOut = new SwaprToken(chainId, buyToken.address, buyToken.decimals, buyToken.symbol);
  let currencyAmountIn: CurrencyAmount;
  if (isTwoStringsEqual(sellToken.address, NATIVE_TOKEN)) {
    currencyAmountIn = CurrencyAmount.nativeCurrency(parseUnits(String(amount), currencyIn.decimals), chainId);
  } else {
    currencyAmountIn = new TokenAmount(currencyIn, parseUnits(String(amount), currencyIn.decimals));
  }

  const maximumSlippage = new Percent("1", "100");

  return {
    buyToken,
    sellToken,
    sellAmount,
    currencyIn,
    currencyOut,
    currencyAmountIn,
    maximumSlippage,
  };
}

export const getCowQuote = async (
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  const args = await getCowTradeArgs(chainId, amount, outcomeToken, collateralToken, swapType);

  const trade = await CoWTrade.bestTradeExactIn({
    currencyAmountIn: args.currencyAmountIn,
    currencyOut: args.currencyOut,
    maximumSlippage: args.maximumSlippage,
    user: account || zeroAddress,
    receiver: account || zeroAddress,
  });

  if (!trade) {
    throw new Error("No route found");
  }

  return {
    value: BigInt(trade.outputAmount.raw.toString()),
    decimals: args.sellToken.decimals,
    trade,
    buyToken: args.buyToken.address,
    sellToken: args.sellToken.address,
    sellAmount: args.sellAmount.toString(),
    swapType,
  };
};
