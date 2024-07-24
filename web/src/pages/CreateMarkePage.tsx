import { Alert } from "@/components/Alert";
import { DateFormValues, MarketTypeFormValues, OutcomesFormValues, QuestionFormValues } from "@/components/MarketForm";
import { DateForm } from "@/components/MarketForm/DateForm";
import { MarketTypeForm } from "@/components/MarketForm/MarketTypeForm";
import { OutcomesForm } from "@/components/MarketForm/OutcomesForm";
import { PreviewForm } from "@/components/MarketForm/PreviewForm";
import { QuestionForm } from "@/components/MarketForm/QuestionForm";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";

enum FormSteps {
  MARKET_TYPE = 1,
  QUESTION = 2,
  OUTCOMES = 3,
  DATE = 4,
  PREVIEW = 5,
}

function Steps({ activeStep }: { activeStep: number }) {
  const stepsCount = 4;
  const steps = [...Array(stepsCount).keys()].map((n) => n + 1);
  return (
    <ul className="steps steps-horizontal mb-[48px]">
      {steps.map((step) => (
        <li
          className={clsx("step", step <= activeStep && "step-primary")}
          data-content={step < activeStep ? "✓" : undefined}
          key={step}
        ></li>
      ))}
    </ul>
  );
}

function CreateMarket() {
  const { chain, chainId = DEFAULT_CHAIN } = useAccount();
  const [activeStep, setActiveStep] = useState(FormSteps.MARKET_TYPE);

  const useMarketTypeFormReturn = useForm<MarketTypeFormValues>({
    mode: "all",
    defaultValues: {
      marketType: undefined,
    },
  });

  const useQuestionFormReturn = useForm<QuestionFormValues>({
    mode: "all",
    defaultValues: {
      market: "",
    },
  });

  const useOutcomesFormReturn = useForm<OutcomesFormValues>({
    mode: "all",
    defaultValues: {
      outcomes: [],
      lowerBound: 0,
      upperBound: 0,
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

          {activeStep === FormSteps.QUESTION && (
            <QuestionForm
              useFormReturn={useQuestionFormReturn}
              goToPrevStep={goToPrevStep}
              goToNextStep={goToNextStep}
            />
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
              questionValues={useQuestionFormReturn.getValues()}
              outcomesValues={useOutcomesFormReturn.getValues()}
              dateValues={useDateFormReturn.getValues()}
              chainId={chainId as SupportedChain}
              goToPrevStep={goToPrevStep}
              useQuestionFormReturn={useQuestionFormReturn}
              useOutcomesFormReturn={useOutcomesFormReturn}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CreateMarket;
