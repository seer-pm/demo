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
  const { completeSetLeg, account, trade, isBuyExactOutputNative, isSellToNative, isSeerCredits } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }
  if (!(trade instanceof UniswapTrade) && !(trade instanceof SwaprV3Trade)) {
    throw new Error("Complete-set trade requires Swapr or Uniswap secondary trade");
  }

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;
  const calls: Execution[] = [];

  if (completeSetLeg.route === "mintSell") {
    const splitAmount = completeSetLeg.splitAmount;
    if (!splitAmount) {
      throw new Error("mintSell route requires splitAmount");
    }

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
        spender: trade.approveAddress as Address,
        amounts: splitAmount,
        chainId,
      }),
    );
    calls.push(await getSecondarySwapExecution(trade, account, isBuyExactOutputNative, isSellToNative, isSeerCredits));
    return calls;
  }

  const mergeAmount = completeSetLeg.mergeAmount;
  if (!mergeAmount) {
    throw new Error("buyMerge route requires mergeAmount");
  }

  calls.push(
    ...getTradeApprovals7702({
      tokensAddresses: [completeSetLeg.collateralToken],
      account,
      spender: trade.approveAddress as Address,
      amounts: getMaximumAmountIn(trade),
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
  const { completeSetLeg, account, trade, isBuyExactOutputNative, isSellToNative, isSeerCredits } = props;
  if (!completeSetLeg) {
    throw new Error("Complete-set trade requires completeSetLeg");
  }

  const router = getRouterAddress(completeSetLeg.market);
  const chainId = completeSetLeg.market.chainId as SupportedChain;

  if (completeSetLeg.route === "mintSell") {
    const splitAmount = completeSetLeg.splitAmount!;
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

    const swapSpender = trade.approveAddress as Address;
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
      ...(await getSecondarySwapExecution(
        trade as SwaprV3Trade | UniswapTrade,
        account,
        isBuyExactOutputNative,
        isSellToNative,
        isSeerCredits,
      )),
      account,
      chain: client.chain,
    });
  }

  const mergeAmount = completeSetLeg.mergeAmount!;
  const swapSpender = trade.approveAddress as Address;
  const maxBuyIn = getMaximumAmountIn(trade);
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
    ...(await getSecondarySwapExecution(
      trade as SwaprV3Trade | UniswapTrade,
      account,
      isBuyExactOutputNative,
      isSellToNative,
      isSeerCredits,
    )),
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
