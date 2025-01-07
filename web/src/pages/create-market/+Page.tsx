import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { DateFormValues, MarketTypeFormValues, OutcomesFormValues } from "@/components/MarketForm";
import { DateForm } from "@/components/MarketForm/DateForm";
import { MarketTypeForm } from "@/components/MarketForm/MarketTypeForm";
import { OutcomesForm } from "@/components/MarketForm/OutcomesForm";
import { PreviewForm } from "@/components/MarketForm/PreviewForm";
import { useIsAccountConnected, useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useSignIn } from "@/hooks/useSignIn";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";

enum FormSteps {
  MARKET_TYPE = 1,
  OUTCOMES = 2,
  DATE = 3,
  PREVIEW = 4,
}

function Steps({ activeStep }: { activeStep: number }) {
  const stepsCount = 3;
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
  const { address, chainId = DEFAULT_CHAIN } = useAccount();
  const [activeStep, setActiveStep] = useState(FormSteps.MARKET_TYPE);
  const isAccountConnectedAndSignedIn = useIsConnectedAndSignedIn();
  const isAccountConnected = useIsAccountConnected();
  const { open } = useWeb3Modal();
  const signIn = useSignIn();

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
      {!isAccountConnectedAndSignedIn &&
        (isAccountConnected ? (
          <Alert type="warning">
            <Button
              variant="primary"
              size="large"
              text="Sign in to create a market"
              onClick={() => signIn.mutateAsync({ address: address!, chainId: chainId! })}
            />
          </Alert>
        ) : (
          <Alert type="warning">
            <Button
              variant="primary"
              size="large"
              text="Connect your wallet to a supported network."
              onClick={() => open({ view: "Connect" })}
            />
          </Alert>
        ))}

      {isAccountConnectedAndSignedIn && (
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
