import {
  CoWTrade,
  type CompleteSetLeg,
  type Market,
  type NotifierFn,
  type Psm3Leg,
  type TradeTokensProps as SdkTradeTokensProps,
  Trade,
  type TxNotifierFn,
  buildTradeCalls7702,
  tradeTokens as sdkTradeTokens,
  viemClientToSigner,
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
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
): Promise<string | TransactionReceipt> {
  const adapters = {
    client,
    getSigner: async () => viemClientToSigner(client),
  };

  if (props.trade instanceof CoWTrade) {
    const result = await orderNotifier(() => sdkTradeTokens(props, adapters) as Promise<string>, {
      txSent: { title: "Confirm order..." },
      txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
    });
    if (!result.status) throw result.error;
    return result.data;
  }

  const result = await txNotifier(() => sdkTradeTokens(props, adapters) as Promise<`0x${string}`>, {
    txSent: { title: "Executing trade..." },
    txSuccess: { title: "Trade executed!" },
  });
  if (!result.status) throw result.error;
  return result.receipt as TransactionReceipt;
}

async function tradeTokens7702(
  props: TradeTokensProps,
  client: Client,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
): Promise<string | TransactionReceipt> {
  if (props.trade instanceof CoWTrade) {
    return tradeTokens(props, client, orderNotifier, txNotifier);
  }

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
  trade: Trade | undefined,
  isSeerCredits: boolean,
  psm3Leg: Psm3Leg | undefined,
  completeSetLeg: CompleteSetLeg | undefined,
  market: Market,
  onSuccess: () => unknown,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
  onOrderPlaced?: (orderUid: string) => void,
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
        return tradeTokens(props, walletClient, orderNotifier, txNotifier);
      },
      onSuccess: (result: string | TransactionReceipt) => {
        const isCowOrder = typeof result === "string";
        if (isCowOrder) {
          onOrderPlaced?.(result);
          queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
        }
        invalidateAfterTrade(queryClient, {
          market,
          onSuccess,
        });
      },
    }),
  };
}

function useTrade7702(
  trade: Trade | undefined,
  market: Market,
  onSuccess: () => unknown,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
  onOrderPlaced?: (orderUid: string) => void,
) {
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
        return tradeTokens7702(props, walletClient, orderNotifier, txNotifier);
      },
      onSuccess: (result: string | TransactionReceipt) => {
        const isCowOrder = typeof result === "string";
        if (isCowOrder) {
          onOrderPlaced?.(result);
          queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
        }
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
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
  supports7702: boolean,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
  market: Market,
  onOrderPlaced?: (orderUid: string) => void,
  psm3Leg?: Psm3Leg,
  completeSetLeg?: CompleteSetLeg,
) => {
  const trade7702 = useTrade7702(trade, market, onSuccess, orderNotifier, txNotifier, onOrderPlaced);
  const tradeLegacy = useTradeLegacy(
    account,
    trade,
    isSeerCredits,
    psm3Leg,
    completeSetLeg,
    market,
    onSuccess,
    orderNotifier,
    txNotifier,
    onOrderPlaced,
  );

  return supports7702 ? trade7702 : tradeLegacy;
};
