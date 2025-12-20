import { seerCreditsAddress } from "@/hooks/contracts/generated-trading-credits";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { FUTARCHY_LP_PAIRS_MAPPING, Market, getFixedCollateral } from "@/lib/market";
import { paths } from "@/lib/paths";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { Address } from "viem";
import { CollateralDropdown } from "../CollateralDropdown";
import { OutcomeImage } from "../OutcomeImage";

interface TokenSelectorProps {
  type: "buy" | "sell";
  sellToken: Token;
  buyToken: Token;
  selectedCollateral: Token;
  market: Market;
  setPreferredCollateral: (collateral: Token, chainId: number) => void;
  parentMarket: Market | undefined;
  outcomeIndex: number;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
  outcomeText: string;
}

function getCollateralOptions(market: Market, type: "buy" | "sell", _sellToken: Token, _buyToken: Token): Address[] {
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

export const TokenSelector = ({
  type,
  sellToken,
  buyToken,
  selectedCollateral,
  market,
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

  const fixedCollateral = getFixedCollateral(market, outcomeIndex);

  const { data: collateralTokens } = useTokensInfo(
    getCollateralOptions(market, type, sellToken, buyToken),
    market.chainId,
  );

  if (isTokenCollateral && isUndefined(fixedCollateral)) {
    return (
      <CollateralDropdown
        selectedCollateral={selectedCollateral}
        setSelectedCollateral={(selectedCollateral) => setPreferredCollateral(selectedCollateral, market.chainId)}
        collateralTokens={collateralTokens}
      />
    );
  }
  const imageElement = (() => {
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
