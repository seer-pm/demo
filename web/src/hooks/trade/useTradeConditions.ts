import { useSDaiDaiRatio } from "@/hooks/trade/handleSDAI";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useWrappedToken } from "@/hooks/useWrappedToken";

import { useMarket } from "@/hooks/useMarket";
import { Market } from "@/lib/market";
import { Token, getSelectedCollateral } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { TradeType } from "@swapr/sdk";
import { FieldErrors } from "react-hook-form";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";

interface Props {
  market: Market;
  fixedCollateral: Token | undefined;
  outcomeToken: Token;
  useAltCollateral: boolean;
  swapType: "buy" | "sell";
  tradeType: TradeType;
  errors: FieldErrors<{ amount: string }>;
}

export function useTradeConditions({
  market,
  fixedCollateral,
  outcomeToken,
  useAltCollateral,
  swapType,
  tradeType,
  errors,
}: Props) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  const isInstantSwap = useGlobalState((state) => state.isInstantSwap);
  const { address: account } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const isUseWrappedToken = useWrappedToken(account, market.chainId);
  const selectedCollateral =
    fixedCollateral || getSelectedCollateral(market.chainId, useAltCollateral, isUseWrappedToken);
  const { isFetching, sDaiToDai, daiToSDai } = useSDaiDaiRatio(market.chainId);

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
    sDaiToDai,
    daiToSDai,
    buyToken,
    sellToken,
    balance,
    isFetchingBalance,
    isShowXDAIBridgeLink,
    isCollateralNative,
    isBuyExactOutputNative,
    isSellToNative,
    isUseWrappedToken,
    amountErrorMessage,
  };
}
