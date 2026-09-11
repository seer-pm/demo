import {
  type SwapOrderType,
  type TradeDraft,
  type TradeDrafts,
  applyTradeDraft,
  getTradeDraftKey,
  readOrderType,
} from "@/lib/trade-draft";
import { type Market, isFillToEstimateEnabled } from "@seer-pm/sdk";
import { useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  drafts: TradeDrafts;
};

type Action = {
  setTradeDraft: (key: string, patch: TradeDraft) => void;
};

/**
 * What the user typed in a market's trade widget, kept outside React so it survives
 * the widget unmounting: switching order type, opening the max slippage screen, the
 * mobile drawer tabs, or the outcome token reloading while the wallet is busy between
 * an approval and the swap itself.
 *
 * Session storage (not local storage like `useGlobalState`): the draft should outlive
 * a page reload in this tab, not the tab itself.
 */
const useTradeFormDraft = create<State & Action>()(
  persist(
    (set) => ({
      drafts: {},
      setTradeDraft: (key: string, patch: TradeDraft) =>
        set((state) => ({
          drafts: applyTradeDraft(state.drafts, key, patch),
        })),
    }),
    {
      name: "seer-trade-draft",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

/**
 * Draft accessors for one market. `getDraft` reads a snapshot instead of subscribing:
 * the panels seed their form defaults from it once and own the value afterwards.
 */
export function useMarketTradeDraft(market: Market) {
  const key = getTradeDraftKey(market.chainId, market.id);
  const setTradeDraft = useTradeFormDraft((state) => state.setTradeDraft);

  const getDraft = useCallback(() => useTradeFormDraft.getState().drafts[key], [key]);
  const setDraft = useCallback((patch: TradeDraft) => setTradeDraft(key, patch), [key, setTradeDraft]);

  return { getDraft, setDraft };
}

/** The stored order type for this market, sanitized against what the market offers. */
export function useTradeOrderType(market: Market): SwapOrderType {
  const key = getTradeDraftKey(market.chainId, market.id);

  return useTradeFormDraft((state) =>
    readOrderType(state.drafts[key]?.orderType, {
      isGeneric: market.type === "Generic",
      allowFillToEstimate: isFillToEstimateEnabled(market),
    }),
  );
}

export { useTradeFormDraft };
