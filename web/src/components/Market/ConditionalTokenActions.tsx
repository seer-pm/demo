import { Market, MarketStatus, getMarketStatus } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

export type TokenAction = "mint" | "merge" | "redeem";

interface ConditionalTokenActionsProps {
  account?: Address;
  market: Market;
  outcomeIndex: number;
  /** Currently open action (Mint/Merge/Redeem), or null to render nothing. */
  activeAction: TokenAction | null;
}

// Must be ≥ the unified `transition-duration` on `.action-form-panel` in
// index.scss (currently 520ms on every animated property). Set to 540ms
// (20ms buffer) so the form stays mounted through the FULL haze-out —
// without the buffer, the inner fields disappear before the wrapper has
// finished blurring back into nothing. If you tune the CSS, sync this.
const PANEL_TRANSITION_MS = 540;

/**
 * CONTRIBUTORS — what this panel does and why it works the way it does:
 *
 *   • CONTROLLED: `activeAction` is owned by <SwapWidget> in `+Page.tsx`.
 *     Default state is `null` → the wrapper renders but stays collapsed
 *     (max-height 0, opacity 0, blur 10px) so the purchase panel keeps
 *     the sample's compact height. Only on click does the wrapper expand
 *     to the bottom of the viewport (capped, see `.action-form-panel.is-open`
 *     in index.scss) and the form fades in from haze to reality.
 *   • EXIT ANIMATION: React unmounts a removed child immediately, which
 *     would yank the form's content before the haze-out can finish.
 *     We solve this by tracking `renderedAction` separately from
 *     `activeAction`: on close, we drop `is-open` (which triggers the CSS
 *     transition), then unmount the inner form after PANEL_TRANSITION_MS.
 *   • The trigger buttons live in <SwapWidget>'s `.actions-row`. The
 *     active button is blue and clicking it again clears `activeAction`.
 *
 *  Add a new action: extend `TokenAction`, add a sibling trigger in
 *  <SwapWidget>'s actionsRow, then add a conditional render below.
 */
export function ConditionalTokenActions({
  account,
  market,
  outcomeIndex: _outcomeIndex,
  activeAction,
}: ConditionalTokenActionsProps) {
  const marketStatus = getMarketStatus(market);
  const [renderedAction, setRenderedAction] = useState<TokenAction | null>(activeAction);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (activeAction !== null) {
      // Opening (or switching to another action): mount the form first,
      // then add `is-open` on the next frame so the transition actually
      // runs (toggling the class same-frame as mount = no transition).
      setRenderedAction(activeAction);
      const raf = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(raf);
    }
    // Closing: drop the class first; keep the form mounted until the
    // haze-out animation finishes, then unmount.
    setIsOpen(false);
    const timer = window.setTimeout(() => setRenderedAction(null), PANEL_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [activeAction]);

  return (
    <div className={clsx("action-form-panel", isOpen ? "is-open" : "is-closed")} aria-hidden={!isOpen}>
      {renderedAction === "mint" && <SplitForm account={account} market={market} />}
      {renderedAction === "merge" && <MergeForm account={account} market={market} />}
      {renderedAction === "redeem" &&
        (marketStatus === MarketStatus.CLOSED ? (
          <RedeemForm account={account} market={market} />
        ) : (
          <p className="text-[13px] text-ink-3">Redemptions are not available yet.</p>
        ))}
    </div>
  );
}
