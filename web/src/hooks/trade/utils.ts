import { SupportedChain, filterChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { OrderBookApi, OrderStatus } from "@cowprotocol/cow-sdk";
import { CoWTrade, Token as SwaprToken, SwaprV3Trade, TokenAmount, UniswapTrade } from "@swapr/sdk";
import { ethers, providers } from "ethers";
import { Account, Address, Chain, Client, TransactionReceipt, Transport, encodeFunctionData } from "viem";
import { getMaximumAmountIn } from ".";
import { creditsManagerAbi, creditsManagerAddress } from "../contracts/generated-trading-credits";
import { approveTokens } from "../useApproveTokens";
import { Execution } from "../useCheck7702Support";
import { fetchNeededApprovals } from "../useMissingApprovals";

export function setSwaprTradeLimit(trade: SwaprV3Trade, newInputValue: bigint) {
  const primaryCollateralAddress = COLLATERAL_TOKENS[filterChain(trade.chainId)].primary.address;
  if (BigInt(trade.inputAmount.raw.toString()) > newInputValue) {
    const newInputAmount = new TokenAmount(
      new SwaprToken(
        trade.chainId,
        trade.inputAmount.currency.address ?? primaryCollateralAddress,
        trade.inputAmount.currency.decimals,
        trade.inputAmount.currency.symbol,
      ),
      newInputValue,
    );
    return new SwaprV3Trade({
      maximumSlippage: trade.maximumSlippage,
      inputAmount: newInputAmount,
      outputAmount: trade.outputAmount,
      tradeType: trade.tradeType,
      chainId: trade.chainId,
      priceImpact: trade.priceImpact,
      fee: trade.fee,
    });
  }
  return trade;
}

export async function setUniswapTradeLimit(trade: UniswapTrade, newInputValue: bigint, account: string) {
  const primaryCollateralAddress = COLLATERAL_TOKENS[filterChain(trade.chainId)].primary.address;
  if (BigInt(trade.inputAmount.raw.toString()) > newInputValue) {
    const newInputAmount = new TokenAmount(
      new SwaprToken(
        trade.chainId,
        trade.inputAmount.currency.address ?? primaryCollateralAddress,
        trade.inputAmount.currency.decimals,
        trade.inputAmount.currency.symbol,
      ),
      newInputValue,
    );
    const newQuoteTradeResult = await UniswapTrade.getQuote({
      amount: newInputAmount,
      quoteCurrency: trade.outputAmount.currency,
      maximumSlippage: trade.maximumSlippage,
      recipient: account,
      tradeType: trade.tradeType,
    });
    return newQuoteTradeResult ?? trade;
  }
  return trade;
}

export async function setCowTradeLimit(trade: CoWTrade, newInputValue: bigint, account: string) {
  const primaryCollateralAddress = COLLATERAL_TOKENS[filterChain(trade.chainId)].primary.address;
  if (BigInt(trade.inputAmount.raw.toString()) > newInputValue) {
    const newInputAmount = new TokenAmount(
      new SwaprToken(
        trade.chainId,
        trade.inputAmount.currency.address ?? primaryCollateralAddress,
        trade.inputAmount.currency.decimals,
        trade.inputAmount.currency.symbol,
      ),
      newInputValue,
    );
    const newQuoteTradeResult = await CoWTrade.bestTradeExactIn({
      currencyAmountIn: newInputAmount,
      currencyOut: trade.outputAmount.currency,
      maximumSlippage: trade.maximumSlippage,
      user: account,
      receiver: account,
    });
    return newQuoteTradeResult ?? trade;
  }
  return trade;
}

export function getConvertedShares(receipt: TransactionReceipt) {
  try {
    const depositEventTopic = ethers.utils.id("Deposit(address,address,uint256,uint256)");
    const depositLog = receipt.logs.find((log) => log.topics[0] === depositEventTopic);
    if (depositLog) {
      const [_, shares] = new ethers.utils.AbiCoder().decode(["uint256", "uint256"], depositLog.data);
      return shares ? BigInt(shares) : undefined;
    }
  } catch (e) {}
}

export async function pollForOrder(orderId: string, chainId: number, maxAttempts = 7, initialInterval = 1000) {
  const orderBookApi = new OrderBookApi({ chainId });
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await orderBookApi.getOrder(orderId);
      switch (order.status) {
        case OrderStatus.FULFILLED: {
          return {};
        }
        case OrderStatus.EXPIRED: {
          return { error: "Swap expired" };
        }
        case OrderStatus.CANCELLED: {
          return { error: "Swap cancelled" };
        }
      }
      // biome-ignore lint/suspicious/noExplicitAny:
    } catch (e: any) {
      if (e?.body?.errorType !== "NotFound") {
        return { error: e?.message || e };
      }
    }
    const backoffTime = initialInterval * 2 ** i;
    const jitter = Math.round(Math.random() * 1000); // Add some randomness to prevent synchronized retries
    await new Promise((resolve) => setTimeout(resolve, backoffTime + jitter));
  }
  return {
    error: "Get order timeout",
  };
}

export async function approveIfNeeded(
  tokensAddress: Address,
  account: Address,
  spender: Address,
  amount: bigint,
  chainId: SupportedChain,
) {
  const missingApprovals = await fetchNeededApprovals([tokensAddress], account, spender, [amount], chainId);
  if (missingApprovals.length > 0) {
    await approveTokens({
      amount,
      tokenAddress: tokensAddress,
      spender: spender,
    });
  }
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export function getWrappedSeerCreditsExecution(
  isSeerCredits: boolean,
  trade: SwaprV3Trade | UniswapTrade,
  tradeExecution: Execution,
): Execution {
  if (!isSeerCredits) {
    return tradeExecution;
  }

  const executeData = encodeFunctionData({
    abi: creditsManagerAbi,
    functionName: "execute",
    args: [
      tradeExecution.to,
      tradeExecution.data,
      getMaximumAmountIn(trade),
      trade.outputAmount.currency.address! as Address,
    ],
  });

  return {
    to: creditsManagerAddress[trade.chainId as keyof typeof creditsManagerAddress],
    data: executeData,
    value: 0n,
  };
}
