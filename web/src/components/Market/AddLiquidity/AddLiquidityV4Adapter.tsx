import { toastifyTx } from "@/lib/toastify";
import { getLiquidityUrl } from "@seer-pm/order-book";
import { getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import { useTokenBalance, useTokensInfo } from "@seer-pm/react";
import {
  computeV4DerivedAmounts,
  useAddV4Liquidity as useAddV4LiquidityBase,
} from "@seer-pm/react/hooks/useAddV4Liquidity";
import {
  useIsOrderBookPoolInitialized,
  useOrderBookPoolParams,
  useV4PoolState,
} from "@seer-pm/react/hooks/useIsOrderBookPoolInitialized";
import { type Market, getActivePrimaryCollateral } from "@seer-pm/sdk";
import { useCallback, useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { AddLiquidityForm, type AddLiquidityFormValues } from "./AddLiquidityForm";

interface AddLiquidityV4AdapterProps {
  market: Market;
  outcomeIndex: number;
  closeModal: () => void;
  hideReturnButton?: boolean;
}

export function AddLiquidityV4Adapter({
  market,
  outcomeIndex,
  closeModal,
  hideReturnButton,
}: AddLiquidityV4AdapterProps) {
  const { address } = useAccount();
  const poolParams = useOrderBookPoolParams(market, outcomeIndex);
  const { data: isPoolInitialized, isLoading: isPoolStatusLoading } = useIsOrderBookPoolInitialized(
    market,
    outcomeIndex,
  );
  const { data: poolState } = useV4PoolState(market, outcomeIndex);
  const addLiquidity = useAddV4LiquidityBase(toastifyTx);

  const collateral = getActivePrimaryCollateral(market.chainId);
  const outcomeTokenAddress = market.wrappedTokens[outcomeIndex];

  const { data: outcomeBalance = 0n } = useTokenBalance(address, outcomeTokenAddress, market.chainId);
  const { data: collateralBalance = 0n } = useTokenBalance(address, collateral.address, market.chainId);
  const { data: tokensInfo = [] } = useTokensInfo([outcomeTokenAddress, collateral.address], market.chainId);

  const currentTick = isPoolInitialized ? poolState?.tick : undefined;
  const outcomeIsToken0 = poolParams?.outcomeIsToken0;
  const currentPrice = useMemo(() => {
    if (currentTick === undefined || outcomeIsToken0 === undefined) {
      return undefined;
    }
    return getOutcomePriceAtTick(currentTick, outcomeIsToken0);
  }, [currentTick, outcomeIsToken0]);

  if (!poolParams) {
    return null;
  }

  const { token0, token1, outcomeIsToken0: outcomeIsToken0Resolved } = poolParams;
  const outcomeSymbol = tokensInfo[0]?.symbol ?? "Outcome";

  const token0Info = {
    address: token0,
    symbol: outcomeIsToken0Resolved ? outcomeSymbol : collateral.symbol,
    decimals: outcomeIsToken0Resolved ? 18 : collateral.decimals,
    balance: outcomeIsToken0Resolved ? outcomeBalance : collateralBalance,
  };

  const token1Info = {
    address: token1,
    symbol: outcomeIsToken0Resolved ? collateral.symbol : outcomeSymbol,
    decimals: outcomeIsToken0Resolved ? collateral.decimals : 18,
    balance: outcomeIsToken0Resolved ? collateralBalance : outcomeBalance,
  };
  const computeDerived = useCallback(
    (values: AddLiquidityFormValues, editedField: "amount0" | "amount1") => {
      const amount0 =
        editedField === "amount0" && values.amount0 ? parseUnits(values.amount0, token0Info.decimals) : undefined;
      const amount1 =
        editedField === "amount1" && values.amount1 ? parseUnits(values.amount1, token1Info.decimals) : undefined;

      const derived = computeV4DerivedAmounts(market, outcomeIndex, {
        minPrice: values.minPrice,
        maxPrice: values.maxPrice,
        amount0,
        amount1,
        initialPrice: isPoolInitialized ? undefined : values.initialPrice,
        poolSqrtPriceX96: isPoolInitialized ? poolState?.sqrtPriceX96 : undefined,
        token0Decimals: token0Info.decimals,
        token1Decimals: token1Info.decimals,
      });

      return {
        ...values,
        amount0:
          editedField === "amount0"
            ? values.amount0
            : derived.amount0 > 0n
              ? formatUnits(derived.amount0, token0Info.decimals)
              : "",
        amount1:
          editedField === "amount1"
            ? values.amount1
            : derived.amount1 > 0n
              ? formatUnits(derived.amount1, token1Info.decimals)
              : "",
      };
    },
    [market, outcomeIndex, isPoolInitialized, poolState?.sqrtPriceX96, token0Info.decimals, token1Info.decimals],
  );

  const handleSubmit = async (values: AddLiquidityFormValues) => {
    if (!address) {
      throw new Error("Connect your wallet");
    }

    await addLiquidity.mutateAsync({
      market,
      outcomeIndex,
      account: address,
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      amount0: parseUnits(values.amount0 || "0", token0Info.decimals),
      amount1: parseUnits(values.amount1 || "0", token1Info.decimals),
      ...(isPoolInitialized || values.initialPrice === undefined ? {} : { initialPrice: values.initialPrice }),
    });
  };

  return (
    <AddLiquidityForm
      chainId={market.chainId}
      token0={token0Info}
      token1={token1Info}
      outcomeIsToken0={outcomeIsToken0Resolved}
      currentPrice={currentPrice}
      currentTick={currentTick}
      isPoolInitialized={isPoolInitialized}
      isPoolStatusLoading={isPoolStatusLoading}
      isSubmitting={addLiquidity.isPending}
      onComputeDerivedAmount={computeDerived}
      onSubmit={handleSubmit}
      closeModal={closeModal}
      hideReturnButton={hideReturnButton}
      uniswapPoolUrl={getLiquidityUrl(market, outcomeIndex, {
        isPoolInitialized: Boolean(isPoolInitialized),
      })}
    />
  );
}
