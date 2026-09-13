import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import { displayBalance, displayNumber } from "@/lib/utils";
import { type V4Position, computeV4PositionAmounts, getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import { useCollectV4Fees, useRemoveV4Liquidity } from "@seer-pm/react/hooks/useManageV4Positions";
import { useUserV4Positions } from "@seer-pm/react/hooks/useUserV4Positions";
import type { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const REMOVE_OPTIONS_BPS = [2_500, 5_000, 7_500, 10_000] as const;

type TokenDisplay = { symbol: string; decimals: number };

type PoolState = { sqrtPriceX96: bigint; tick: number } | null | undefined;

function positionRange(position: V4Position, outcomeIsToken0: boolean): { min: number; max: number } {
  const a = getOutcomePriceAtTick(position.tickLower, outcomeIsToken0);
  const b = getOutcomePriceAtTick(position.tickUpper, outcomeIsToken0);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

function V4PositionRow({
  market,
  position,
  poolState,
  outcomeIsToken0,
  token0,
  token1,
  account,
}: {
  market: Market;
  position: V4Position;
  poolState: PoolState;
  outcomeIsToken0: boolean;
  token0: TokenDisplay;
  token1: TokenDisplay;
  account: Address;
}) {
  const supports7702 = useCheck7702Support();
  const removeLiquidity = useRemoveV4Liquidity(toastifyTx, supports7702);
  const collectFees = useCollectV4Fees(toastifyTx, supports7702);
  const [removeBps, setRemoveBps] = useState<(typeof REMOVE_OPTIONS_BPS)[number]>(10_000);

  const range = positionRange(position, outcomeIsToken0);
  const amounts = poolState
    ? computeV4PositionAmounts(position, {
        chainId: market.chainId,
        sqrtPriceX96: poolState.sqrtPriceX96,
        tick: poolState.tick,
      })
    : undefined;
  const inRange = poolState ? poolState.tick >= position.tickLower && poolState.tick < position.tickUpper : undefined;
  const isBusy = removeLiquidity.isPending || collectFees.isPending;

  const actionParams = poolState
    ? {
        chainId: market.chainId,
        position,
        sqrtPriceX96: poolState.sqrtPriceX96,
        tick: poolState.tick,
        recipient: account,
      }
    : undefined;

  return (
    <div className="border border-separator-100 rounded-[12px] p-4 space-y-3 text-[14px]">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="space-y-1">
          <p className="font-semibold">
            Position #{position.tokenId.toString()}{" "}
            {inRange !== undefined && (
              <span
                className={clsx(
                  "ml-2 text-[12px] font-normal px-2 py-[2px] rounded-full",
                  inRange ? "bg-success-light text-success-primary" : "bg-warning-light text-warning-primary",
                )}
              >
                {inRange ? "In range" : "Out of range"}
              </span>
            )}
          </p>
          <p className="text-black-secondary">
            Price range: {displayNumber(range.min, 3)} – {displayNumber(range.max, 3)}
          </p>
        </div>
        <div className="text-right space-y-1">
          {amounts ? (
            <>
              <p>
                {displayBalance(amounts.amount0, token0.decimals, true)} {token0.symbol}
              </p>
              <p>
                {displayBalance(amounts.amount1, token1.decimals, true)} {token1.symbol}
              </p>
            </>
          ) : (
            <div className="shimmer-container w-24 h-4" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {REMOVE_OPTIONS_BPS.map((bps) => (
            <button
              key={bps}
              type="button"
              className={clsx(
                "px-2 py-1 rounded border text-[12px]",
                removeBps === bps ? "bg-purple-primary text-white border-purple-primary" : "border-separator-100",
              )}
              onClick={() => setRemoveBps(bps)}
              disabled={isBusy}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
        <SwitchChainButtonWrapper chainId={market.chainId}>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="small"
              text={removeBps === 10_000 ? "Remove all" : `Remove ${removeBps / 100}%`}
              isLoading={removeLiquidity.isPending}
              disabled={!actionParams || isBusy}
              onClick={() => actionParams && removeLiquidity.mutate({ ...actionParams, percentageBps: removeBps })}
            />
            <Button
              type="button"
              variant="secondary"
              size="small"
              text="Collect fees"
              isLoading={collectFees.isPending}
              disabled={!actionParams || isBusy}
              onClick={() => actionParams && collectFees.mutate(actionParams)}
            />
          </div>
        </SwitchChainButtonWrapper>
      </div>
    </div>
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
