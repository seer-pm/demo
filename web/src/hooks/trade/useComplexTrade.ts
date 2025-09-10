import { getSwaprTradeExecution } from "@/hooks/trade/executeSwaprTrade";
import { getUniswapTradeExecution } from "@/hooks/trade/executeUniswapTrade";
import { COLLATERAL_TOKENS, getRouterAddress } from "@/lib/config";
import { Market } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult } from "@/lib/trade";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { SwaprV3Trade, UniswapTrade } from "@swapr/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendCalls } from "@wagmi/core";
import { Address, TransactionReceipt, parseUnits } from "viem";
import { getTradeApprovals7702 } from ".";
import { Execution } from "../useCheck7702Support";
import { useGlobalState } from "../useGlobalState";
import { getApprovals7702 } from "../useMissingApprovals";
import { getSplitMergeRedeemCollateral } from "../useSelectedCollateral";
import { splitFromRouter } from "../useSplitPosition";

interface TradeTokensComplexProps {
  account: Address;
  market: Market;
  selectedCollateral: Token;
  amount: string;
  quotes: QuoteTradeResult[];
}

export async function tradeTokensComplex({
  account,
  market,
  selectedCollateral,
  amount,
  quotes,
}: TradeTokensComplexProps) {
  const parsedAmount = parseUnits(amount ?? "0", selectedCollateral.decimals);
  const router = getRouterAddress(market);

  //get split approvals
  const splitApprovalConfig = {
    tokensAddresses: selectedCollateral.address !== NATIVE_TOKEN ? [selectedCollateral.address] : [],
    account,
    spender: router,
    amounts: parsedAmount,
    chainId: market.chainId,
  };
  const calls: Execution[] = getApprovals7702(splitApprovalConfig);
  const useAltCollateral = isTwoStringsEqual(
    selectedCollateral.address,
    COLLATERAL_TOKENS[market.chainId].secondary?.address,
  );
  // push split transaction
  calls.push(
    splitFromRouter(
      getSplitMergeRedeemCollateral(market, selectedCollateral, useAltCollateral),
      router,
      market,
      parsedAmount,
    ),
  );

  //get trade approvals (sell -> rebuy)
  for (const { trade } of quotes) {
    calls.push(...getTradeApprovals7702(account, trade));
  }

  // push trade transactions
  const tradeTransactions = await Promise.all(
    quotes.map(({ trade }) =>
      trade instanceof UniswapTrade
        ? getUniswapTradeExecution(trade, account)
        : getSwaprTradeExecution(trade as SwaprV3Trade, account, false, false),
    ),
  );
  calls.push(...tradeTransactions);

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
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

export const useComplexTrade = (onSuccess: () => unknown) => {
  const { addPendingOrder } = useGlobalState();
  return {
    tradeTokensComplex: useMutation({
      mutationFn: (props: TradeTokensComplexProps) => tradeTokensComplex(props),
      onSuccess: (result: string | TransactionReceipt) => {
        if (typeof result === "string") {
          addPendingOrder(result);
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
