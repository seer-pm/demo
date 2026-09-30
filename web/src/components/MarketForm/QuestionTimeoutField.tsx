import { DEFAULT_QUESTION_TIMEOUT, MAX_QUESTION_TIMEOUT } from "@seer-pm/sdk";
import { UseFormReturn } from "react-hook-form";
import { OutcomesFormValues } from ".";
import Input from "../Form/Input";
import Select from "../Form/Select";

const HOUR = 60 * 60;

export const QUESTION_TIMEOUT_CUSTOM = "custom";

/** Presets in seconds. Reality's timeout is how long an answer stands unchallenged before it is final. */
export const QUESTION_TIMEOUT_PRESETS: { value: string; text: string }[] = [
  { value: String(HOUR), text: "1 hour" },
  { value: String(6 * HOUR), text: "6 hours" },
  { value: String(24 * HOUR), text: "1 day" },
  { value: String(DEFAULT_QUESTION_TIMEOUT), text: "3.5 days" },
  { value: QUESTION_TIMEOUT_CUSTOM, text: "Custom" },
];

/** Reality rejects a timeout of 365 days or more, so the custom input stops one hour short of it. */
export const MAX_QUESTION_TIMEOUT_HOURS = Math.floor(MAX_QUESTION_TIMEOUT / HOUR);

export function getQuestionTimeoutSeconds(
  values: Pick<OutcomesFormValues, "questionTimeout" | "questionTimeoutHours">,
) {
  if (values.questionTimeout === QUESTION_TIMEOUT_CUSTOM) {
    return Math.round(Number(values.questionTimeoutHours) * HOUR);
  }
  return Number(values.questionTimeout);
}

export function QuestionTimeoutField({ useFormReturn }: { useFormReturn: UseFormReturn<OutcomesFormValues> }) {
  const { register, watch } = useFormReturn;
  const questionTimeout = watch("questionTimeout");

  return (
    <div>
      <div className="text-[24px] font-semibold mb-[32px]">Resolution timeout</div>
      <div className="text-[14px] mb-[10px]">
        How long an answer on Reality stays unchallenged before the market can resolve. A shorter timeout resolves
        faster and leaves less time to dispute a wrong answer.
      </div>
      <div className="grid grid-cols-2 gap-4 w-full text-left">
        <div className="col-span-1">
          <Select
            {...register("questionTimeout", { required: "This field is required." })}
            options={QUESTION_TIMEOUT_PRESETS}
            className="w-full"
            useFormReturn={useFormReturn}
          />
        </div>
        {questionTimeout === QUESTION_TIMEOUT_CUSTOM && (
          <div className="col-span-1">
            <Input
              autoComplete="off"
              type="number"
              min="1"
              step="1"
              placeholder="Hours"
              {...register("questionTimeoutHours", {
                required: "This field is required.",
                validate: (v) => {
                  const hours = Number(v);
                  if (!Number.isInteger(hours) || hours < 1) {
                    return "Enter a whole number of hours, at least 1.";
                  }
                  if (hours > MAX_QUESTION_TIMEOUT_HOURS) {
                    return `The timeout must be under 365 days (${MAX_QUESTION_TIMEOUT_HOURS} hours).`;
                  }
                  return true;
                },
              })}
              className="w-full"
              useFormReturn={useFormReturn}
            />
          </div>
        )}
      </div>
    </div>
  );
}
