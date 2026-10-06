import {
  type AmmTrade,
  type CompleteSetLeg,
  type Market,
  type Psm3Leg,
  type TradeTokensProps as SdkTradeTokensProps,
  type TxNotifierFn,
  buildTradeBatches7702,
  tradeTokens as sdkTradeTokens,
} from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Client, TransactionReceipt } from "viem";
import { sendCalls } from "viem/actions";
import { useConnectorClient } from "wagmi";
import { invalidateAfterTrade } from "../utils/invalidateAfterTrade";
import { useMissingTradeApproval } from "./useMissingTradeApproval";

const EMPTY_APPROVALS = {
  data: [],
  isLoading: false,
};

export type TradeTokensProps = SdkTradeTokensProps;

async function tradeTokens(
  props: TradeTokensProps,
  client: Client,
  txNotifier: TxNotifierFn,
): Promise<TransactionReceipt> {
  const result = await txNotifier(() => sdkTradeTokens(props, { client }) as Promise<`0x${string}`>, {
    txSent: { title: "Executing trade..." },
    txSuccess: { title: "Trade executed!" },
  });
  if (!result.status) throw result.error;
  return result.receipt as TransactionReceipt;
}

/**
 * A trade is usually one batch. A complete-set route whose splits outgrow a transaction needs
 * several, sent in order and each confirmed by the wallet; a failure in between leaves the earlier
 * batches done and the user holding the sets they minted.
 */
async function tradeTokens7702(
  props: TradeTokensProps,
  client: Client,
  txNotifier: TxNotifierFn,
): Promise<TransactionReceipt> {
  const batches = await buildTradeBatches7702(props);
  let receipt: TransactionReceipt | undefined;

  for (const [index, calls] of batches.entries()) {
    const isLast = index === batches.length - 1;
    const step = batches.length > 1 ? ` (${index + 1}/${batches.length})` : "";
    const result = await txNotifier(
      () =>
        sendCalls(client, {
          calls,
          chain: client.chain,
          account: client.account,
        }),
      {
        txSent: { title: `Executing trade${step}...` },
        txSuccess: { title: isLast ? "Trade executed!" : `Trade step ${index + 1} of ${batches.length} done` },
      },
    );

    if (!result.status) {
      throw result.error;
    }
    receipt = result.receipt as TransactionReceipt;
  }

  if (!receipt) {
    throw new Error("Trade has no calls to execute");
  }
  return receipt;
}

function useTradeLegacy(
  account: Address | undefined,
  trade: AmmTrade | undefined,
  isTradingCredits: boolean,
  psm3Leg: Psm3Leg | undefined,
  completeSetLeg: CompleteSetLeg | undefined,
  market: Market,
  onSuccess: () => unknown,
  txNotifier: TxNotifierFn,
) {
  const { data: walletClient } = useConnectorClient({
    chainId: trade?.chainId,
    query: {
      enabled: Boolean(trade),
    },
  });
  const queryClient = useQueryClient();
  const approvals = useMissingTradeApproval(account, trade, psm3Leg, completeSetLeg);

  return {
    approvals: isTradingCredits ? EMPTY_APPROVALS : approvals,
    tradeTokens: useMutation({
      mutationFn: async (props: TradeTokensProps) => {
        if (!walletClient) {
          throw new Error("No wallet client connected");
        }
        return tradeTokens(props, walletClient, txNotifier);
      },
      onSuccess: () => {
        invalidateAfterTrade(queryClient, {
          market,
          onSuccess,
        });
      },
    }),
  };
}

function useTrade7702(trade: AmmTrade | undefined, market: Market, onSuccess: () => unknown, txNotifier: TxNotifierFn) {
  const { data: walletClient } = useConnectorClient({
    chainId: trade?.chainId,
    query: {
      enabled: Boolean(trade),
    },
  });
  const queryClient = useQueryClient();

  return {
    approvals: EMPTY_APPROVALS,
    tradeTokens: useMutation({
      mutationFn: async (props: TradeTokensProps) => {
        if (!walletClient) {
          throw new Error("No wallet client connected");
        }
        return tradeTokens7702(props, walletClient, txNotifier);
      },
      onSuccess: () => {
        invalidateAfterTrade(queryClient, {
          market,
          onSuccess,
        });
      },
    }),
  };
}

export const useTrade = (
  account: Address | undefined,
  trade: AmmTrade | undefined,
  isTradingCredits: boolean,
  onSuccess: () => unknown,
  supports7702: boolean,
  txNotifier: TxNotifierFn,
  market: Market,
  psm3Leg?: Psm3Leg,
  completeSetLeg?: CompleteSetLeg,
) => {
  const trade7702 = useTrade7702(trade, market, onSuccess, txNotifier);
  const tradeLegacy = useTradeLegacy(
    account,
    trade,
    isTradingCredits,
    psm3Leg,
    completeSetLeg,
    market,
    onSuccess,
    txNotifier,
  );

  return supports7702 ? trade7702 : tradeLegacy;
};
