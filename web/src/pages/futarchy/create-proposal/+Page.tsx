import { Alert } from "@/components/Alert";
import { DateFormValues, MarketTypeFormValues, OutcomesFormValues } from "@/components/MarketForm";
import { DateForm } from "@/components/MarketForm/DateForm";
import { OutcomesForm } from "@/components/MarketForm/OutcomesForm";
import { PreviewForm } from "@/components/MarketForm/PreviewForm";
import { Steps } from "@/components/Steps";
import { GetTokenResult, useTokensInfo } from "@/hooks/useTokenInfo";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { MarketTypes } from "@/lib/market";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Address } from "viem";
import { useAccount } from "wagmi";

enum FormSteps {
  OUTCOMES = 1,
  DATE = 2,
  PREVIEW = 3,
}

function getOutcomes(tokensInfo: GetTokenResult[] | undefined): OutcomesFormValues["outcomes"] {
  if (!tokensInfo) {
    return [];
  }

  return [
    { value: `Yes-${tokensInfo[0]?.symbol}`, token: "", image: "" },
    { value: `No-${tokensInfo[0]?.symbol}`, token: "", image: "" },
    { value: `Yes-${tokensInfo[1]?.symbol}`, token: "", image: "" },
    { value: `No-${tokensInfo[1]?.symbol}`, token: "", image: "" },
  ];
}

function CreateProposal() {
  const { chain, chainId = DEFAULT_CHAIN } = useAccount();
  const [activeStep, setActiveStep] = useState(FormSteps.OUTCOMES);

  const useOutcomesFormReturn = useForm<OutcomesFormValues>({
    mode: "all",
    defaultValues: {
      market: "",
      outcomes: [
        { value: "Yes-Token1", token: "", image: "" },
        { value: "No-Token1", token: "", image: "" },
        { value: "Yes-Token2", token: "", image: "" },
        { value: "No-Token2", token: "", image: "" },
      ],
      lowerBound: { value: 0, token: "" },
      upperBound: { value: 0, token: "" },
      unit: "",
    },
  });

  const collaterals = useOutcomesFormReturn.watch(["collateralToken1", "collateralToken2"]);
  const { data: tokensInfo } = useTokensInfo(collaterals as Address[], chainId as SupportedChain);

  const outcomes = getOutcomes(tokensInfo);

  const useDateFormReturn = useForm<DateFormValues>({
    mode: "all",
    defaultValues: {
      openingTime: "",
    },
  });

  const goToPrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };
  const goToNextStep = () => {
    if (activeStep < FormSteps.PREVIEW) {
      setActiveStep(activeStep + 1);
    }
  };

  const marketTypeValues: MarketTypeFormValues = {
    marketType: MarketTypes.CATEGORICAL,
    marketCategories: ["misc"],
  };

  return (
    <div className="container-fluid !w-[924px] py-[65px] text-center">
      {!chain && <Alert type="warning">Connect your wallet to a supported network.</Alert>}

      {chain && (
        <>
          <div className="text-[16px] text-purple-primary mb-[24px]">Create New Proposal</div>

          {activeStep !== FormSteps.PREVIEW && <Steps activeStep={activeStep} />}

          {activeStep === FormSteps.OUTCOMES && (
            <OutcomesForm
              useFormReturn={useOutcomesFormReturn}
              goToPrevStep={goToPrevStep}
              goToNextStep={goToNextStep}
              marketType={marketTypeValues.marketType}
              isFutarchyMarket={true}
              chainId={chainId as SupportedChain}
            />
          )}

          {activeStep === FormSteps.DATE && (
            <DateForm useFormReturn={useDateFormReturn} goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} />
          )}

          {activeStep === FormSteps.PREVIEW && (
            <PreviewForm
              marketTypeValues={marketTypeValues}
              outcomesValues={{ ...useOutcomesFormReturn.getValues(), outcomes }}
              dateValues={useDateFormReturn.getValues()}
              chainId={chainId as SupportedChain}
              goToPrevStep={goToPrevStep}
              isFutarchyMarket={true}
              useOutcomesFormReturn={useOutcomesFormReturn}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CreateProposal;
