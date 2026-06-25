import MarketChart from "@/components/Market/MarketChart/MarketChart";
import PoolTab from "@/components/Market/PoolDetails/PoolTab";
import { Market, MarketTypes, getMarketType } from "@seer-pm/sdk";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const syncHeight = () => setMaxHeight(el.scrollHeight);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);

    const frame = requestAnimationFrame(() => setIsOpen(true));

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out border-t border-purple-primary rounded-b-[3px] bg-base-100"
      style={{
        maxHeight: isOpen ? maxHeight : 0,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div ref={contentRef}>
        {!isScalar && (
          <div
            role="tablist"
            className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar px-4 pt-2 flex"
          >
            <button
              type="button"
              role="tab"
              className={clsx("tab", activeTab === "liquidity" && "tab-active")}
              onClick={() => setActiveTab("liquidity")}
            >
              Liquidity
            </button>
            <button
              type="button"
              role="tab"
              className={clsx("tab", activeTab === "chart" && "tab-active")}
              onClick={() => setActiveTab("chart")}
            >
              Chart
            </button>
          </div>
        )}
        <div className="p-4">
          {activeTab === "liquidity" || isScalar ? (
            <div className="max-h-[600px] overflow-y-auto">
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
