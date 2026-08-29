import type { Token, TransactionData } from "@seer-pm/sdk";
import { formatUnits } from "viem";
import type { ConditionalEventRow } from "./seerIndexerPortfolio";

/** A signed primary-collateral movement into (+) or out of (−) one market, at a point in time. */
type CapitalMove = {
  timestamp: number;
  blockNumber: number;
  /** Position within the block; -1 when the source does not index it (swaps). */
  logIndex: number;
  /** Insertion order — the last tiebreak, so the sort is a total order and reruns agree. */
  seq: number;
  deltaWei: bigint;
};

/** `ConditionalEvent.id` is `{chainId}:{txHash}-{logIndex}-{marketEntityId}`. */
function logIndexFromEventId(id: string): number {
  const parsed = Number(id.split("-")[1]);
  return Number.isFinite(parsed) ? parsed : -1;
}

/**
 * Peak primary collateral this wallet had at risk in each market during `(startTime, endTime]`.
 *
 * ## Why not the gross sum
 *
 * The obvious denominator — primary spent buying plus gross router splits — is unbounded over a
 * window for any strategy that recycles. Split 1 sDAI, provide liquidity, redeem, repeat 100 times
 * and the gross is 100 while the wallet never had more than 1 at risk. Measured on three real LP
 * wallets, gross overstated capital by **25×** against ~1.18× for pure swap traders, so the gross
 * denominator does not merely add noise: it reorders a ROI board against liquidity providers
 * specifically, in proportion to how often they recycle.
 *
 * The peak of the running balance is the standard reading of "capital at risk" and is invariant to
 * recycling: it answers how much the wallet ever had committed at once.
 *
 * ## The window's opening position counts
 *
 * The running balance starts at the position's mark-to-market at `startTime`, not at 0, so the
 * result is the whole ROI denominator on its own: capital already at risk when the window opened,
 * plus anything committed during it.
 *
 * Splitting it in two (`value_start + capital_deployed`, as an earlier version did) is worse than
 * redundant. `value_start` is `mtm + router cumulative`, and the router term is a cash balance that
 * goes **negative** exactly when collateral is committed — so adding it to the denominator
 * subtracted capital at risk instead of adding it, and drove rows to a null ROI. One field with one
 * meaning removes the ambiguity rather than patching it.
 *
 * ## Additivity
 *
 * A peak is not additive in general — per-market peaks can occur at different times, so their sum
 * is an upper bound on the true portfolio peak. This returns the **per-market** peak and callers
 * sum it, which is the only reading consistent with a per-market board: each row states the capital
 * that market required, and the total states capital committed across markets. It intentionally
 * does not reward moving the same capital between markets over time.
 *
 * LP mints are deliberately excluded, matching the existing definition: a market maker reaches the
 * pool through a split, and that split is already counted here.
 */
export function peakCapitalDeployedByMarket(args: {
  /** Raw swaps; only primary-collateral legs move capital. */
  swaps: TransactionData[];
  /** Conditional events, already deduped for the market fan-out. */
  conditionalEvents: ConditionalEventRow[];
  /** Position value per market at `startTime` — capital already at risk when the window opened. */
  openingCapitalByMarket: Map<string, number>;
  primaryCollateral: Token;
  startTime: number;
  endTime: number;
}): Map<string, number> {
  const { swaps, conditionalEvents, openingCapitalByMarket, primaryCollateral, startTime, endTime } = args;
  const primaryLc = primaryCollateral.address.toLowerCase();
  const movesByMarket = new Map<string, CapitalMove[]>();

  let seq = 0;
  const push = (marketId: string, timestamp: number, blockNumber: number, logIndex: number, deltaWei: bigint) => {
    if (deltaWei === 0n) return;
    if (timestamp <= startTime || timestamp > endTime) return;
    const move: CapitalMove = { timestamp, blockNumber, logIndex, seq: seq++, deltaWei };
    const list = movesByMarket.get(marketId);
    if (list) list.push(move);
    else movesByMarket.set(marketId, [move]);
  };

  for (const swap of swaps) {
    const marketId = String(swap.marketId ?? "").toLowerCase();
    if (!marketId) continue;
    let delta = 0n;
    // Buying an outcome commits primary; selling one returns it.
    if ((swap.tokenIn ?? "").toLowerCase() === primaryLc) delta += BigInt(swap.amountIn || 0);
    if ((swap.tokenOut ?? "").toLowerCase() === primaryLc) delta -= BigInt(swap.amountOut || 0);
    push(marketId, Number(swap.timestamp ?? 0), Number(swap.blockNumber ?? 0), -1, delta);
  }

  for (const event of conditionalEvents) {
    if (event.collateral.toLowerCase() !== primaryLc) continue;
    // Split commits collateral; merge and redeem give it back.
    const delta = event.eventType === "split" ? event.amount : -event.amount;
    push(event.marketId.toLowerCase(), event.timestamp, event.blockNumber, logIndexFromEventId(event.id), delta);
  }

  const scale = 10 ** primaryCollateral.decimals;
  const toWei = (human: number) => BigInt(Math.round(Math.max(human, 0) * scale));

  const out = new Map<string, number>();
  const marketIds = new Set([...movesByMarket.keys(), ...openingCapitalByMarket.keys()]);
  for (const marketId of marketIds) {
    const moves = movesByMarket.get(marketId) ?? [];
    // Chain order, not just clock order. Timestamps are block-granular, so a split and the redeem
    // that funds it share one, and the running balance is floored at zero below — which makes the
    // order within a second change the peak. Sorting on timestamp alone left ties in insertion
    // order, i.e. every swap ahead of every conditional event: deterministic, and wrong.
    //
    // Swaps carry no log index (`TransactionData` has none), so swap-vs-event order inside a single
    // block is still arbitrary — `seq` only makes it stable. Block-level and event-level order are
    // correct, which is the part the data can settle.
    moves.sort(
      (a, b) => a.timestamp - b.timestamp || a.blockNumber - b.blockNumber || a.logIndex - b.logIndex || a.seq - b.seq,
    );
    // Opening position is capital already at risk, so the peak starts there rather than at 0.
    let running = toWei(openingCapitalByMarket.get(marketId) ?? 0);
    let peak = running;
    for (const move of moves) {
      running += move.deltaWei;
      // Floor at zero: selling more than the window's opening position leaves nothing at risk,
      // not negative capital.
      if (running < 0n) running = 0n;
      if (running > peak) peak = running;
    }
    if (peak > 0n) out.set(marketId, Number(formatUnits(peak, primaryCollateral.decimals)));
  }
  return out;
}
