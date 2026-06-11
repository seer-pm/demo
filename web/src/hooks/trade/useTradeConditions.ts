import { useShareAssetRatio } from "@/hooks/trade/useShareAssetRatio";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useTokenBalance } from "@seer-pm/react";

import { isTwoStringsEqual } from "@/lib/utils";
import { useMarket } from "@seer-pm/react";
import {
  Market,
  NATIVE_TOKEN,
  TradeType,
  getActiveCollateralProfile,
  getActivePrimaryCollateral,
  isPsm3SwapToken,
} from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { FieldErrors } from "react-hook-form";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";

interface Props {
  market: Market;
  fixedCollateral: Token | undefined;
  outcomeToken: Token;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  errors: FieldErrors<{ amount: string }>;
}

export function useTradeConditions({ market, outcomeToken, fixedCollateral, swapType, tradeType, errors }: Props) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const primaryCollateral = getActivePrimaryCollateral(market.chainId);
  const preferredCollateral = useGlobalState((state) => state.getPreferredCollateral(market.chainId, swapType));

  const selectedCollateral = fixedCollateral || preferredCollateral || primaryCollateral;

  const { address: account } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const { isFetching, sharesToAssets, assetsToShares } = useShareAssetRatio(market.chainId);

  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, selectedCollateral] : [selectedCollateral, outcomeToken];
  const { data: balance = BigInt(0), isFetching: isFetchingBalance } = useTokenBalance(
    account,
    sellToken.address,
    market.chainId,
  );
  const { data: nativeBalance = BigInt(0), isFetching: isFetchingNativeBalance } = useTokenBalance(
    account,
    NATIVE_TOKEN,
    market.chainId,
  );
  const amountErrorMessage = errors?.amount?.message;

  const showBridgeLink =
    account &&
    !isFetchingBalance &&
    !isFetchingNativeBalance &&
    ((nativeBalance === 0n && balance === 0n) || amountErrorMessage === "Not enough balance.");

  const activeProfile = getActiveCollateralProfile(market.chainId);
  const isSecondaryCollateral =
    isTwoStringsEqual(selectedCollateral.address, activeProfile.secondary?.address) ||
    isTwoStringsEqual(selectedCollateral.address, activeProfile.secondary?.wrapped?.address);
  const isCollateralNative =
    market.chainId === gnosis.id && isTwoStringsEqual(selectedCollateral.address, NATIVE_TOKEN);

  const isBuyExactOutputNative = isCollateralNative && swapType === "buy" && tradeType === TradeType.EXACT_OUTPUT;

  const isSellToNative = isCollateralNative && swapType === "sell";

  const isPsm3Collateral = isPsm3SwapToken(market.chainId, selectedCollateral.address);

  return {
    maxSlippage,
    isInstantSwap,
    account,
    parentMarket,
    selectedCollateral,
    isFetching,
    sharesToAssets,
    assetsToShares,
    buyToken,
    sellToken,
    balance,
    isFetchingBalance,
    showBridgeLink,
    isSecondaryCollateral,
    isBuyExactOutputNative,
    isSellToNative,
    isPsm3Collateral,
    amountErrorMessage,
  };
}
