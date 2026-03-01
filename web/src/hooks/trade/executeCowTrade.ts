import { queryClient } from "@/lib/query-client";
import { toastify } from "@/lib/toastify";
import { config } from "@/wagmi";
import type { EnrichedOrder, SupportedChainId, UnsignedOrder } from "@seer-pm/sdk";
import {
  clientToSigner,
  cancelCowOrder as sdkCancelCowOrder,
  cancelEthFlowOrder as sdkCancelEthFlowOrder,
  createCowOrder as sdkCreateCowOrder,
} from "@seer-pm/sdk";
import { getConnectorClient } from "@wagmi/core";

async function getSigner() {
  const client = await getConnectorClient(config);
  if (!client) throw new Error("No wallet connected");
  return clientToSigner(client);
}

export async function createCowOrder({
  order,
  chainId,
}: {
  order: UnsignedOrder;
  chainId: SupportedChainId;
}): Promise<string> {
  const signer = await getSigner();
  const result = await toastify(() => sdkCreateCowOrder(signer, { order, chainId }), {
    txSent: { title: "Confirm order..." },
    txSuccess: { title: "Order successfully placed! Check its status in your Portfolio." },
  });
  if (!result.status) throw result.error;
  queryClient.invalidateQueries({ queryKey: ["useCowOrders"] });
  return result.data;
}

export async function cancelCowOrder({
  orderId,
  chainId,
}: {
  orderId: string;
  chainId: SupportedChainId;
}): Promise<string> {
  const signer = await getSigner();
  const result = await toastify(() => sdkCancelCowOrder(signer, { orderId, chainId }), {
    txSent: { title: "Sending cancel request..." },
    txSuccess: { title: "Cancel request sent! Check its status in your Portfolio." },
  });
  if (!result.status) throw result.error;
  return orderId;
}

export async function cancelEthFlowOrder({ order }: { order: EnrichedOrder }): Promise<string> {
  const signer = await getSigner();
  const result = await toastify(() => sdkCancelEthFlowOrder(signer, { order }), {
    txSent: { title: "Sending cancel request..." },
    txSuccess: { title: "Cancel request sent! Check its status on-chain." },
  });
  if (!result.status) throw result.error;
  return order.uid;
}
