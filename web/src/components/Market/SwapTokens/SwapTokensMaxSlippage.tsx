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

export default function SwapTokensMaxSlippage({ onReturn }: { onReturn: () => void }) {
  const initialMaxSlippage = useGlobalState((state) => state.maxSlippage);
  const setMaxSlippage = useGlobalState((state) => state.setMaxSlippage);
  const {
    handleSubmit,
    setValue,
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<{ maxSlippage: string }>({
    mode: "all",
    defaultValues: {
      maxSlippage: initialMaxSlippage,
    },
  });
  const onSubmit = ({ maxSlippage }: { maxSlippage: string }) => {
    setMaxSlippage(maxSlippage);
    onReturn();
  };
  const maxSlippage = watch("maxSlippage");
  return (
    <div className="space-y-5 bg-white p-[24px] drop-shadow">
      <div className="flex items-center gap-2">
        <p>Max Slippage</p>
        <Parameter />
        <div className="tooltip ml-auto">
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
              "border border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-purple-medium text-purple-primary text-[14px] hover:border-purple-primary text-center cursor-pointer",
              option.value !== "custom" && maxSlippage === option.value && "!border-purple-primary",
              option.value === "custom" &&
                !MAX_SLIPPAGE_OPTIONS.map((x) => x.value).includes(maxSlippage) &&
                "!border-purple-primary",
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
      <FormError errors={errors} name="maxSlippage" />
      <Button text="Cancel" variant="secondary" onClick={onReturn} className="mr-2" />
      <Button text="Apply" onClick={handleSubmit(onSubmit)} disabled={Object.keys(errors).length > 0} />
    </div>
  );
}
