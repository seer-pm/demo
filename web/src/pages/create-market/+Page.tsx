import { Alert } from "@/components/Alert";
import { DateFormValues, MarketTypeFormValues, OutcomesFormValues } from "@/components/MarketForm";
import { DateForm } from "@/components/MarketForm/DateForm";
import { MarketTypeForm } from "@/components/MarketForm/MarketTypeForm";
import { OutcomesForm } from "@/components/MarketForm/OutcomesForm";
import { PreviewForm } from "@/components/MarketForm/PreviewForm";
import { Steps } from "@/components/Steps";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";

enum FormSteps {
  MARKET_TYPE = 1,
  OUTCOMES = 2,
  DATE = 3,
  PREVIEW = 4,
}

function CreateMarket() {
  const { chain, chainId = DEFAULT_CHAIN } = useAccount();
  const [activeStep, setActiveStep] = useState(FormSteps.MARKET_TYPE);

  const useMarketTypeFormReturn = useForm<MarketTypeFormValues>({
    mode: "all",
    defaultValues: {
      marketType: undefined,
      marketCategories: ["misc"],
    },
  });

  const useOutcomesFormReturn = useForm<OutcomesFormValues>({
    mode: "all",
    defaultValues: {
      market: "",
      outcomes: [
        { value: "", token: "", image: "" },
        { value: "", token: "", image: "" },
      ],
      lowerBound: { value: 0, token: "" },
      upperBound: { value: 0, token: "" },
      unit: "",
    },
  });

  const useDateFormReturn = useForm<DateFormValues>({
    mode: "all",
    defaultValues: {
      openingTime: "",
    },
  });

  const marketType = useMarketTypeFormReturn.watch("marketType");

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

  return (
    <div className="container-fluid !w-[924px] py-[65px] text-center">
      {!chain && <Alert type="warning">Connect your wallet to a supported network.</Alert>}

      {chain && (
        <>
          <div className="text-[16px] text-purple-primary mb-[24px]">Create New Market</div>

          {activeStep !== FormSteps.PREVIEW && <Steps activeStep={activeStep} />}

          {activeStep === FormSteps.MARKET_TYPE && (
            <MarketTypeForm useFormReturn={useMarketTypeFormReturn} goToNextStep={goToNextStep} />
          )}

          {activeStep === FormSteps.OUTCOMES && (
            <OutcomesForm
              useFormReturn={useOutcomesFormReturn}
              goToPrevStep={goToPrevStep}
              goToNextStep={goToNextStep}
              marketType={marketType}
            />
          )}

          {activeStep === FormSteps.DATE && (
            <DateForm useFormReturn={useDateFormReturn} goToPrevStep={goToPrevStep} goToNextStep={goToNextStep} />
          )}

          {activeStep === FormSteps.PREVIEW && (
            <PreviewForm
              marketTypeValues={useMarketTypeFormReturn.getValues()}
              outcomesValues={useOutcomesFormReturn.getValues()}
              dateValues={useDateFormReturn.getValues()}
              chainId={chainId as SupportedChain}
              goToPrevStep={goToPrevStep}
              useOutcomesFormReturn={useOutcomesFormReturn}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CreateMarket;
