import { toastifyTx } from "@/lib/toastify";
import {
  type FillToEstimateLegTrade,
  type FillToEstimatePlan,
  type FillToEstimateTradeParams,
  buildFillToEstimateCalls7702,
  executeFillToEstimate,
} from "@seer-pm/sdk";
import type { Market, Token } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Client } from "viem";
import { sendCalls } from "viem/actions";
import { useConnectorClient } from "wagmi";
import { useCheck7702Support } from "../useCheck7702Support";

interface ExecuteFillToEstimateParams {
  plan: FillToEstimatePlan;
  market: Market;
  account: Address;
  collateralToken: Token;
  legTrades: FillToEstimateLegTrade[];
  isBuyExactOutputNative: boolean;
  isSellToNative: boolean;
  isSeerCredits: boolean;
}

function buildTradeParams(params: ExecuteFillToEstimateParams): FillToEstimateTradeParams {
  return {
    plan: params.plan,
    market: params.market,
    account: params.account,
    collateralToken: params.collateralToken.address,
    legTrades: params.legTrades,
    isBuyExactOutputNative: params.isBuyExactOutputNative,
    isSellToNative: params.isSellToNative,
    isSeerCredits: params.isSeerCredits,
  };
}

export function useFillToEstimateTrade(onSuccess: () => unknown) {
  const supports7702 = useCheck7702Support();
  const queryClient = useQueryClient();
  const { data: walletClient } = useConnectorClient();

  const invalidateAfterTrade = () => {
    queryClient.invalidateQueries({ queryKey: ["useQuote"] });
    queryClient.invalidateQueries({ queryKey: ["useMarketOdds"] });
    queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
    queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
    queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
    queryClient.invalidateQueries({ queryKey: ["useTicksData"] });
    onSuccess();
  };

  return useMutation({
    mutationFn: async (params: ExecuteFillToEstimateParams) => {
      if (!walletClient) {
        throw new Error("No wallet client connected");
      }

      const tradeParams = buildTradeParams(params);

      if (supports7702) {
        const calls = await buildFillToEstimateCalls7702(tradeParams);
        const result = await toastifyTx(
          () =>
            sendCalls(walletClient as Client, {
              calls,
              chain: walletClient.chain,
              account: walletClient.account,
            }),
          {
            txSent: { title: "Executing fill-to-estimate..." },
            txSuccess: { title: "Fill-to-estimate executed!" },
          },
        );
        if (!result.status) {
          throw result.error;
        }
        return result.receipt;
      }

      const result = await toastifyTx(() => executeFillToEstimate(walletClient as Client, tradeParams), {
        txSent: { title: "Executing fill-to-estimate..." },
        txSuccess: { title: "Fill-to-estimate executed!" },
      });
      if (!result.status) {
        throw result.error;
      }
      return result.receipt;
    },
    onSuccess: invalidateAfterTrade,
  });
}
