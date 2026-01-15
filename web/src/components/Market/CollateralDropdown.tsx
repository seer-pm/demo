import { seerCreditsAddress } from "@/hooks/contracts/generated-trading-credits";
import { GetTokenResult, useTokensInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { ArrowDropDown } from "@/lib/icons";
import { Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import clsx from "clsx";
import { useState } from "react";
import { Address, zeroAddress } from "viem";
import DropdownWrapper from "../Form/DropdownWrapper";

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

  const options = [COLLATERAL_TOKENS[market.chainId].primary.address];

  if (COLLATERAL_TOKENS[market.chainId].secondary) {
    options.push(COLLATERAL_TOKENS[market.chainId].secondary?.address!);
  }

  if (COLLATERAL_TOKENS[market.chainId].secondary?.wrapped) {
    options.push(COLLATERAL_TOKENS[market.chainId].secondary?.wrapped!.address!);
  }

  if (type === "sell" && market.chainId in seerCreditsAddress) {
    options.push(seerCreditsAddress[market.chainId as keyof typeof seerCreditsAddress]);
  }

  // TODO: allow to swap using multple alternative tokens
  /*   if (COLLATERAL_TOKENS[market.chainId].swap) {
    options.push(...COLLATERAL_TOKENS[market.chainId].swap!.map(t => t.address));
  } */

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
      content={
        <div className="p-2">
          {collateralTokens.map((collateralToken) => (
            <li
              key={collateralToken.address}
              onClick={() => {
                setSelectedCollateral(collateralToken);
                setIsOpen(false);
              }}
              className={clsx(
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium dark:hover:bg-neutral hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                isTwoStringsEqual(collateralToken.address, selectedCollateral.address) &&
                  "active border-l-[3px] border-l-purple-primary bg-purple-medium dark:bg-neutral",
              )}
            >
              <div className="w-6 h-6 overflow-hidden flex-shrink-0 relative">
                <img
                  className="w-full h-full rounded-full "
                  alt={collateralToken.symbol}
                  src={paths.tokenImage(collateralToken.address, collateralToken.chainId)}
                />
                {showChainLogo && (
                  <img
                    className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
                    alt={String(collateralToken.chainId)}
                    src={paths.chainImage(collateralToken.chainId)}
                  />
                )}
              </div>
              <p className="font-semibold text-[16px]">{collateralToken.symbol}</p>
            </li>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] dark:border-neutral px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)] hover:bg-base-300/60 dark:hover:bg-base-200 cursor-pointer">
        <div className="w-6 h-6 overflow-hidden flex-shrink-0 relative">
          <img
            className="w-full h-full rounded-full"
            alt={selectedCollateral.symbol}
            src={paths.tokenImage(selectedCollateral.address, selectedCollateral.chainId)}
          />
          {showChainLogo && (
            <img
              className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
              alt={String(selectedCollateral.chainId)}
              src={paths.chainImage(selectedCollateral.chainId)}
            />
          )}
        </div>
        <p className="font-semibold text-[16px]">{selectedCollateral.symbol}</p>
        <ArrowDropDown />
      </div>
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
