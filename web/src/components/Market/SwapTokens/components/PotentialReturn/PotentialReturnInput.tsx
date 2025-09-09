import Input from "@/components/Form/Input";
import MultiSelect from "@/components/Form/MultiSelect";
import { Market, MarketTypes, getMarketType } from "@/lib/market";
import { Dispatch, ReactNode, SetStateAction, useRef } from "react";
import { PotentialReturnInputType } from "./interfaces";

export default function PotentialReturnInput({
  market,
  input,
  setInput,
}: {
  market: Market;
  input: PotentialReturnInputType;
  setInput: Dispatch<SetStateAction<PotentialReturnInputType>>;
}): ReactNode {
  const marketType = getMarketType(market);

  const multiSelectRef = useRef<HTMLDivElement>(null);

  if (marketType === MarketTypes.MULTI_CATEGORICAL) {
    return (
      <div className="space-y-1">
        <p className="whitespace-nowrap">Market resolution:</p>
        <MultiSelect
          ref={multiSelectRef}
          options={market.outcomes.slice(0, -1).map((x) => ({
            value: x,
            text: x,
          }))}
          value={input.multiCategorical ?? []}
          onChange={(values) => setInput((state) => ({ ...state, multiCategorical: values }))}
          placeholder="Select winning outcomes"
        />
      </div>
    );
  }

  if (marketType === MarketTypes.SCALAR) {
    return (
      <div className="space-y-1">
        <p className="whitespace-nowrap">Market resolution:</p>
        <Input
          type="number"
          className="w-full "
          value={input.scalar ?? ""}
          onChange={(e) => setInput((state) => ({ ...state, scalar: Number(e.target.value) }))}
        />
      </div>
    );
  }

  // MarketTypes.MULTI_SCALAR
  return (
    <div className="space-y-1">
      <p className="whitespace-nowrap">Market resolution:</p>
      {market.outcomes.slice(0, -1).map((outcome, index) => (
        <div key={outcome} className="flex items-center justify-between gap-2">
          <p className="text-[14px]">{outcome}</p>
          <Input
            type="number"
            min="0"
            className="h-[30px] w-[150px]"
            onWheel={(e) => {
              // stop scrolling
              (e.target as HTMLInputElement).blur();
              e.stopPropagation();
              e.preventDefault();
            }}
            value={input.multiScalar[index] || ""}
            onChange={(e) =>
              setInput((state) => {
                const updatedMultiScalar = [...state.multiScalar];
                updatedMultiScalar[index] = Number(e.target.value);
                return {
                  ...state,
                  multiScalar: updatedMultiScalar,
                };
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
