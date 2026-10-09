import clsx from "clsx";

export function Steps({ activeStep }: { activeStep: number }) {
  const stepsCount = 2;
  const steps = [...Array(stepsCount).keys()].map((n) => n + 1);
  return (
    <ul aria-label="Market creation progress" className="steps steps-horizontal mb-[32px]">
      {steps.map((step) => (
        <li
          className={clsx("step", step <= activeStep && "step-primary")}
          data-content={step < activeStep ? "✓" : undefined}
          key={step}
          aria-current={step === activeStep ? "step" : undefined}
        >
          {step === 1 ? "Market type" : "Details"}
        </li>
      ))}
    </ul>
  );
}
