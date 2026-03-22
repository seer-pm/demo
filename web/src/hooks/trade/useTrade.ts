import { toastify, toastifyTx } from "@/lib/toastify";
import { useTrade as useTradeBase } from "@seer-pm/react";
import type { Trade } from "@seer-pm/sdk";
import type { Address } from "viem";
import { useCheck7702Support } from "../useCheck7702Support";
import { useGlobalState } from "../useGlobalState";

export const useTrade = (
  account: Address | undefined,
  trade: Trade | undefined,
  isSeerCredits: boolean,
  onSuccess: () => unknown,
) => {
  const supports7702 = useCheck7702Support();
  const { addPendingOrder } = useGlobalState();

  return useTradeBase(
    account,
    trade,
    isSeerCredits,
    onSuccess,
    supports7702,
    toastify,
    toastifyTx,
    (orderUid: string) => {
      addPendingOrder(orderUid);
    },
  );
};
