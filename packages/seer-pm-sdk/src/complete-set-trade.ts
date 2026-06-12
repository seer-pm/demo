/**
 * Complete-set composite trade execution: mint+sell and buy+merge in one batch or sequential txs.
 */

import { SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import type { Address, Client } from "viem";
import { sendTransaction } from "viem/actions";
import { fetchNeededApprovals, getApprovals7702 } from "./approvals";
import type { SupportedChain } from "./chains";
import { buildSwaprTradeExecution, buildUniswapTradeExecution, getTradeApprovals7702 } from "./execute-trade";
import type { Execution } from "./execution";
import { getMergeExecution } from "./merge-positions";
import { getRouterAddress } from "./router-addresses";
import { getSplitExecution } from "./split-position";
import type { TradeTokensProps } from "./trade-utils";
import { getMaximumAmountIn } from "./trade-utils";

type ValidatedCompleteSetTrade = {
  completeSetLeg: NonNullable<TradeTokensProps["completeSetLeg"]>;
  trade: SwaprV3Trade | UniswapTrade;
  swapSpender: Address;
} & ({ route: "mintSell"; splitAmount: bigint } | { route: "buyMerge"; mergeAmount: bigint; maxBuyIn: bigint });

function getValidatedMaximumAmountIn(trade: SwaprV3Trade | UniswapTrade): bigint {
  let maxBuyIn: bigint;
  try {
    maxBuyIn = getMaximumAmountIn(trade);
  } catch {
    throw new Error("Complete-set trade requires a valid maximum amount in from trade");
  }
  if (maxBuyIn <= 0n) {
    throw new Error("Complete-set trade requires a positive maximum amount in");
  }
  return maxBuyIn;
}

function validateCompleteSetTradeProps(props: TradeTokensProps): ValidatedCompleteSetTrade {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }
  if (!(trade instanceof UniswapTrade) && !(trade instanceof SwaprV3Trade)) {
    throw new Error("Complete-set trade requires Swapr or Uniswap secondary trade");
  }
  if (!trade.approveAddress) {
    throw new Error("Complete-set trade requires trade.approveAddress");
  }
  const swapSpender = trade.approveAddress as Address;

  if (completeSetLeg.route === "mintSell") {
    const splitAmount = completeSetLeg.splitAmount;
    if (!splitAmount) {
      throw new Error("mintSell route requires splitAmount");
    }
    return { completeSetLeg, trade, swapSpender, route: "mintSell", splitAmount };
  }

  if (completeSetLeg.route === "buyMerge") {
    const mergeAmount = completeSetLeg.mergeAmount;
    if (!mergeAmount) {
      throw new Error("buyMerge route requires mergeAmount");
    }
    return {
      completeSetLeg,
      trade,
      swapSpender,
      route: "buyMerge",
      mergeAmount,
      maxBuyIn: getValidatedMaximumAmountIn(trade),
    };
  }

  throw new Error(`Unsupported complete-set route: ${completeSetLeg.route as string}`);
}

async function getSecondarySwapExecution(
  trade: SwaprV3Trade | UniswapTrade,
  account: Address,
  isBuyExactOutputNative: boolean,
  isSellToNative: boolean,
  isSeerCredits: boolean,
): Promise<Execution> {
  if (trade instanceof UniswapTrade) {
    return buildUniswapTradeExecution(trade, account, isSeerCredits);
  }
  return buildSwaprTradeExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits);
}

export async function buildCompleteSetTradeCalls7702(props: TradeTokensProps): Promise<Execution[]> {
  const { account, isBuyExactOutputNative, isSellToNative, isSeerCredits } = props;
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg, trade, swapSpender } = validated;

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;
  const calls: Execution[] = [];

  if (validated.route === "mintSell") {
    const { splitAmount } = validated;

    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [completeSetLeg.collateralToken],
        account,
        spender: router,
        amounts: splitAmount,
        chainId,
      }),
    );
    calls.push(
      getSplitExecution({
        router,
        market: completeSetLeg.market,
        collateralToken: completeSetLeg.collateralToken,
        amount: splitAmount,
      }),
    );
    calls.push(
      ...getTradeApprovals7702({
        tokensAddresses: [completeSetLeg.oppositeOutcomeToken.address],
        account,
        spender: swapSpender,
        amounts: splitAmount,
        chainId,
      }),
    );
    calls.push(await getSecondarySwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits));
    return calls;
  }

  const { mergeAmount, maxBuyIn } = validated;

  calls.push(
    ...getTradeApprovals7702({
      tokensAddresses: [completeSetLeg.collateralToken],
      account,
      spender: swapSpender,
      amounts: maxBuyIn,
      chainId,
    }),
  );
  calls.push(await getSecondarySwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits));
  const mergeOutcomeTokens = [
    completeSetLeg.targetOutcomeToken.address,
    completeSetLeg.oppositeOutcomeToken.address,
    ...(completeSetLeg.invalidOutcomeToken ? [completeSetLeg.invalidOutcomeToken.address] : []),
  ];
  calls.push(
    ...getTradeApprovals7702({
      tokensAddresses: mergeOutcomeTokens,
      account,
      spender: router,
      amounts: mergeAmount,
      chainId,
    }),
  );
  calls.push(
    getMergeExecution({
      router,
      market: completeSetLeg.market,
      collateralToken: completeSetLeg.collateralToken,
      amount: mergeAmount,
    }),
  );

  return calls;
}

async function sendApprovalCalls(client: Client, account: Address, calls: Execution[]): Promise<void> {
  for (const call of calls) {
    await sendTransaction(client, { ...call, account, chain: client.chain });
  }
}

export async function executeCompleteSetTrade(client: Client, props: TradeTokensProps): Promise<`0x${string}`> {
  const { account, isBuyExactOutputNative, isSellToNative, isSeerCredits } = props;
  const validated = validateCompleteSetTradeProps(props);
  const { completeSetLeg, trade, swapSpender } = validated;

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;

  if (validated.route === "mintSell") {
    const { splitAmount } = validated;
    const neededSplit = await fetchNeededApprovals(client, [completeSetLeg.collateralToken], account, router, [
      splitAmount,
    ]);
    for (const approval of neededSplit) {
      await sendApprovalCalls(
        client,
        account,
        getApprovals7702({
          tokensAddresses: [approval.tokenAddress],
          account,
          spender: router,
          amounts: approval.amount,
          chainId,
        }),
      );
    }

    await sendTransaction(client, {
      ...getSplitExecution({
        router,
        market: completeSetLeg.market,
        collateralToken: completeSetLeg.collateralToken,
        amount: splitAmount,
      }),
      account,
      chain: client.chain,
    });

    const neededSell = await fetchNeededApprovals(
      client,
      [completeSetLeg.oppositeOutcomeToken.address],
      account,
      swapSpender,
      [splitAmount],
    );
    for (const approval of neededSell) {
      await sendApprovalCalls(
        client,
        account,
        getApprovals7702({
          tokensAddresses: [approval.tokenAddress],
          account,
          spender: swapSpender,
          amounts: approval.amount,
          chainId,
        }),
      );
    }

    return sendTransaction(client, {
      ...(await getSecondarySwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits)),
      account,
      chain: client.chain,
    });
  }

  const { mergeAmount, maxBuyIn } = validated;
  const neededBuy = await fetchNeededApprovals(client, [completeSetLeg.collateralToken], account, swapSpender, [
    maxBuyIn,
  ]);
  for (const approval of neededBuy) {
    await sendApprovalCalls(
      client,
      account,
      getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: swapSpender,
        amounts: approval.amount,
        chainId,
      }),
    );
  }

  await sendTransaction(client, {
    ...(await getSecondarySwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits)),
    account,
    chain: client.chain,
  });

  const mergeOutcomeTokens = [
    completeSetLeg.targetOutcomeToken.address,
    completeSetLeg.oppositeOutcomeToken.address,
    ...(completeSetLeg.invalidOutcomeToken ? [completeSetLeg.invalidOutcomeToken.address] : []),
  ];
  const neededMerge = await fetchNeededApprovals(
    client,
    mergeOutcomeTokens,
    account,
    router,
    mergeOutcomeTokens.map(() => mergeAmount),
  );
  for (const approval of neededMerge) {
    await sendApprovalCalls(
      client,
      account,
      getApprovals7702({
        tokensAddresses: [approval.tokenAddress],
        account,
        spender: router,
        amounts: approval.amount,
        chainId,
      }),
    );
  }

  return sendTransaction(client, {
    ...getMergeExecution({
      router,
      market: completeSetLeg.market,
      collateralToken: completeSetLeg.collateralToken,
      amount: mergeAmount,
    }),
    account,
    chain: client.chain,
  });
}

export function getCompleteSetApprovalTokens(props: TradeTokensProps): {
  tokensAddresses: Address[];
  spenders: Address[];
  amounts: bigint[];
} {
  const { completeSetLeg, trade } = props;
  if (!completeSetLeg) {
    return { tokensAddresses: [], spenders: [], amounts: [] };
  }

  const router = getRouterAddress(completeSetLeg.market);
  const tokensAddresses: Address[] = [];
  const spenders: Address[] = [];
  const amounts: bigint[] = [];

  if (completeSetLeg.route === "mintSell" && completeSetLeg.splitAmount) {
    tokensAddresses.push(completeSetLeg.collateralToken);
    spenders.push(router);
    amounts.push(completeSetLeg.splitAmount);

    tokensAddresses.push(completeSetLeg.oppositeOutcomeToken.address);
    spenders.push(trade.approveAddress as Address);
    amounts.push(completeSetLeg.splitAmount);
    return { tokensAddresses, spenders, amounts };
  }

  if (completeSetLeg.route === "buyMerge" && completeSetLeg.mergeAmount) {
    tokensAddresses.push(completeSetLeg.collateralToken);
    spenders.push(trade.approveAddress as Address);
    amounts.push(getMaximumAmountIn(trade));

    for (const outcomeToken of [
      completeSetLeg.targetOutcomeToken,
      completeSetLeg.oppositeOutcomeToken,
      completeSetLeg.invalidOutcomeToken,
    ]) {
      if (!outcomeToken) {
        continue;
      }
      tokensAddresses.push(outcomeToken.address);
      spenders.push(router);
      amounts.push(completeSetLeg.mergeAmount);
    }
  }

  return { tokensAddresses, spenders, amounts };
}
