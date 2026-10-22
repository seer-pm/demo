import { ArrowDropDown } from "@/lib/icons";
import { useTokensInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { type ReactNode, useState } from "react";
import DropdownWrapper, { DropdownOption } from "../Form/DropdownWrapper";
import { OutcomeImage } from "./OutcomeImage";

type OutcomeDropdownProps = {
  market: Market;
  outcomeIndex: number;
  onOutcomeChange: (i: number, isClick: boolean) => void;
};

function isInvalidOutcomeIndex(market: Market, index: number) {
  return market.type === "Generic" && index === market.wrappedTokens.length - 1;
}

const OUTCOME_LABEL_CLASS = "block font-semibold text-[16px] truncate max-w-[150px] min-w-0";
// Inside the amount box the pill shares a row with the number, so it gets the smaller share. The
// full name is in the ticket header right above, and in the title tooltip.
const PILL_LABEL_CLASS = "block font-semibold text-[16px] truncate max-w-[104px] min-w-0";

/** The face of a selectable token: a pill with a chevron, placed inside the dropdown's trigger. */
export function TokenPill({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-[var(--seer-border)] bg-[var(--seer-surface-raised)] pl-2 pr-1 py-1 hover:border-[var(--seer-brand-purple)] cursor-pointer">
      {children}
      <span className="flex text-[var(--seer-muted)]" aria-hidden="true">
        <ArrowDropDown fill="currentColor" />
      </span>
    </span>
  );
}

/** A token that cannot change reads as plain text, so it does not look like a control. */
export function StaticToken({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 py-1">{children}</div>;
}

export function OutcomeDropdown({ market, outcomeIndex, onOutcomeChange }: OutcomeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: outcomeTokens } = useTokensInfo(market.wrappedTokens, market.chainId);

  if (!outcomeTokens || outcomeTokens.length === 0) {
    return null;
  }

  const selectedOutcome = market.outcomes[outcomeIndex];
  const selectedImage = market.images?.outcomes?.[outcomeIndex];
  const selectedIsInvalid = isInvalidOutcomeIndex(market, outcomeIndex);

  if (market.outcomes.length <= 1) {
    return (
      <StaticToken>
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
          <OutcomeImage
            className="w-full h-full"
            image={selectedImage}
            isInvalidOutcome={selectedIsInvalid}
            title={market.outcomes[outcomeIndex]}
          />
        </div>
        <p className={PILL_LABEL_CLASS} title={selectedOutcome}>
          {selectedOutcome}
        </p>
      </StaticToken>
    );
  }

  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      direction="auto"
      listboxLabel="Outcomes"
      triggerLabel={`Outcome: ${selectedOutcome}`}
      triggerClassName="rounded-full"
      content={outcomeTokens.map((token, index) => (
        <DropdownOption
          key={token.address}
          selected={index === outcomeIndex}
          onSelect={() => {
            onOutcomeChange(index, false);
            setIsOpen(false);
          }}
        >
          <span className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
            <OutcomeImage
              className="w-full h-full"
              image={market.images?.outcomes?.[index]}
              isInvalidOutcome={isInvalidOutcomeIndex(market, index)}
              title={market.outcomes[index]}
            />
          </span>
          <span className={OUTCOME_LABEL_CLASS} title={market.outcomes[index]}>
            {market.outcomes[index]}
          </span>
        </DropdownOption>
      ))}
    >
      <TokenPill>
        <span className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
          <OutcomeImage
            className="w-full h-full"
            image={selectedImage}
            isInvalidOutcome={selectedIsInvalid}
            title={market.outcomes[outcomeIndex]}
          />
        </span>
        <span className={PILL_LABEL_CLASS} title={selectedOutcome}>
          {selectedOutcome}
        </span>
      </TokenPill>
    </DropdownWrapper>
  );
}
