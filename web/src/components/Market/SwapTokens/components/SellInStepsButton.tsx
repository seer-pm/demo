import Button from "@/components/Form/Button";
import { useTrade } from "@/hooks/trade";
import { S_DAI_ADAPTER, redeemFromSDAI, redeemFromSDAIToNative } from "@/hooks/trade/handleSDAI";
import { approveIfNeeded } from "@/hooks/trade/utils";
import { SupportedChain, filterChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastError } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { SwaprV3Trade, Trade, UniswapTrade } from "@swapr/sdk";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function SellInStepsButton({
  trade,
  collateral,
  isLoading,
  closeModalAndReset,
}: {
  trade: Trade;
  collateral: Token;
  isLoading: boolean;
  closeModalAndReset: () => void;
}) {
  const { address: account } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingStep, setLoadingStep] = useState(false);
  const sDAIAddress = COLLATERAL_TOKENS[filterChain(trade.chainId)].primary.address;
  const receivedAmount = BigInt(trade.outputAmount.raw.toString());

  const tradeTokens = useTrade(() => {});
  const sellTokens = async () => {
    if (!account) throw "Account not found!";
    await tradeTokens.mutateAsync({
      trade: trade as SwaprV3Trade | UniswapTrade,
      account,
      isBuyExactOutputNative: false,
    });
    setCurrentStep(1);
  };

  const approveConvert = async () => {
    if (!account) throw "Account not found!";
    if (isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
      await approveIfNeeded(sDAIAddress, account, S_DAI_ADAPTER, receivedAmount, trade.chainId as SupportedChain);
      setCurrentStep(2);
      return;
    }
    setCurrentStep(2);
  };
  const convertToDAI = async () => {
    if (!account) throw "Account not found!";
    const convertFn = isTwoStringsEqual(collateral.address, NATIVE_TOKEN) ? redeemFromSDAIToNative : redeemFromSDAI;
    await convertFn({ amount: receivedAmount, chainId: filterChain(trade.chainId), owner: account });
    closeModalAndReset();
  };

  const executeFns = [sellTokens, approveConvert, convertToDAI];
  const btnTexts = ["Sell", "Approve Convert", `Convert To ${collateral.symbol}`];

  return (
    <Button
      variant="primary"
      type="submit"
      isLoading={isLoading || isLoadingStep}
      text={`${btnTexts[currentStep]} (${currentStep + 1}/${btnTexts.length})`}
      onClick={async () => {
        setLoadingStep(true);
        try {
          await executeFns[currentStep]();
          // biome-ignore lint/suspicious/noExplicitAny:
        } catch (e: any) {
          if (e && e?.cause?.code !== 4001) {
            toastError({ title: e?.details || e?.message || e });
          }
        } finally {
          setLoadingStep(false);
        }
      }}
    />
  );
}
