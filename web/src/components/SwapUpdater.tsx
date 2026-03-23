import { useGlobalState } from "@/hooks/useGlobalState";
import { queryClient } from "@/lib/query-client";
import { toastError, toastInfo, toastSuccess } from "@/lib/toastify";
import { displayBalance } from "@/lib/utils";
import { getTokenInfo } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
import { OrderBookApi, OrderStatus, type SupportedChainId } from "@seer-pm/sdk";
import { useEffect } from "react";
import type { Client } from "viem";
import { useAccount, useClient } from "wagmi";

const SWAP_STATUS_CHECK_INTERVAL = 3000;

async function updateOrders(
  pendingOrders: string[],
  chainId: SupportedChainId,
  client: Client,
  removePendingOrder: (orderId: string) => void,
) {
  if (pendingOrders.length === 0) {
    return;
  }

  const orderBookApi = new OrderBookApi({ chainId });

  await Promise.all(
    pendingOrders.map(async (pendingOrderId) => {
      const order = await orderBookApi.getOrder(pendingOrderId);

      if (order.status === OrderStatus.OPEN) {
        return;
      }

      const [buyToken, sellToken] = await Promise.all([
        getTokenInfo(order.buyToken as `0x${string}`, chainId as SupportedChain, client),
        getTokenInfo(order.sellToken as `0x${string}`, chainId as SupportedChain, client),
      ]);

      if (order.status === OrderStatus.FULFILLED) {
        toastSuccess({
          title: `Swapped ${displayBalance(BigInt(order.sellAmount), sellToken.decimals)} ${
            sellToken.symbol
          } for ${displayBalance(BigInt(order.buyAmount), buyToken.decimals)} ${buyToken.symbol}`,
        });
      } else if (order.status === OrderStatus.EXPIRED) {
        toastError({ title: "Swap expired" });
      } else if (order.status === OrderStatus.CANCELLED) {
        toastInfo({ title: "Swap cancelled" });
      }
      queryClient.invalidateQueries({ queryKey: ["useCowOrders"] }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["usePositions"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
        queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
        queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      });
      removePendingOrder(pendingOrderId);
    }),
  );
}

export function SwapUpdater() {
  const { pendingOrders, removePendingOrder } = useGlobalState();
  const { chainId } = useAccount();
  const client = useClient({ chainId });

  useEffect(() => {
    if (!chainId || !client) {
      return;
    }

    const intervalId = setInterval(async () => {
      await updateOrders(pendingOrders, chainId, client, removePendingOrder);
    }, SWAP_STATUS_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [chainId, client, pendingOrders, removePendingOrder]);

  return <></>;
}
