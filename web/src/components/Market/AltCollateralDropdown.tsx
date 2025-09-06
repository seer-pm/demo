import { useTokensInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { ArrowDropDown } from "@/lib/icons";
import { Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { isUndefined } from "@/lib/utils";
import clsx from "clsx";
import React, { useState } from "react";
import { Address, zeroAddress } from "viem";
import DropdownWrapper from "../Form/DropdownWrapper";

type AltCollateralDropdownProps = {
  market: Market;
  useAltCollateral: boolean;
  setUseAltCollateral: (useAltCollateral: boolean) => void;
  isUseWrappedToken?: boolean;
  collateralPair?: [Address, Address];
};

function getCollateralPair(market: Market, isUseWrappedToken: boolean): [Address, Address] | [] {
  if (market.type === "Futarchy") {
    return [market.collateralToken1, market.collateralToken2];
  }

  if (isUndefined(COLLATERAL_TOKENS[market.chainId].secondary)) {
    return [];
  }

  const secondary = isUseWrappedToken
    ? COLLATERAL_TOKENS[market.chainId].secondary?.wrapped || COLLATERAL_TOKENS[market.chainId].secondary
    : COLLATERAL_TOKENS[market.chainId].secondary;

  if (!secondary) {
    return [];
  }

  return [COLLATERAL_TOKENS[market.chainId].primary.address, secondary.address];
}

export const AltCollateralDropdown = React.forwardRef<HTMLInputElement | null, AltCollateralDropdownProps>((props) => {
  const { market, collateralPair, isUseWrappedToken = false, useAltCollateral, setUseAltCollateral } = props;

  const { data: collateralTokens } = useTokensInfo(
    collateralPair || getCollateralPair(market, isUseWrappedToken),
    market.chainId,
  );

  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = useAltCollateral ? 1 : 0;
  if (market.parentMarket.id !== zeroAddress || !collateralTokens || collateralTokens.length === 0) {
    return null;
  }

  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      content={
        <div className="p-2">
          {collateralTokens.map((collateralToken, index) => (
            <li
              key={collateralToken.address}
              onClick={() => {
                setUseAltCollateral(index !== 0);
                setIsOpen(false);
              }}
              className={clsx(
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                ((index !== 0 && useAltCollateral) || (index === 0 && !useAltCollateral)) &&
                  "active border-l-[3px] border-l-purple-primary bg-purple-medium",
              )}
            >
              <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
                <img
                  className="w-full h-full"
                  alt={collateralToken.symbol}
                  src={paths.tokenImage(collateralToken.address, market.chainId)}
                />
              </div>
              <p className="font-semibold text-[16px]">{collateralToken.symbol}</p>
            </li>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)] hover:bg-[#f2f2f2] cursor-pointer">
        <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
          <img
            className="w-full h-full"
            alt={collateralTokens[selectedIndex].symbol}
            src={paths.tokenImage(collateralTokens[selectedIndex].address, market.chainId)}
          />
        </div>
        <p className="font-semibold text-[16px]">{collateralTokens[selectedIndex].symbol}</p>
        <ArrowDropDown />
      </div>
    </DropdownWrapper>
  );
});

export default AltCollateralDropdown;
