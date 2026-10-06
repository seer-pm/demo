import { isTwoStringsEqual } from "@/lib/utils";
import { useMarketPools, useTokensInfo } from "@seer-pm/react";
import { Market, type Token, getOutcomeSwapCollaterals } from "@seer-pm/sdk";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";

type ChildMarketSwapCollateral = {
  /** The collateral the swap widget trades in. `undefined` on a root market, which keeps its own dropdown. */
  collateral: Token | undefined;
  /** Every collateral the outcome can be swapped against; a dropdown is only worth showing past one. */
  options: Token[];
  setCollateral: (token: Token) => void;
};

/**
 * Collateral selection for the swap widget of a child Generic market.
 *
 * The market collateral (the parent outcome token) is always available and the main collateral joins
 * it when the outcome has a pool with liquidity against it (see `getOutcomeSwapCollaterals`). The
 * choice lives in component state rather than the persisted per-chain preference: a parent outcome
 * token only means something on this market, and the default depends on which pools hold liquidity.
 */
export function useChildMarketSwapCollateral(market: Market, outcomeIndex: number): ChildMarketSwapCollateral {
  const isChildMarket = market.type === "Generic" && market.parentMarket.id !== zeroAddress;
  const { data: outcomePools } = useMarketPools(market);

  const { options, defaultCollateral } = useMemo(() => {
    if (!isChildMarket) {
      return { options: [] as Address[], defaultCollateral: undefined };
    }
    return getOutcomeSwapCollaterals(market, outcomeIndex, outcomePools?.[outcomeIndex] ?? []);
  }, [isChildMarket, market, outcomeIndex, outcomePools]);

  const { data: optionTokens } = useTokensInfo(isChildMarket ? options : undefined, market.chainId);

  // A choice belongs to one outcome of one market: a choice keyed on another is ignored, so switching
  // either starts over from the default without waiting for an effect to clear the state.
  const selectionKey = `${market.id}-${outcomeIndex}`;
  const [selection, setSelection] = useState<{ key: string; address: Address } | undefined>();
  const selected = selection?.key === selectionKey ? selection.address : undefined;

  const tokens = optionTokens ?? [];
  const selectedToken =
    (selected && tokens.find((token) => isTwoStringsEqual(token.address, selected))) ||
    tokens.find((token) => isTwoStringsEqual(token.address, defaultCollateral));

  return {
    collateral: isChildMarket ? selectedToken : undefined,
    options: tokens,
    setCollateral: (token) => setSelection({ key: selectionKey, address: token.address }),
  };
}
