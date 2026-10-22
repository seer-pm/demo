import { paths } from "@/lib/paths";
import { isTradingCreditsDisabled } from "@/lib/trading-credits";
import { isTwoStringsEqual } from "@/lib/utils";
import type { GetTokenResult } from "@seer-pm/react";
import { useTokensInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { getActiveCollateralProfile, getActiveCreditsTokenAddress } from "@seer-pm/sdk";
import { useState } from "react";
import { Address, zeroAddress } from "viem";
import DropdownWrapper, { DropdownOption } from "../Form/DropdownWrapper";
import { TokenPill } from "./OutcomeDropdown";

type CollateralDropdownProps = {
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  collateralTokens: GetTokenResult[] | undefined;
  showChainLogo?: boolean;
};

type MarketCollateralDropdownProps = {
  market: Market;
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  type: "buy" | "sell";
};

function getCollateralOptions(market: Market, type: "buy" | "sell"): Address[] {
  if (market.type === "Futarchy") {
    return [market.collateralToken1, market.collateralToken2];
  }

  const profile = getActiveCollateralProfile(market.chainId);
  const options = [profile.primary.address];

  if (profile.secondary) {
    options.push(profile.secondary.address);
  }

  if (profile.secondary?.wrapped) {
    options.push(profile.secondary.wrapped.address);
  }

  if (type === "sell" && !isTradingCreditsDisabled()) {
    const creditsToken = getActiveCreditsTokenAddress(market.chainId);
    if (creditsToken) {
      options.push(creditsToken);
    }
  }

  // TODO: allow to swap using multple alternative tokens
  if (getActiveCollateralProfile(market.chainId).swap) {
    options.push(...getActiveCollateralProfile(market.chainId).swap!.map((t) => t.address));
  }

  return options;
}

export function CollateralDropdown(props: CollateralDropdownProps) {
  const { collateralTokens, selectedCollateral, setSelectedCollateral, showChainLogo = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  if (!collateralTokens || collateralTokens.length === 0) {
    return null;
  }

  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      listboxLabel="Tokens"
      triggerLabel={`Token: ${selectedCollateral.symbol}`}
      triggerClassName="rounded-full"
      content={collateralTokens.map((collateralToken) => (
        <DropdownOption
          key={collateralToken.address}
          selected={isTwoStringsEqual(collateralToken.address, selectedCollateral.address)}
          onSelect={() => {
            setSelectedCollateral(collateralToken);
            setIsOpen(false);
          }}
        >
          <span className="w-6 h-6 overflow-hidden flex-shrink-0 relative">
            <img
              className="w-full h-full rounded-full "
              alt=""
              src={paths.tokenImage(collateralToken.address, collateralToken.chainId)}
            />
            {showChainLogo && (
              <img
                className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
                alt={String(collateralToken.chainId)}
                src={paths.chainImage(collateralToken.chainId)}
              />
            )}
          </span>
          <span className="font-semibold text-[16px] whitespace-nowrap">{collateralToken.symbol}</span>
        </DropdownOption>
      ))}
    >
      <TokenPill>
        <span className="w-6 h-6 overflow-hidden flex-shrink-0 relative">
          <img
            className="w-full h-full rounded-full"
            alt=""
            src={paths.tokenImage(selectedCollateral.address, selectedCollateral.chainId)}
          />
          {showChainLogo && (
            <img
              className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
              alt={String(selectedCollateral.chainId)}
              src={paths.chainImage(selectedCollateral.chainId)}
            />
          )}
        </span>
        <span className="font-semibold text-[16px] whitespace-nowrap">{selectedCollateral.symbol}</span>
      </TokenPill>
    </DropdownWrapper>
  );
}

export function MarketCollateralDropdown(props: MarketCollateralDropdownProps) {
  const { data: collateralTokens } = useTokensInfo(
    getCollateralOptions(props.market, props.type),
    props.market.chainId,
  );

  if (props.market.parentMarket.id !== zeroAddress) {
    return null;
  }

  return <CollateralDropdown {...props} collateralTokens={collateralTokens} />;
}
