import clsx from "clsx";

export function Steps({ activeStep }: { activeStep: number }) {
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
