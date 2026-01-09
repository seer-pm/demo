import Toggle from "@/components/Form/Toggle";
import { useGlobalState } from "@/hooks/useGlobalState";
import { Parameter, QuestionIcon } from "@/lib/icons";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import Button from "../../Form/Button";
import FormError from "../../Form/FormError";
import Input from "../../Form/Input";

const MAX_SLIPPAGE_OPTIONS = [
  {
    value: "0.1",
    text: "0.1%",
  },
  { value: "0.5", text: "0.5%" },
  { value: "1", text: "1%" },
  { value: "custom", text: "Custom" },
];

interface FormData {
  maxSlippage: string;
  isInstantSwap: boolean;
  useSmartAccount: boolean;
}

export default function SwapTokensMaxSlippage({ onReturn }: { onReturn: () => void }) {
  const [
    initialMaxSlippage,
    setMaxSlippage,
    initialIsInstantSwap,
    setInstantSwap,
    initialUseSmartAccount,
    setUseSmartAccount,
  ] = useGlobalState((state) => [
    state.maxSlippage,
    state.setMaxSlippage,
    state.isInstantSwap,
    state.setInstantSwap,
    state.useSmartAccount,
    state.setUseSmartAccount,
  ]);
  const {
    handleSubmit,
    setValue,
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      maxSlippage: initialMaxSlippage,
      isInstantSwap: initialIsInstantSwap,
      useSmartAccount: initialUseSmartAccount,
    },
  });
  const onSubmit = ({ maxSlippage, isInstantSwap, useSmartAccount }: FormData) => {
    setMaxSlippage(maxSlippage);
    setInstantSwap(isInstantSwap);
    setUseSmartAccount(useSmartAccount);
    onReturn();
  };
  const maxSlippage = watch("maxSlippage");
  const isInstantSwap = watch("isInstantSwap");
  const useSmartAccount = watch("useSmartAccount");
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-[18px]">Parameters</p>
        <Parameter />
      </div>
      <div className="flex gap-1 items-center">
        <p>Max slippage</p>
        <div className="tooltip">
          <p className="tooltiptext w-[300px] !whitespace-break-spaces">
            Your transaction will revert if the price changes unfavorably by more than this percentage
          </p>
          <QuestionIcon fill="#9747FF" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {MAX_SLIPPAGE_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => {
              if (option.value !== "custom") {
                setValue("maxSlippage", option.value);
                trigger("maxSlippage");
              } else {
                setValue("maxSlippage", "");
                trigger("maxSlippage");
              }
            }}
            className={clsx(
              "pill-button",
              ((option.value !== "custom" && maxSlippage === option.value) ||
                (option.value === "custom" && !MAX_SLIPPAGE_OPTIONS.map((x) => x.value).includes(maxSlippage))) &&
                "pill-button-active",
            )}
          >
            {option.text}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0.01}
          max={50}
          step={0.01}
          className="w-[80px]"
          {...register("maxSlippage", {
            required: "This field is required.",
            validate: (v) => {
              const num = Number(v);
              if (Number.isNaN(num) || Number(v) < 0.01 || Number(v) > 50) {
                return "Max slippage must be between 0.01% and 50%";
              }

              return true;
            },
          })}
        />
        <p>%</p>
      </div>
      <div className="flex items-center gap-1">
        <p>Instant Swap</p>
        <div className="tooltip">
          <p className="tooltiptext w-[200px] !whitespace-break-spaces">Swap directly without using Cowswap</p>
          <QuestionIcon fill="#9747FF" />
        </div>
        <Toggle
          className="checked:bg-purple-primary ml-3"
          checked={isInstantSwap}
          onChange={(e) => setValue("isInstantSwap", e.target.checked)}
        />
      </div>
      <div className="flex items-center gap-1">
        <p>Use smart account</p>
        <div className="tooltip">
          <p className="tooltiptext w-[200px] !whitespace-break-spaces">
            Uses the smart account for batching transactions via EIP-7702 if available
          </p>
          <QuestionIcon fill="#9747FF" />
        </div>
        <Toggle
          className="checked:bg-purple-primary ml-3"
          checked={useSmartAccount}
          onChange={(e) => setValue("useSmartAccount", e.target.checked)}
        />
      </div>
      <FormError errors={errors} name="maxSlippage" />
      <Button text="Cancel" variant="secondary" onClick={onReturn} className="mr-2" />
      <Button text="Apply" onClick={handleSubmit(onSubmit)} disabled={Object.keys(errors).length > 0} />
    </div>
  );
}
