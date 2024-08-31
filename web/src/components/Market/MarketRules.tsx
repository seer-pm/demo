import { Market } from "@/hooks/useMarket";
import { useGraphMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { useEffect, useState } from "react";

interface MarketRulesProps {
  chainId: SupportedChain;
  market: Market;
}

export function MarketRules({ chainId, market }: MarketRulesProps) {
  const { data: graphMarket } = useGraphMarket(market.id, chainId);
  const [rules, setRules] = useState("");

  useEffect(() => {
    if (!graphMarket?.rules) {
      return;
    }

    (async () => {
      const response = await fetch(`https://ipfs.kleros.io${graphMarket?.rules}`);
      setRules(await response.text());
    })();
  }, [graphMarket?.rules]);

  if (!rules) {
    return null;
  }

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Rules</div>
      <div className="bg-white p-[24px] border rounded-[3px] drop-shadow-sm border-[#E5E5E5] whitespace-break-spaces">
        {rules}
      </div>
    </div>
  );
}
