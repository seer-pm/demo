import { ArrowDropDown } from "@/lib/icons";
import { useTokensInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import DropdownWrapper from "../Form/DropdownWrapper";
import { OutcomeImage } from "./OutcomeImage";

type OutcomeDropdownProps = {
  market: Market;
  outcomeIndex: number;
  onOutcomeChange: (i: number, isClick: boolean) => void;
};

function isInvalidOutcomeIndex(market: Market, index: number) {
  return market.type === "Generic" && index === market.wrappedTokens.length - 1;
}

export function OutcomeDropdown({ market, outcomeIndex, onOutcomeChange }: OutcomeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: outcomeTokens } = useTokensInfo(market.wrappedTokens, market.chainId);

  if (!outcomeTokens || outcomeTokens.length === 0) {
    return null;
  }

  const selectedToken = outcomeTokens[outcomeIndex];
  const selectedImage = market.images?.outcomes?.[outcomeIndex];
  const selectedIsInvalid = isInvalidOutcomeIndex(market, outcomeIndex);

  if (market.outcomes.length <= 1) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] dark:border-neutral px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
          <OutcomeImage
            className="w-full h-full"
            image={selectedImage}
            isInvalidOutcome={selectedIsInvalid}
            title={market.outcomes[outcomeIndex]}
          />
        </div>
        <p className="font-semibold text-[16px] whitespace-nowrap">{selectedToken.symbol}</p>
      </div>
    );
  }

  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      direction="auto"
      content={
        <div className="p-2">
          {outcomeTokens.map((token, index) => (
            <li
              key={token.address}
              onClick={() => {
                onOutcomeChange(index, false);
                setIsOpen(false);
              }}
              className={clsx(
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium dark:hover:bg-neutral hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                index === outcomeIndex &&
                  "active border-l-[3px] border-l-purple-primary bg-purple-medium dark:bg-neutral",
              )}
            >
              <div className="w-6 h-6 overflow-hidden flex-shrink-0">
                <OutcomeImage
                  className="w-full h-full"
                  image={market.images?.outcomes?.[index]}
                  isInvalidOutcome={isInvalidOutcomeIndex(market, index)}
                  title={market.outcomes[index]}
                />
              </div>
              <p className="font-semibold text-[16px] whitespace-nowrap">{token.symbol}</p>
            </li>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] dark:border-neutral px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)] hover:bg-base-300/60 dark:hover:bg-base-200 cursor-pointer">
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
          <OutcomeImage
            className="w-full h-full"
            image={selectedImage}
            isInvalidOutcome={selectedIsInvalid}
            title={market.outcomes[outcomeIndex]}
          />
        </div>
        <p className="font-semibold text-[16px] whitespace-nowrap">{selectedToken.symbol}</p>
        <ArrowDropDown />
      </div>
    </DropdownWrapper>
  );
}
