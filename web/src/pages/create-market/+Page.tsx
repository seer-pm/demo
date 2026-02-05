import { Alert } from "@/components/Alert";
import { DateFormValues, MarketTypeFormValues, OutcomesFormValues } from "@/components/MarketForm";
import { DateForm } from "@/components/MarketForm/DateForm";
import { MarketTypeForm } from "@/components/MarketForm/MarketTypeForm";
import { OutcomesForm } from "@/components/MarketForm/OutcomesForm";
import { PreviewForm } from "@/components/MarketForm/PreviewForm";
import { Steps } from "@/components/Steps";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { MarketTypes } from "@/lib/market";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const localDate = useMemo(() => new Date(), []);
  const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000 + 60000);
  const useDateFormReturn = useForm<DateFormValues>({
    mode: "all",
    defaultValues: {
      openingTime: utcDate.toString(),
    },
  });

  const marketType = useMarketTypeFormReturn.watch("marketType");
  const prevMarketTypeRef = useRef(marketType);

  const resetFormOptions = {
    shouldValidate: true,
  };

  // Reset outcomes and token names when changing to/from SCALAR (not MULTI_SCALAR)
  useEffect(() => {
    if (prevMarketTypeRef.current !== undefined && prevMarketTypeRef.current !== marketType && marketType) {
      const prevIsScalar = prevMarketTypeRef.current === MarketTypes.SCALAR;
      const currentIsScalar = marketType === MarketTypes.SCALAR;

      if (prevIsScalar || currentIsScalar) {
        // Reset outcomes to default (2 empty outcomes)
        useOutcomesFormReturn.setValue(
          "outcomes",
          [
            { value: "", token: "", image: "" },
            { value: "", token: "", image: "" },
          ],
          resetFormOptions,
        );
        // Reset token names for scalar markets
        useOutcomesFormReturn.setValue("lowerBound.token", "", resetFormOptions);
        useOutcomesFormReturn.setValue("upperBound.token", "", resetFormOptions);
        // Reset scalar values
        useOutcomesFormReturn.setValue("lowerBound.value", 0, resetFormOptions);
        useOutcomesFormReturn.setValue("upperBound.value", 0, resetFormOptions);
        // Reset unit
        useOutcomesFormReturn.setValue("unit", "", resetFormOptions);
      }
    }
    prevMarketTypeRef.current = marketType;
  }, [marketType, useOutcomesFormReturn]);

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
    <div className="w-[924px] max-w-[90%] mx-auto py-[65px] text-center">
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
              isFutarchyMarket={false}
              chainId={chainId as SupportedChain}
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
              isFutarchyMarket={false}
              useOutcomesFormReturn={useOutcomesFormReturn}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CreateMarket;
