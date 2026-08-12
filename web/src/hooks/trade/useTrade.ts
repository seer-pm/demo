import { toastifyTx } from "@/lib/toastify";
import { useTrade as useTradeBase } from "@seer-pm/react";
import type { AmmTrade, CompleteSetLeg, Market, Psm3Leg } from "@seer-pm/sdk";
import type { Address } from "viem";
import { useCheck7702Support } from "../useCheck7702Support";

export const useTrade = (
  account: Address | undefined,
  trade: AmmTrade | undefined,
  isTradingCredits: boolean,
  onSuccess: () => unknown,
  market: Market,
  psm3Leg?: Psm3Leg,
  completeSetLeg?: CompleteSetLeg,
) => {
  const supports7702 = useCheck7702Support();

  return useTradeBase(
    account,
    trade,
    isTradingCredits,
    onSuccess,
    supports7702,
    toastifyTx,
    market,
    psm3Leg,
    completeSetLeg,
  );
};
