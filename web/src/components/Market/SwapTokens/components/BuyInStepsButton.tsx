import Button from "@/components/Form/Button";
import { depositFromNativeToSDAI, depositToSDAI } from "@/hooks/trade/handleSDAI";
import { approveIfNeeded, getConvertedShares, setSwaprTradeLimit, setUniswapTradeLimit } from "@/hooks/trade/utils";
import { SupportedChain, filterChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastError } from "@/lib/toastify";
import { Token } from "@/lib/tokens";
import { NATIVE_TOKEN, isTwoStringsEqual } from "@/lib/utils";
import { DAI, SwaprV3Trade, Trade, UniswapTrade, WXDAI } from "@swapr/sdk";
import { useState } from "react";
import { Address, parseUnits } from "viem";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";

export default function BuyInStepsButton({
  trade,
  collateral,
  originalAmount,
  isLoading,
  onSubmit,
}: {
  trade: Trade;
  collateral: Token;
  originalAmount: string;
  isLoading: boolean;
  onSubmit: (trade: SwaprV3Trade | UniswapTrade) => Promise<void>;
}) {
  const chainId = filterChain(trade.chainId);
  const { address: account } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingStep, setLoadingStep] = useState(false);
  const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
  const wxDAIAddress = WXDAI[trade.chainId]?.address as Address;
  const DAIAddress = DAI[trade.chainId]?.address as Address;
  const amount = parseUnits(originalAmount, collateral.decimals);
  const [shares, setShares] = useState<bigint | undefined>();
  const approveConvert = async () => {
    if (!account) throw "Account not found!";
    if (isTwoStringsEqual(collateral.address, NATIVE_TOKEN)) {
      setCurrentStep(1);
      return;
    }
    await approveIfNeeded(
      trade.chainId === gnosis.id ? wxDAIAddress : DAIAddress,
      account,
      sDAIAddress,
      amount,
      trade.chainId as SupportedChain,
    );
    setCurrentStep(1);
  };
  const convertToSDAI = async () => {
    if (!account) throw "Account not found!";
    const convertFn = isTwoStringsEqual(collateral.address, NATIVE_TOKEN) ? depositFromNativeToSDAI : depositToSDAI;
    const receipt = await convertFn({ amount, chainId, owner: account });
    const shares = getConvertedShares(receipt);
    setShares(shares);
    setCurrentStep(2);
  };
  const approveSDAI = async () => {
    if (!account) throw "Account not found!";
    await approveIfNeeded(
      sDAIAddress,
      account,
      trade.approveAddress as Address,
      shares ?? 0n,
      trade.chainId as SupportedChain,
    );
    setCurrentStep(3);
  };
  const buyTokens = async () => {
    if (!account) throw "Account not found!";
    const newTrade =
      trade instanceof SwaprV3Trade
        ? setSwaprTradeLimit(trade, shares ?? 0n)
        : await setUniswapTradeLimit(trade as UniswapTrade, shares ?? 0n, account);
    await onSubmit(newTrade);
  };
  const executeFns = [approveConvert, convertToSDAI, approveSDAI, buyTokens];
  const btnTexts = ["Approve Convert", "Convert to sDAI", "Approve sDAI", "Buy"];

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
