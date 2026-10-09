import MarketChart from "@/components/Market/MarketChart/MarketChart";
import PoolTab from "@/components/Market/PoolDetails/PoolTab";
import { Market, MarketTypes, getMarketType } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";

type ActiveTab = "liquidity" | "chart";

export function OutcomeActivePanel({
  market,
  outcomeIndex,
}: {
  market: Market;
  outcomeIndex: number;
}) {
  const isScalar = getMarketType(market) === MarketTypes.SCALAR;
  const [activeTab, setActiveTab] = useState<ActiveTab>("liquidity");
  return (
    <div className="border-t border-purple-primary rounded-b-[3px] bg-base-100">
      <div>
        {!isScalar && (
          <div
            role="tablist"
            className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar px-4 pt-2 flex"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "liquidity"}
              className={clsx("tab", activeTab === "liquidity" && "tab-active")}
              onClick={() => setActiveTab("liquidity")}
            >
              Liquidity
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "chart"}
              className={clsx("tab", activeTab === "chart" && "tab-active")}
              onClick={() => setActiveTab("chart")}
            >
              Chart
            </button>
          </div>
        )}
        <div className="p-4">
          {activeTab === "liquidity" || isScalar ? (
            <div>
              <PoolTab market={market} outcomeIndex={outcomeIndex} />
            </div>
          ) : (
            <MarketChart market={market} outcomeIndex={outcomeIndex} embedded />
          )}
        </div>
      </div>
    </div>
  );
}
