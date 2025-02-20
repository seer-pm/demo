import { createContext } from "react";

export const InputPotentialReturnContext = createContext<{
  input: { multiCategorical: string[]; scalar: number | undefined; multiScalar: number[] };
  setInput: React.Dispatch<
    React.SetStateAction<{
      multiCategorical: string[];
      scalar: number | undefined;
      multiScalar: number[];
    }>
  >;
}>({
  input: {
    multiCategorical: [],
    scalar: undefined,
    multiScalar: [],
  },
  setInput: () => {},
});
