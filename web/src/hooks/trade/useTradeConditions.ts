import { useShareAssetRatio } from "@/hooks/trade/useShareAssetRatio";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useTokenBalance } from "@/hooks/useTokenBalance";

import { useMarket } from "@/hooks/useMarket";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { TradeType } from "@swapr/sdk";
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
  const primaryCollateral = COLLATERAL_TOKENS[market.chainId].primary;
  const preferredCollateral = useGlobalState((state) => state.getPreferredCollateral(market.chainId));
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

  const isShowXDAIBridgeLink =
    account &&
    market.chainId === gnosis.id &&
    !isFetchingBalance &&
    !isFetchingNativeBalance &&
    ((nativeBalance === 0n && balance === 0n) || amountErrorMessage === "Not enough balance.");

  const isSecondaryCollateral =
    isTwoStringsEqual(selectedCollateral.address, COLLATERAL_TOKENS[market.chainId].secondary?.address) ||
    isTwoStringsEqual(selectedCollateral.address, COLLATERAL_TOKENS[market.chainId].secondary?.wrapped?.address);
  const isCollateralNative =
    market.chainId === gnosis.id && isTwoStringsEqual(selectedCollateral.address, NATIVE_TOKEN);

  const isBuyExactOutputNative = isCollateralNative && swapType === "buy" && tradeType === TradeType.EXACT_OUTPUT;

  const isSellToNative = isCollateralNative && swapType === "sell";

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
    isShowXDAIBridgeLink,
    isSecondaryCollateral,
    isBuyExactOutputNative,
    isSellToNative,
    amountErrorMessage,
  };
}
