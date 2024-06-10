import * as v from "valibot";
import { ANSWERED_TOO_SOON, INVALID_RESULT } from "./reality";

export const answerFormSchema = v.variant("answerType", [
  v.object({ answerType: v.literal(INVALID_RESULT) }),
  v.object({ answerType: v.literal(ANSWERED_TOO_SOON) }),
  v.object({
    answerType: v.literal("multi"),
    outcomes: v.pipe(
      v.array(v.object({ value: v.boolean() })),
      v.check((val) => val.some((o) => o.value === true)),
    ),
  }),
  v.object({
    answerType: v.literal("single"),
    outcome: v.pipe(v.unknown(), v.transform(Number), v.number("Invalid number"), v.minValue(0)),
  }),
]);
