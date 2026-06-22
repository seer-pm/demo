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
}

export default function SwapTokensMaxSlippage({ onReturn }: { onReturn: () => void }) {
  const [initialMaxSlippage, setMaxSlippage, initialIsInstantSwap, setInstantSwap] = useGlobalState((state) => [
    state.maxSlippage,
    state.setMaxSlippage,
    state.isInstantSwap,
    state.setInstantSwap,
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
    },
  });
  const onSubmit = ({ maxSlippage, isInstantSwap }: FormData) => {
    setMaxSlippage(maxSlippage);
    setInstantSwap(isInstantSwap);
    onReturn();
  };
  const maxSlippage = watch("maxSlippage");
  const isInstantSwap = watch("isInstantSwap");
  return (
    // CONTRIBUTORS: `slippage-panel` class scopes typography overrides
    // (see index.scss). Without it, the default font sizes from
    // <Button>/<Input>/<p> read noticeably larger than the buy panel and
    // make the "More" view feel like a different design.
    <div className="space-y-5 slippage-panel">
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
          <QuestionIcon fill="var(--blue)" />
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
          <QuestionIcon fill="var(--blue)" />
        </div>
        {/* CONTRIBUTORS: `checked:bg-purple-primary` removed — the
            custom `.purchase-card .toggle` (see index.scss) keeps the
            track white in both states; only the blue knob slides to
            indicate on/off. Don't reintroduce a track-color change
            here, it'd conflict with the global toggle design. */}
        <Toggle
          className="ml-3"
          checked={isInstantSwap}
          onChange={(e) => setValue("isInstantSwap", e.target.checked)}
        />
      </div>
      <FormError errors={errors} name="maxSlippage" />
      <Button text="Cancel" variant="secondary" onClick={onReturn} className="mr-2" />
      <Button text="Apply" onClick={handleSubmit(onSubmit)} disabled={Object.keys(errors).length > 0} />
    </div>
  );
}
