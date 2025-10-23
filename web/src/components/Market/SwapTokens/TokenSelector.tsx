import { FUTARCHY_LP_PAIRS_MAPPING, Market } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { MarketCollateralDropdown } from "../CollateralDropdown";
import { OutcomeImage } from "../OutcomeImage";

interface TokenSelectorProps {
  type: "buy" | "sell";
  sellToken: Token;
  buyToken: Token;
  selectedCollateral: Token;
  market: Market;
  fixedCollateral: Token | undefined;
  setPreferredCollateral: (collateral: Token, chainId: number) => void;
  parentMarket: Market | undefined;
  outcomeIndex: number;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
  outcomeText: string;
}

export const TokenSelector = ({
  type,
  sellToken,
  buyToken,
  selectedCollateral,
  market,
  fixedCollateral,
  setPreferredCollateral,
  parentMarket,
  outcomeIndex,
  outcomeImage,
  isInvalidOutcome,
  outcomeText,
}: TokenSelectorProps) => {
  const isTokenCollateral = isTwoStringsEqual(
    type === "sell" ? sellToken.address : buyToken.address,
    selectedCollateral.address,
  );
  if (isTokenCollateral && isUndefined(fixedCollateral)) {
    return (
      <MarketCollateralDropdown
        market={market}
        selectedCollateral={selectedCollateral}
        setSelectedCollateral={(selectedCollateral) => setPreferredCollateral(selectedCollateral, market.chainId)}
      />
    );
  }
  const imageElement = (() => {
    const isTokenCollateral = isTwoStringsEqual(
      type === "sell" ? sellToken.address : buyToken.address,
      selectedCollateral.address,
    );
    if (isTokenCollateral) {
      if (isUndefined(fixedCollateral)) {
        return (
          <img
            className="w-full h-full"
            alt={selectedCollateral.symbol}
            src={paths.tokenImage(selectedCollateral.address, market.chainId)}
          />
        );
      }
      if (market.type === "Futarchy") {
        return (
          <OutcomeImage
            className="w-full h-full"
            image={market.images?.outcomes?.[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
            isInvalidOutcome={false}
            title={market.outcomes[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]]}
          />
        );
      }
      if (!parentMarket) {
        return <div className="w-full h-full bg-purple-primary"></div>;
      }
      return (
        <OutcomeImage
          className="w-full h-full"
          image={parentMarket.images?.outcomes?.[Number(market.parentOutcome)]}
          isInvalidOutcome={
            parentMarket.type === "Generic" && Number(market.parentOutcome) === parentMarket.wrappedTokens.length - 1
          }
          title={parentMarket.outcomes[Number(market.parentOutcome)]}
        />
      );
    }
    return (
      <OutcomeImage
        className="w-full h-full"
        image={outcomeImage}
        isInvalidOutcome={isInvalidOutcome}
        title={outcomeText}
      />
    );
  })();
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
      <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">{imageElement}</div>
      <p className="font-semibold text-[16px]">{type === "sell" ? sellToken.symbol : buyToken.symbol}</p>
    </div>
  );
};

export function TokenImage({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#f2f2f2] px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)]">
      <div className="rounded-full w-6 h-6 overflow-hidden flex-shrink-0">
        <img className="w-full h-full" alt={token.symbol} src={paths.tokenImage(token.address, token.chainId)} />
      </div>
      <p className="font-semibold text-[16px]">{token.symbol}</p>
    </div>
  );
}
