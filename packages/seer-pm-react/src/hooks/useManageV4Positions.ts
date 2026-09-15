import { type V4Position, buildCollectV4FeesExecution, buildRemoveV4PositionExecution } from "@seer-pm/order-book/v4";
import type { TxNotifierFn } from "@seer-pm/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConfig } from "wagmi";
import { sendExecutions } from "./sendExecutions";
import { USER_V4_POSITIONS_QUERY_KEY } from "./useUserV4Positions";

type PositionActionParams = {
  chainId: number;
  position: V4Position;
  sqrtPriceX96: bigint;
  tick?: number;
  recipient: Address;
};

export type RemoveV4LiquidityParams = PositionActionParams & {
  /** Share of the position to remove, in basis points (10_000 = everything, burns the NFT). */
  percentageBps: number;
};

function useInvalidateV4PositionQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [USER_V4_POSITIONS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["useMarketPools"] });
    queryClient.invalidateQueries({ queryKey: ["useV4PoolState"] });
    queryClient.invalidateQueries({ queryKey: ["useMarketHasLiquidity"] });
    queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
  };
}

export function useRemoveV4Liquidity(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const invalidate = useInvalidateV4PositionQueries();

  return useMutation({
    mutationFn: async (params: RemoveV4LiquidityParams) => {
      const execution = buildRemoveV4PositionExecution(params);
      const full = params.percentageBps === 10_000;
      return sendExecutions(config, [execution], params.chainId, supports7702, txNotifier, {
        txSent: full ? "Removing liquidity..." : `Removing ${params.percentageBps / 100}% of the position...`,
        txSuccess: full ? "Liquidity removed." : "Liquidity partially removed.",
      });
    },
    onSuccess: invalidate,
  });
}

export function useCollectV4Fees(txNotifier: TxNotifierFn, supports7702: boolean) {
  const config = useConfig();
  const invalidate = useInvalidateV4PositionQueries();

  return useMutation({
    mutationFn: async (params: PositionActionParams) => {
      const execution = buildCollectV4FeesExecution(params);
      return sendExecutions(config, [execution], params.chainId, supports7702, txNotifier, {
        txSent: "Collecting fees...",
        txSuccess: "Fees collected.",
      });
    },
    onSuccess: invalidate,
  });
}
