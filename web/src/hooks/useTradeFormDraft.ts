import {
  type SwapOrderType,
  type TradeDraft,
  type TradeDraftSection,
  type TradeDrafts,
  applyTradeDraft,
  clearTradeDraftSection,
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
  clearTradeDraftSection: (key: string, section: TradeDraftSection) => void;
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
      clearTradeDraftSection: (key: string, section: TradeDraftSection) =>
        set((state) => ({
          drafts: clearTradeDraftSection(state.drafts, key, section),
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
 *
 * `clearDraft` drops one panel's section right away, without waiting for that panel's
 * persistence effect: after a trade the widget may already be unmounted (the outcome
 * token reloads), so the effect never runs and a remount would restore the traded
 * values. The order type is left alone so the widget stays on the same panel.
 */
export function useMarketTradeDraft(market: Market) {
  const key = getTradeDraftKey(market.chainId, market.id);
  const setTradeDraft = useTradeFormDraft((state) => state.setTradeDraft);
  const clearSection = useTradeFormDraft((state) => state.clearTradeDraftSection);

  const getDraft = useCallback(() => useTradeFormDraft.getState().drafts[key], [key]);
  const setDraft = useCallback((patch: TradeDraft) => setTradeDraft(key, patch), [key, setTradeDraft]);
  const clearDraft = useCallback((section: TradeDraftSection) => clearSection(key, section), [key, clearSection]);

  return { getDraft, setDraft, clearDraft };
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
