/**
 * Weighted-average cost basis per outcome token, for one wallet on one chain.
 *
 * Every rule here is the written spec the product agreed on, so a change to a rule is a change
 * to what traders are told their entry price is, not an implementation detail:
 *
 * - Costs are kept in the market's primary collateral. A buy adds what was paid; a sale removes
 *   the sold amount at the running average and books the difference to `realized`.
 * - The collateral side of any event is either primary (cost = amount) or another tracked token
 *   (a conditional market settles in its parent's outcome token). Paying with a tracked token is a
 *   conversion: the child inherits the parent's average cost for the amount handed over and the
 *   parent position shrinks by that cost. Nothing is realized until primary collateral changes
 *   hands, so a profit on a child shows up when the parent tokens it paid out are finally sold.
 * - A split spreads the collateral's cost across the outcomes by their pool prices at that moment,
 *   normalised to one; with no price for any outcome it falls back to 1/N. A merge or a redeem
 *   removes each token at its average and treats what comes back as the sale proceeds.
 * - A transfer from a wallet outside the account's identity enters at fair value (the price the
 *   caller supplies) and leaves at the running average without realizing. A transfer inside the
 *   identity carries the sender's average with it: the caller passes that average as the
 *   `unitCost`, so the fold needs no knowledge of other wallets.
 * - A token that ever entered or left an AMM position is marked `lpTouched`. Its figures are still
 *   folded, so the swaps are not lost when LP accounting is added, but a consumer must not show an
 *   entry price for it: the pool returns a different amount than it took, and that difference is
 *   not booked anywhere yet.
 * - Removing more than the position holds (an event the indexers missed, or a venue not covered)
 *   never produces a negative quantity: the excess is removed at zero cost and the token is marked
 *   `approximate`, so the row says so instead of showing a figure built on a gap.
 */

export type BasisTokenId = string;

/** What an event was paid with or paid out in. */
export type CollateralSide =
  | { kind: "primary" }
  /** A tracked outcome token (the parent outcome on a conditional market). */
  | { kind: "token"; tokenId: BasisTokenId };

export type BasisEvent = {
  /** Unix seconds. Events are folded in `(timestamp, seq)` order. */
  timestamp: number;
  /** Tie-breaker inside a block: log index, or any monotonic sequence the source provides. */
  seq: number;
} & (
  | {
      kind: "swap";
      tokenId: BasisTokenId;
      /** Outcome tokens received (positive) or handed over (negative). */
      tokenAmount: number;
      /** Collateral handed over on a buy, received on a sale. Always positive. Fees included. */
      collateralAmount: number;
      collateral: CollateralSide;
    }
  | {
      kind: "split";
      tokenIds: BasisTokenId[];
      /** Outcome tokens minted of each `tokenIds` entry; also the collateral amount locked. */
      amount: number;
      collateral: CollateralSide;
      /** Pool price per `tokenIds` entry at the split, in the same order; `undefined` when unknown. */
      prices?: (number | undefined)[];
      /**
       * Weights to use when no outcome has a price, in `tokenIds` order; 1/N when absent. A Generic
       * market passes 0 for Invalid and an even share for the rest, since Invalid is never bought on
       * purpose and a third of the collateral booked on it would read as a loss that never happened.
       */
      fallbackWeights?: number[];
    }
  | {
      kind: "merge";
      tokenIds: BasisTokenId[];
      /** Outcome tokens burned of each `tokenIds` entry; also the collateral amount returned. */
      amount: number;
      collateral: CollateralSide;
    }
  | {
      kind: "redeem";
      tokenId: BasisTokenId;
      amount: number;
      /** Collateral received for `amount`; zero for a losing outcome. */
      payout: number;
      collateral: CollateralSide;
    }
  | {
      kind: "transferIn";
      tokenId: BasisTokenId;
      amount: number;
      /** Cost per token to book: the sender's average inside the identity, fair value outside it. */
      unitCost: number;
    }
  | {
      kind: "transferOut";
      tokenId: BasisTokenId;
      amount: number;
      /**
       * Set when the receiver is another wallet of the same identity: the ledger records the average
       * the tokens leave at under this key, and the receiver's fold books them at that cost.
       */
      handoffKey?: string;
    }
  | { kind: "lp"; tokenId: BasisTokenId }
);

export type TokenBasis = {
  tokenId: BasisTokenId;
  /** Outcome tokens the fold believes the wallet holds. */
  quantity: number;
  /** Remaining cost of `quantity`, in primary collateral. */
  cost: number;
  /** `cost / quantity`; undefined with no position. */
  averageCost: number | undefined;
  /** Primary collateral gained or lost on completed round trips (sales, merges, redeems). */
  realized: number;
  /** Primary collateral spent buying this token, over the whole history. Not reduced by sales. */
  totalBought: number;
  /** Primary collateral received selling, merging or redeeming this token, over the whole history. */
  totalSold: number;
  lpTouched: boolean;
  approximate: boolean;
  /** Some split that minted this token had no pool price and was spread 1/N. */
  evenSplit: boolean;
  /** Timestamp of the last event that touched the token. */
  lastEventAt: number | undefined;
};

type State = {
  quantity: number;
  cost: number;
  realized: number;
  totalBought: number;
  totalSold: number;
  lpTouched: boolean;
  approximate: boolean;
  evenSplit: boolean;
  lastEventAt: number | undefined;
};

/** Amounts below this are float residue from a position fully closed, not a holding. */
const DUST = 1e-9;

function blank(): State {
  return {
    quantity: 0,
    cost: 0,
    realized: 0,
    totalBought: 0,
    totalSold: 0,
    lpTouched: false,
    approximate: false,
    evenSplit: false,
    lastEventAt: undefined,
  };
}

/**
 * Pool prices normalised to sum to one. Without a usable price the `fallback` weights apply, or an
 * even 1/N when there are none; `even` reports that the fallback was used.
 */
export function splitWeights(
  count: number,
  prices?: (number | undefined)[],
  fallback?: number[],
): { weights: number[]; even: boolean } {
  const usable = (prices ?? []).map((price) => (typeof price === "number" && price > 0 ? price : 0));
  const total = usable.reduce((sum, price) => sum + price, 0);
  if (count <= 0) return { weights: [], even: false };
  if (!prices || usable.length !== count || total <= 0) {
    const fallbackTotal = fallback?.length === count ? fallback.reduce((sum, w) => sum + w, 0) : 0;
    const weights =
      fallback && fallbackTotal > 0
        ? fallback.map((w) => w / fallbackTotal)
        : Array.from({ length: count }, () => 1 / count);
    return { weights, even: true };
  }
  return { weights: usable.map((price) => price / total), even: false };
}

export class CostBasisLedger {
  private readonly states = new Map<BasisTokenId, State>();
  /** Average cost at which tokens left for another wallet of the identity, by `handoffKey`. */
  readonly handoffs = new Map<string, number>();

  private state(tokenId: BasisTokenId): State {
    let state = this.states.get(tokenId);
    if (!state) {
      state = blank();
      this.states.set(tokenId, state);
    }
    return state;
  }

  /** Adds `amount` tokens that cost `cost` in primary collateral. */
  private add(tokenId: BasisTokenId, amount: number, cost: number, at: number): void {
    if (amount <= 0) return;
    const state = this.state(tokenId);
    state.quantity += amount;
    state.cost += cost;
    state.totalBought += cost;
    state.lastEventAt = at;
  }

  /**
   * Removes `amount` tokens at the running average and returns the cost released. Removing more
   * than held releases only what is there and marks the token approximate; `short` reports that,
   * so whatever was paid for with the missing tokens can be marked approximate too.
   */
  private remove(tokenId: BasisTokenId, amount: number, at: number): { released: number; short: boolean } {
    if (amount <= 0) return { released: 0, short: false };
    const state = this.state(tokenId);
    state.lastEventAt = at;
    if (state.quantity <= DUST) {
      state.approximate = true;
      state.quantity = 0;
      state.cost = 0;
      return { released: 0, short: true };
    }
    const average = state.cost / state.quantity;
    const removed = Math.min(amount, state.quantity);
    const short = removed < amount;
    if (short) state.approximate = true;
    const released = average * removed;
    state.quantity -= removed;
    state.cost -= released;
    if (state.quantity <= DUST) {
      state.quantity = 0;
      state.cost = 0;
    }
    return { released, short };
  }

  /**
   * Cost, in primary collateral, of handing over `amount` of the collateral side. Primary is its
   * own cost; a tracked token releases its average cost and shrinks, which is the conversion rule.
   */
  private payWith(side: CollateralSide, amount: number, at: number): { cost: number; short: boolean } {
    if (side.kind === "primary") return { cost: amount, short: false };
    const { released, short } = this.remove(side.tokenId, amount, at);
    return { cost: released, short };
  }

  /**
   * Books `amount` of the collateral side coming back against `releasedCost`. Primary realizes the
   * difference; a tracked token absorbs the released cost and grows, realizing nothing.
   */
  private receiveInto(side: CollateralSide, amount: number, releasedCost: number, at: number): number {
    if (side.kind === "primary") return amount - releasedCost;
    this.add(side.tokenId, amount, releasedCost, at);
    return 0;
  }

  apply(event: BasisEvent): void {
    const at = event.timestamp;
    switch (event.kind) {
      case "swap": {
        if (event.tokenAmount > 0) {
          const { cost, short } = this.payWith(event.collateral, event.collateralAmount, at);
          this.add(event.tokenId, event.tokenAmount, cost, at);
          if (short) this.state(event.tokenId).approximate = true;
        } else if (event.tokenAmount < 0) {
          const { released } = this.remove(event.tokenId, -event.tokenAmount, at);
          const state = this.state(event.tokenId);
          const realized = this.receiveInto(event.collateral, event.collateralAmount, released, at);
          state.realized += realized;
          if (event.collateral.kind === "primary") state.totalSold += event.collateralAmount;
        }
        return;
      }
      case "split": {
        const { cost, short } = this.payWith(event.collateral, event.amount, at);
        const { weights, even } = splitWeights(event.tokenIds.length, event.prices, event.fallbackWeights);
        event.tokenIds.forEach((tokenId, index) => {
          this.add(tokenId, event.amount, cost * weights[index], at);
          const state = this.state(tokenId);
          if (short) state.approximate = true;
          if (even) state.evenSplit = true;
        });
        return;
      }
      case "merge": {
        const releasedBy = new Map<BasisTokenId, number>();
        let released = 0;
        for (const tokenId of event.tokenIds) {
          const part = this.remove(tokenId, event.amount, at).released;
          releasedBy.set(tokenId, (releasedBy.get(tokenId) ?? 0) + part);
          released += part;
        }
        const realized = this.receiveInto(event.collateral, event.amount, released, at);
        // The round trip belongs to the set, not to one outcome: the gain and the proceeds are
        // spread by each token's share of the cost it released, so an outcome that cost nothing
        // (Invalid, typically) does not read as sold for a third of the collateral.
        this.distribute(releasedBy, released, realized, event.collateral.kind === "primary" ? event.amount : 0, at);
        return;
      }
      case "redeem": {
        const { released } = this.remove(event.tokenId, event.amount, at);
        const state = this.state(event.tokenId);
        state.realized += this.receiveInto(event.collateral, event.payout, released, at);
        if (event.collateral.kind === "primary") state.totalSold += event.payout;
        return;
      }
      case "transferIn": {
        this.add(event.tokenId, event.amount, event.amount * event.unitCost, at);
        // Fair-value entries are not purchases: they must not inflate what the wallet "bought".
        this.state(event.tokenId).totalBought -= event.amount * event.unitCost;
        return;
      }
      case "transferOut": {
        if (event.handoffKey) {
          const average = this.averageCost(event.tokenId);
          if (average !== undefined) this.handoffs.set(event.handoffKey, average);
        }
        this.remove(event.tokenId, event.amount, at);
        return;
      }
      case "lp": {
        const state = this.state(event.tokenId);
        state.lpTouched = true;
        state.lastEventAt = at;
        return;
      }
    }
  }

  /**
   * Spreads a set-level realized gain and proceeds across the tokens of a merge by the cost each
   * one released; evenly when nothing was released, since the set was still one trade.
   */
  private distribute(
    releasedBy: Map<BasisTokenId, number>,
    releasedTotal: number,
    realized: number,
    proceeds: number,
    at: number,
  ): void {
    if (releasedBy.size === 0) return;
    for (const [tokenId, part] of releasedBy) {
      const share = releasedTotal > 0 ? part / releasedTotal : 1 / releasedBy.size;
      const state = this.state(tokenId);
      state.realized += realized * share;
      state.totalSold += proceeds * share;
      state.lastEventAt = at;
    }
  }

  /** The average cost a transfer inside the identity carries to the receiving wallet. */
  averageCost(tokenId: BasisTokenId): number | undefined {
    const state = this.states.get(tokenId);
    if (!state || state.quantity <= DUST) return undefined;
    return state.cost / state.quantity;
  }

  snapshot(): Map<BasisTokenId, TokenBasis> {
    const out = new Map<BasisTokenId, TokenBasis>();
    for (const [tokenId, state] of this.states) {
      out.set(tokenId, {
        tokenId,
        quantity: state.quantity,
        cost: state.cost,
        averageCost: state.quantity > DUST ? state.cost / state.quantity : undefined,
        realized: state.realized,
        totalBought: state.totalBought,
        totalSold: state.totalSold,
        lpTouched: state.lpTouched,
        approximate: state.approximate,
        evenSplit: state.evenSplit,
        lastEventAt: state.lastEventAt,
      });
    }
    return out;
  }
}

export function sortBasisEvents<T extends { timestamp: number; seq: number }>(events: readonly T[]): T[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp || a.seq - b.seq);
}

/** Folds a wallet's events on one chain into a per-token basis. Events may arrive in any order. */
export function foldCostBasis(events: readonly BasisEvent[]): Map<BasisTokenId, TokenBasis> {
  return foldCostBasisLedger(events).snapshot();
}

export function foldCostBasisLedger(events: readonly BasisEvent[]): CostBasisLedger {
  const ledger = new CostBasisLedger();
  for (const event of sortBasisEvents(events)) {
    ledger.apply(event);
  }
  return ledger;
}
