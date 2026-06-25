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
