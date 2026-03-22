import {
  CoWTrade,
  type NotifierFn,
  SwaprV3Trade,
  Trade,
  type TxNotifierFn,
  UniswapTrade,
  buildTradeCalls7702,
  clientToSigner,
  tradeTokens as sdkTradeTokens,
} from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Config } from "@wagmi/core";
import { getConnectorClient, sendCalls } from "@wagmi/core";
import type { Address, TransactionReceipt } from "viem";
import { useConfig } from "wagmi";
import { useMissingTradeApproval } from "./useMissingTradeApproval";

const EMPTY_APPROVALS = {
  data: [],
  isLoading: false,
};

export interface TradeTokensProps {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
}

async function tradeTokens(
  props: TradeTokensProps,
  config: Config,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
): Promise<string | TransactionReceipt> {
  const adapters = {
    config,
    getSigner: async () => {
      const client = await getConnectorClient(config);
      if (!client) throw new Error("No wallet connected");
      return clientToSigner(client);
    },
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
  config: Config,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
): Promise<string | TransactionReceipt> {
  if (props.trade instanceof CoWTrade) {
    return tradeTokens(props, config, orderNotifier, txNotifier);
  }

  const calls = await buildTradeCalls7702(props);

  const result = await txNotifier(
    () =>
      sendCalls(config, {
        calls,
        chainId: props.trade.chainId,
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
  onSuccess: () => unknown,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
  onOrderPlaced?: (orderUid: string) => void,
) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const approvals = useMissingTradeApproval(account, trade);

  return {
    approvals: isSeerCredits ? EMPTY_APPROVALS : approvals,
    tradeTokens: useMutation({
      mutationFn: (props: TradeTokensProps) => tradeTokens(props, config, orderNotifier, txNotifier),
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          onOrderPlaced?.(result);
          queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
        }
        queryClient.invalidateQueries({ queryKey: ["useQuote"] });
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        onSuccess();
      },
    }),
  };
}

function useTrade7702(
  onSuccess: () => unknown,
  orderNotifier: NotifierFn,
  txNotifier: TxNotifierFn,
  onOrderPlaced?: (orderUid: string) => void,
) {
  const config = useConfig();
  const queryClient = useQueryClient();

  return {
    approvals: EMPTY_APPROVALS,
    tradeTokens: useMutation({
      mutationFn: (props: TradeTokensProps) => tradeTokens7702(props, config, orderNotifier, txNotifier),
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          onOrderPlaced?.(result);
          queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
        }
        queryClient.invalidateQueries({ queryKey: ["useQuote"] });
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        onSuccess();
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
  onOrderPlaced?: (orderUid: string) => void,
) => {
  const trade7702 = useTrade7702(onSuccess, orderNotifier, txNotifier, onOrderPlaced);
  const tradeLegacy = useTradeLegacy(
    account,
    trade,
    isSeerCredits,
    onSuccess,
    orderNotifier,
    txNotifier,
    onOrderPlaced,
  );

  return supports7702 ? trade7702 : tradeLegacy;
};
