import { GetTokenResult } from "@/hooks/useTokenInfo";
import { ArrowDropDown } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import clsx from "clsx";
import { useState } from "react";
import DropdownWrapper from "../Form/DropdownWrapper";

type CollateralDropdownProps = {
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  collateralTokens: GetTokenResult[] | undefined;
  showChainLogo?: boolean;
};

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
                "px-[15px] py-[10px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary flex items-center gap-2 cursor-pointer",
                isTwoStringsEqual(collateralToken.address, selectedCollateral.address) &&
                  "active border-l-[3px] border-l-purple-primary bg-purple-medium",
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
        <div className="w-6 h-6 overflow-hidden flex-shrink-0 relative">
          <img
            className="w-full h-full rounded-full"
            alt={selectedCollateral.symbol}
            src={paths.tokenImage(selectedCollateral.address, selectedCollateral.chainId)}
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
