import { GetTokenResult } from "@/hooks/useTokenInfo";
import { ArrowDropDown } from "@/lib/icons";
import { Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import clsx from "clsx";
import { useEffect, useState } from "react";
import DropdownWrapper from "../Form/DropdownWrapper";
import { TokenImageContent } from "./SwapTokens/TokenSelector";

type CollateralDropdownProps = {
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  collateralTokens: GetTokenResult[] | undefined;
  showChainLogo?: boolean;
  market?: Market;
  parentMarket?: Market | undefined;
};

export function CollateralDropdown(props: CollateralDropdownProps) {
  const {
    collateralTokens,
    selectedCollateral,
    setSelectedCollateral,
    showChainLogo = false,
    market,
    parentMarket,
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  // Validate that selectedCollateral is in collateralTokens, if not, select the first one
  useEffect(() => {
    if (!collateralTokens || collateralTokens.length === 0) {
      return;
    }

    const isValidCollateral = collateralTokens.some((token) =>
      isTwoStringsEqual(token.address, selectedCollateral.address),
    );

    if (!isValidCollateral) {
      setSelectedCollateral(collateralTokens[0]);
    }
  }, [collateralTokens, selectedCollateral, setSelectedCollateral]);

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
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                isTwoStringsEqual(collateralToken.address, selectedCollateral.address) &&
                  "active border-l-[3px] border-l-purple-primary bg-purple-medium",
              )}
            >
              <div className="w-6 h-6 overflow-hidden flex-shrink-0 relative rounded-full">
                <TokenImageContent
                  token={collateralToken}
                  market={market}
                  parentMarket={parentMarket}
                  className="w-full h-full rounded-full"
                />
                {showChainLogo && (
                  <img
                    className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-white rounded-full"
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
      <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)] hover:bg-[#f2f2f2] cursor-pointer">
        <div className="w-6 h-6 overflow-hidden flex-shrink-0 relative rounded-full">
          <TokenImageContent
            token={selectedCollateral}
            market={market}
            parentMarket={parentMarket}
            className="w-full h-full rounded-full"
          />
          {showChainLogo && (
            <img
              className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-white rounded-full"
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
