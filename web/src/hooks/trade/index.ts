import { createCowOrder } from "@/hooks/trade/executeCowTrade";
import { SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { toastify, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import {
  CoWTrade,
  SwaprV3Trade,
  Trade,
  UniswapTrade,
  buildTradeCalls7702,
  clientToSigner,
  getMaximumAmountIn,
  tradeTokens as sdkTradeTokens,
} from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { getConnectorClient } from "@wagmi/core";
import { sendCalls } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { useCheck7702Support } from "../useCheck7702Support";
import { useGlobalState } from "../useGlobalState";
import { useMissingApprovals } from "../useMissingApprovals";

const EMPTY_APPROVALS = {
  data: [],
  isLoading: false,
};

function useMissingTradeApproval(account: Address | undefined, trade: Trade | undefined) {
  const { data, isLoading } = useMissingApprovals(
    !trade
      ? undefined
      : {
          tokensAddresses: [trade.executionPrice.baseCurrency.address as `0x${string}`],
          account,
          spender: trade.approveAddress as `0x${string}`,
          amounts: getMaximumAmountIn(trade),
          chainId: trade.chainId as SupportedChain,
        },
  );

  return { data, isLoading };
}

interface TradeTokensProps {
  trade: CoWTrade | SwaprV3Trade | UniswapTrade;
  account: Address;
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
}

async function tradeTokens(props: TradeTokensProps): Promise<string | TransactionReceipt> {
  const adapters = {
    config,
    getSigner: async () => {
      const client = await getConnectorClient(config);
      if (!client) throw new Error("No wallet connected");
      return clientToSigner(client);
    },
  };

  if (props.trade instanceof CoWTrade) {
    const result = await toastify(() => sdkTradeTokens(props, adapters), {
      txSent: { title: "Confirm order..." },
      txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
    });
    if (!result.status) throw result.error;
    return result.data;
  }

  const result = await toastifyTx(() => sdkTradeTokens(props, adapters) as Promise<`0x${string}`>, {
    txSent: { title: "Executing trade..." },
    txSuccess: { title: "Trade executed!" },
  });
  if (!result.status) throw result.error;
  return result.receipt;
}

function useTradeLegacy(
  account: Address | undefined,
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
) {
  const { addPendingOrder } = useGlobalState();

  const approvals = useMissingTradeApproval(account, trade);

  return {
    approvals: isSeerCredits ? EMPTY_APPROVALS : approvals,
    tradeTokens: useMutation({
      mutationFn: tradeTokens,
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          addPendingOrder(result);
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

async function tradeTokens7702(props: TradeTokensProps): Promise<string | TransactionReceipt> {
  if (props.trade instanceof CoWTrade) {
    return tradeTokens(props);
  }

  const calls = await buildTradeCalls7702(props);

  const result = await toastifyTx(
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

  return result.receipt;
}

const useTrade7702 = (onSuccess: () => unknown) => {
  const { addPendingOrder } = useGlobalState();

  return {
    approvals: EMPTY_APPROVALS,
    tradeTokens: useMutation({
      mutationFn: (props: TradeTokensProps) => tradeTokens7702(props),
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          addPendingOrder(result);
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
};

export const useTrade = (
  account: Address | undefined,
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
) => {
  const supports7702 = useCheck7702Support();
  const trade7702 = useTrade7702(onSuccess);
  const tradeLegacy = useTradeLegacy(account, trade, isSeerCredits, onSuccess);

  return supports7702 ? trade7702 : tradeLegacy;
};

export function useCowLimitOrder(onSuccess: () => unknown) {
  const { addPendingOrder } = useGlobalState();
  return useMutation({
    mutationFn: createCowOrder,
    onSuccess: (result: string) => {
      addPendingOrder(result);
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}
