import { useConvertToAssets } from "@/hooks/trade/handleSDAI";
import { Market } from "@/hooks/useMarket";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { DaiLogo } from "@/lib/icons";
import { displayBalance, isUndefined } from "@/lib/utils";
import { gnosis } from "viem/chains";

export function OpenInterest({ market, parentMarket }: { market: Market; parentMarket: Market | undefined }) {
  if (market.type === "Futarchy") {
    return null;
  }
  const content = <GenericOpenInterest market={market} parentMarket={parentMarket} />;

  if (!content) {
    return null;
  }

  return (
    <div className="!flex items-center gap-2 tooltip">
      <p className="tooltiptext @[510px]:hidden">Open interest</p>
      <span className="text-black-secondary @[510px]:block hidden">Open interest:</span> {content}
    </div>
  );
}

function GenericOpenInterest({ market, parentMarket }: { market: Market; parentMarket: Market | undefined }) {
  const { data: daiAmount } = useConvertToAssets(market.outcomesSupply, market.chainId);
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );

  if (isUndefined(daiAmount)) {
    return null;
  }

  return !parentMarket ? (
    <>
      {displayBalance(daiAmount!, 18, true)} {market.chainId === gnosis.id ? "xDAI" : "DAI"}
      <DaiLogo />
    </>
  ) : (
    <div>
      {displayBalance(market.outcomesSupply, 18, true)} {parentCollateral?.symbol ?? ""}
    </div>
  );
}
