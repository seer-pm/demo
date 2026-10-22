import { useGlobalState } from "@/hooks/useGlobalState";
import clsx from "clsx";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../Form/Button";
import FormError from "../../Form/FormError";
import Input from "../../Form/Input";

const MAX_SLIPPAGE_PRESETS = [
  { value: "0.1", text: "0.1%" },
  { value: "0.5", text: "0.5%" },
  { value: "1", text: "1%" },
];

const CUSTOM = "custom";

const CHOICES = [...MAX_SLIPPAGE_PRESETS, { value: CUSTOM, text: "Custom" }];

// At this tolerance a thin pool or a sandwich can fill the order far from the quoted price.
const HIGH_SLIPPAGE_THRESHOLD = 3;

interface FormData {
  maxSlippage: string;
}

export default function SwapTokensMaxSlippage({ onReturn }: { onReturn: () => void }) {
  const [initialMaxSlippage, setMaxSlippage] = useGlobalState((state) => [state.maxSlippage, state.setMaxSlippage]);
  const [isCustom, setIsCustom] = useState(
    () => !MAX_SLIPPAGE_PRESETS.some((preset) => preset.value === initialMaxSlippage),
  );
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const headingId = useId();
  const helperId = useId();
  const {
    handleSubmit,
    setValue,
    setFocus,
    register,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      maxSlippage: initialMaxSlippage,
    },
  });
  const onSubmit = ({ maxSlippage }: FormData) => {
    setMaxSlippage(maxSlippage);
    onReturn();
  };
  const maxSlippage = watch("maxSlippage");
  const checked = isCustom ? CUSTOM : maxSlippage;
  const slippageNumber = Number(maxSlippage);
  const isHighSlippage = !errors.maxSlippage && slippageNumber >= HIGH_SLIPPAGE_THRESHOLD && slippageNumber <= 50;

  const choose = (value: string, focusCustomInput: boolean) => {
    if (value === CUSTOM) {
      setIsCustom(true);
      // The field renders on this commit, so it can only take focus on the next frame.
      if (focusCustomInput) requestAnimationFrame(() => setFocus("maxSlippage", { shouldSelect: true }));
      return;
    }
    setIsCustom(false);
    setValue("maxSlippage", value);
    clearErrors("maxSlippage");
  };

  const onRadioKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % CHOICES.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + CHOICES.length) % CHOICES.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    // Arrow keys only move the selection. Jumping into the field here would trap the arrows inside it.
    choose(CHOICES[next].value, false);
    radios.current[next]?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 id={headingId} className="font-semibold text-[18px]">
          Max slippage
        </h3>
        <p id={helperId} className="text-[14px] text-[var(--seer-muted)]">
          Your trade cancels if the price moves more than this before it confirms.
        </p>
      </div>
      <div role="radiogroup" aria-labelledby={headingId} aria-describedby={helperId} className="grid grid-cols-4 gap-2">
        {CHOICES.map((choice, index) => {
          const isChecked = checked === choice.value;
          return (
            <button
              key={choice.value}
              ref={(button) => {
                radios.current[index] = button;
              }}
              // biome-ignore lint/a11y/useSemanticElements: a native radio cannot tell a click on Custom, which focuses the field, from arrow-key selection, which must not
              type="button"
              role="radio"
              aria-checked={isChecked}
              tabIndex={isChecked ? 0 : -1}
              onClick={() => choose(choice.value, true)}
              onKeyDown={(event) => onRadioKeyDown(event, index)}
              className={clsx(
                "pill-button !px-2 whitespace-nowrap",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--seer-brand-purple)]",
                isChecked && "pill-button-active",
              )}
            >
              {choice.text}
            </button>
          );
        })}
      </div>
      {isCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0.01}
            max={50}
            step={0.01}
            inputMode="decimal"
            aria-label="Custom max slippage, in percent"
            className="w-[96px]"
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
          <p aria-hidden="true">%</p>
        </div>
      )}
      <FormError errors={errors} name="maxSlippage" />
      {isHighSlippage && (
        <output className="block seer-status-warning text-[14px]">
          High slippage: you may get a much worse price.
        </output>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button text="Cancel" variant="secondary" onClick={onReturn} className="w-full min-w-0" />
        <Button
          text="Apply"
          onClick={handleSubmit(onSubmit)}
          disabled={Object.keys(errors).length > 0}
          className="w-full min-w-0"
        />
      </div>
    </div>
  );
}
