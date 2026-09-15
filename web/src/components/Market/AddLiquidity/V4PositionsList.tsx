import { Alert } from "@/components/Alert";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { formatPriceCents } from "@/components/LimitOrders/ordersShared";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import { displayBalance } from "@/lib/utils";
import { type V4Position, computeV4PositionAmounts, getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import { useCollectV4Fees, useRemoveV4Liquidity } from "@seer-pm/react/hooks/useManageV4Positions";
import { useUserV4Positions } from "@seer-pm/react/hooks/useUserV4Positions";
import type { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const REMOVE_OPTIONS_BPS = [2_500, 5_000, 7_500, 10_000] as const;

type RemoveBps = (typeof REMOVE_OPTIONS_BPS)[number];

// Same button language as the limit orders panel: at rest nothing on a position is primary, and
// removing only becomes the primary action inside the step that confirms how much.
const QUIET_BUTTON_CLASS = "btn btn-ghost btn-sm min-h-11 px-4 border border-separator-100";
const PRIMARY_BUTTON_CLASS = "btn btn-primary btn-sm min-h-11 px-4";

// Tier tokens are the AA-on-fill variants; the plain success/warning accents are ~2:1 on their fills.
const IN_RANGE_PILL_CLASS = "bg-[oklch(var(--tier-great-bg))] text-[oklch(var(--tier-great-fg))]";
const OUT_OF_RANGE_PILL_CLASS = "bg-[oklch(var(--tier-average-bg))] text-[oklch(var(--tier-average-fg))]";

export type TokenDisplay = { symbol: string; decimals: number };

export type PoolState = { sqrtPriceX96: bigint; tick: number } | null | undefined;

function positionRange(position: V4Position, outcomeIsToken0: boolean): { min: number; max: number } {
  const a = getOutcomePriceAtTick(position.tickLower, outcomeIsToken0);
  const b = getOutcomePriceAtTick(position.tickUpper, outcomeIsToken0);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

function shareOf(amount: bigint, bps: number): bigint {
  return (amount * BigInt(bps)) / 10_000n;
}

function Spinner() {
  return <span className="loading loading-spinner loading-xs" aria-hidden />;
}

/**
 * Where the position quotes on the outcome's 0¢–100¢ scale, with a marker at the current price.
 * Decorative: the same numbers are written out beside it.
 */
function RangeBar({ min, max, current, inRange }: { min: number; max: number; current?: number; inRange?: boolean }) {
  const toPercent = (price: number) => Math.min(100, Math.max(0, price * 100));
  // A very narrow range still gets a visible sliver.
  const width = Math.max(toPercent(max) - toPercent(min), 0.75);
  const left = Math.min(toPercent(min), 100 - width);

  return (
    <div aria-hidden className="space-y-1">
      <div className="relative h-1.5 rounded-full bg-base-300">
        <div
          className={clsx(
            "absolute inset-y-0 rounded-full",
            inRange === false ? "bg-base-content/40" : "bg-purple-primary",
          )}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {current !== undefined && (
          <div
            className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-base-content"
            style={{ left: `${toPercent(current)}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[12px] text-base-content/70 tabular-nums">
        <span>0¢</span>
        <span>100¢</span>
      </div>
    </div>
  );
}

/**
 * One V4 position, read the way the rest of the product reads prices: the outcome range in cents,
 * the current price against it, what the position holds and whether it is earning fees. Removing
 * goes through an inline step that picks a share and previews what comes back before signing.
 * Pass `showActions={false}` when the viewer is not the position owner.
 */
export function V4PositionRow({
  market,
  outcomeIndex,
  position,
  poolState,
  outcomeIsToken0,
  token0,
  token1,
  account,
  showActions = true,
}: {
  market: Market;
  outcomeIndex: number;
  position: V4Position;
  poolState: PoolState;
  outcomeIsToken0: boolean;
  token0: TokenDisplay;
  token1: TokenDisplay;
  account: Address;
  showActions?: boolean;
}) {
  const supports7702 = useCheck7702Support();
  const removeLiquidity = useRemoveV4Liquidity(toastifyTx, supports7702);
  const collectFees = useCollectV4Fees(toastifyTx, supports7702);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeBps, setRemoveBps] = useState<RemoveBps | null>(null);
  const removeTriggerRef = useRef<HTMLButtonElement>(null);
  const firstShareRef = useRef<HTMLButtonElement>(null);
  const removePanelId = useId();
  const removePromptId = useId();

  // Moving focus into the step keeps keyboard users on the decision they just opened.
  useEffect(() => {
    if (isRemoveOpen) {
      firstShareRef.current?.focus();
    }
  }, [isRemoveOpen]);

  const outcomeLabel = market.outcomes[outcomeIndex] ?? `Outcome ${outcomeIndex}`;
  const [outcomeToken, collateralToken] = outcomeIsToken0 ? [token0, token1] : [token1, token0];
  const collateralLabel = collateralToken.symbol || "collateral";

  const range = positionRange(position, outcomeIsToken0);
  const rangeLabel = `${formatPriceCents(range.min)} – ${formatPriceCents(range.max)}`;
  const positionName = `${outcomeLabel} ${rangeLabel} position`;
  const currentPrice = poolState ? getOutcomePriceAtTick(poolState.tick, outcomeIsToken0) : undefined;
  const inRange = poolState ? poolState.tick >= position.tickLower && poolState.tick < position.tickUpper : undefined;
  const isBusy = removeLiquidity.isPending || collectFees.isPending;

  const amounts = poolState
    ? computeV4PositionAmounts(position, {
        chainId: market.chainId,
        sqrtPriceX96: poolState.sqrtPriceX96,
        tick: poolState.tick,
      })
    : undefined;
  const held = amounts && {
    outcome: outcomeIsToken0 ? amounts.amount0 : amounts.amount1,
    collateral: outcomeIsToken0 ? amounts.amount1 : amounts.amount0,
  };

  // Zero sides are left out: "0 sUSDS" next to a live position reads like a loss. Dust that rounds
  // to zero at two decimals says so instead of showing "0.00".
  const describeAmounts = (outcomeAmount: bigint, collateralAmount: bigint) => {
    const format = (amount: bigint, decimals: number) => {
      const text = displayBalance(amount, decimals, true);
      return /^0(\.0+)?$/.test(text) ? "<0.01" : text;
    };
    const parts: string[] = [];
    if (outcomeAmount > 0n) {
      parts.push(`${format(outcomeAmount, outcomeToken.decimals)} ${outcomeLabel}`);
    }
    if (collateralAmount > 0n) {
      parts.push(`${format(collateralAmount, collateralToken.decimals)} ${collateralLabel}`);
    }
    return parts;
  };
  const heldParts = held ? describeAmounts(held.outcome, held.collateral) : [];
  const previewParts =
    held && removeBps !== null
      ? describeAmounts(shareOf(held.outcome, removeBps), shareOf(held.collateral, removeBps))
      : [];

  let rangeNote: string | undefined;
  if (inRange === false && currentPrice !== undefined && held) {
    const side = currentPrice <= range.min ? "below" : "above";
    const onlyToken = held.collateral === 0n ? outcomeLabel : held.outcome === 0n ? collateralLabel : undefined;
    rangeNote = `The price is ${side} your range, so this position isn't earning fees.${
      onlyToken ? ` It now holds only ${onlyToken}.` : ""
    }`;
  }

  const priceText =
    currentPrice !== undefined
      ? `Now ${formatPriceCents(currentPrice)}`
      : poolState === null
        ? "Current price unavailable"
        : undefined;

  const actionParams = poolState
    ? {
        chainId: market.chainId,
        position,
        sqrtPriceX96: poolState.sqrtPriceX96,
        tick: poolState.tick,
        recipient: account,
      }
    : undefined;

  const closeRemove = () => {
    setIsRemoveOpen(false);
    setRemoveBps(null);
    removeTriggerRef.current?.focus();
  };

  let confirmLabel = "Remove";
  if (removeBps === 10_000) confirmLabel = "Remove all";
  else if (removeBps !== null) confirmLabel = `Remove ${removeBps / 100}%`;

  return (
    <article aria-label={positionName} className="border border-separator-100 rounded-[12px] p-4 space-y-4 text-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[16px] font-semibold tabular-nums">{rangeLabel}</span>
            {inRange !== undefined && (
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold",
                  inRange ? IN_RANGE_PILL_CLASS : OUT_OF_RANGE_PILL_CLASS,
                )}
              >
                {inRange ? "In range" : "Out of range"}
              </span>
            )}
          </p>
          <p className="text-[13px] text-base-content/70 tabular-nums">
            {priceText}
            {priceText && <span aria-hidden> · </span>}
            Position #{position.tokenId.toString()}
          </p>
        </div>
        <dl className="tabular-nums sm:text-right">
          <dt className="text-[13px] text-base-content/70">Holding</dt>
          {held ? (
            heldParts.length > 0 ? (
              heldParts.map((part) => <dd key={part}>{part}</dd>)
            ) : (
              <dd>0</dd>
            )
          ) : poolState === null ? (
            <dd className="text-base-content/70">—</dd>
          ) : (
            <dd>
              <span className="shimmer-container block w-24 h-4" aria-hidden />
              <span className="sr-only">Loading amounts</span>
            </dd>
          )}
        </dl>
      </div>

      <RangeBar min={range.min} max={range.max} current={currentPrice} inRange={inRange} />

      {rangeNote && <p>{rangeNote}</p>}

      {showActions && (
        <SwitchChainButtonWrapper chainId={market.chainId}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={QUIET_BUTTON_CLASS}
              disabled={!actionParams || isBusy}
              aria-label={collectFees.isPending ? undefined : `Collect fees from ${positionName}`}
              onClick={() => actionParams && collectFees.mutate(actionParams)}
            >
              {collectFees.isPending ? (
                <>
                  <Spinner />
                  Collecting…
                </>
              ) : (
                "Collect fees"
              )}
            </button>
            <button
              ref={removeTriggerRef}
              type="button"
              className={QUIET_BUTTON_CLASS}
              disabled={!actionParams || isBusy}
              aria-expanded={isRemoveOpen}
              aria-controls={isRemoveOpen ? removePanelId : undefined}
              aria-label={`Remove liquidity from ${positionName}`}
              onClick={() => (isRemoveOpen ? closeRemove() : setIsRemoveOpen(true))}
            >
              Remove liquidity
            </button>
          </div>
        </SwitchChainButtonWrapper>
      )}

      {showActions && isRemoveOpen && (
        <fieldset
          id={removePanelId}
          aria-labelledby={removePromptId}
          className="min-w-0 space-y-3 border border-separator-100 bg-base-200/40 px-4 py-3"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !removeLiquidity.isPending) closeRemove();
          }}
        >
          <p id={removePromptId} className="text-[15px] font-semibold">
            How much of the {rangeLabel} position do you want to remove?
          </p>
          <div className="flex flex-wrap gap-2">
            {REMOVE_OPTIONS_BPS.map((bps, index) => {
              const selected = removeBps === bps;
              return (
                <button
                  key={bps}
                  ref={index === 0 ? firstShareRef : undefined}
                  type="button"
                  aria-pressed={selected}
                  className={clsx(
                    "btn btn-ghost btn-sm min-h-11 min-w-[4rem] px-3 border tabular-nums",
                    selected ? "border-2 border-purple-primary font-semibold" : "border-separator-100 font-normal",
                  )}
                  disabled={removeLiquidity.isPending}
                  onClick={() => setRemoveBps(bps)}
                >
                  {bps / 100}%
                </button>
              );
            })}
          </div>
          <p className="tabular-nums" aria-live="polite">
            {removeBps === null ? (
              "Pick a share to see what you'll get back."
            ) : previewParts.length > 0 ? (
              <>
                You'll get back about <span className="font-semibold">{previewParts.join(" + ")}</span>, plus any
                uncollected fees.{removeBps === 10_000 && " This closes the position."}
              </>
            ) : held ? (
              "Only uncollected fees would come back."
            ) : (
              "The amounts can't be estimated right now."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={QUIET_BUTTON_CLASS}
              disabled={removeLiquidity.isPending}
              onClick={closeRemove}
            >
              Keep position
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              disabled={removeBps === null || !actionParams || isBusy}
              onClick={() => {
                if (!actionParams || removeBps === null) return;
                removeLiquidity.mutate(
                  { ...actionParams, percentageBps: removeBps },
                  {
                    onSuccess: () => {
                      setIsRemoveOpen(false);
                      setRemoveBps(null);
                    },
                  },
                );
              }}
            >
              {removeLiquidity.isPending ? (
                <>
                  <Spinner />
                  Removing…
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </fieldset>
      )}
    </article>
  );
}

/**
 * The connected wallet's Uniswap V4 positions for one outcome pool, with remove / collect actions.
 * Renders nothing when the wallet has no position in the pool.
 */
export function V4PositionsList({
  market,
  outcomeIndex,
  poolState,
  outcomeIsToken0,
  token0,
  token1,
}: {
  market: Market;
  outcomeIndex: number;
  poolState: PoolState;
  outcomeIsToken0: boolean;
  token0: TokenDisplay;
  token1: TokenDisplay;
}) {
  const { address } = useAccount();
  const {
    data: positions = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useUserV4Positions(market, address, outcomeIndex);

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your positions</span>
        <div className="shimmer-container w-full h-[80px]" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" title="Couldn't load your positions">
        <div className="space-y-2">
          <p>Try again in a moment.</p>
          <button type="button" className="btn btn-sm btn-primary" disabled={isFetching} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </Alert>
    );
  }

  if (positions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">Your positions</div>
      {positions.map((position) => (
        <V4PositionRow
          key={position.tokenId.toString()}
          market={market}
          outcomeIndex={outcomeIndex}
          position={position}
          poolState={poolState}
          outcomeIsToken0={outcomeIsToken0}
          token0={token0}
          token1={token1}
          account={address}
        />
      ))}
    </div>
  );
}
