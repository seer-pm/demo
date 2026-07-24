import {
  type AmmTrade,
  type CompleteSetLeg,
  type Market,
  type Psm3Leg,
  type TradeTokensProps as SdkTradeTokensProps,
  type TxNotifierFn,
  buildTradeCalls7702,
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

async function tradeTokens7702(
  props: TradeTokensProps,
  client: Client,
  txNotifier: TxNotifierFn,
): Promise<TransactionReceipt> {
  const calls = await buildTradeCalls7702(props);

  const result = await txNotifier(
    () =>
      sendCalls(client, {
        calls,
        chain: client.chain,
        account: client.account,
      }),
    {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt as TransactionReceipt;
}

function useTradeLegacy(
  account: Address | undefined,
  trade: AmmTrade | undefined,
  isSeerCredits: boolean,
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
    approvals: isSeerCredits ? EMPTY_APPROVALS : approvals,
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
  isSeerCredits: boolean,
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
    isSeerCredits,
    psm3Leg,
    completeSetLeg,
    market,
    onSuccess,
    txNotifier,
  );

  return supports7702 ? trade7702 : tradeLegacy;
};
