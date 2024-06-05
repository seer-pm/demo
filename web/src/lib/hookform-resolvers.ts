import * as z from "zod";
import { ANSWERED_TOO_SOON, INVALID_RESULT } from "./reality";

export const answerFormSchema = z.discriminatedUnion("answerType", [
  z.object({ answerType: z.literal(INVALID_RESULT) }),
  z.object({ answerType: z.literal(ANSWERED_TOO_SOON) }),
  z.object({
    answerType: z.literal("multi"),
    outcomes: z.array(z.object({ value: z.boolean() })).refine((val) => val.some((o) => o.value === true)),
  }),
  z.object({
    answerType: z.literal("single"),
    outcome: z.coerce.number().min(0),
  }),
]);
