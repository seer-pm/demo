import { Market } from "@/lib/market";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { IOutcomeData } from "./MarketChart";

interface LegendProps {
  outcomesData: IOutcomeData[];
  visibleOutcomes: Set<string>;
  onToggleOutcome: (outcomeName: string) => void;
  market: Market;
}

const Legend: React.FC<LegendProps> = ({ outcomesData, visibleOutcomes, onToggleOutcome, market }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (outcomesData.length === 0) {
    return null;
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [outcomesData]);

  return (
    <div className="relative flex items-center pr-16">
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {outcomesData.map(({ outcome, data }, index) => {
          const isVisible = visibleOutcomes.has(outcome.name);
          const lastValue = data.slice(-1)?.[0]?.value;
          const decimalPlaces = market.type === "Futarchy" ? 3 : 1;
          const formattedValue = lastValue
            ? lastValue % 1 === 0
              ? `${lastValue}%`
              : `${lastValue.toFixed(decimalPlaces)}%`
            : "0%";

          return (
            <div
              key={`item-${index}`}
              onClick={() => onToggleOutcome(outcome.name)}
              className="flex items-center justify-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs whitespace-nowrap transition-colors hover:bg-gray-50"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isVisible ? outcome.color : "#d1d5db",
                  opacity: isVisible ? 1 : 0.6,
                }}
              />
              <span className="truncate max-w-[200px]">{outcome.name}</span>
              <span className="text-gray-600">{formattedValue}</span>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons on the right */}
      <div className="absolute right-0 flex gap-1">
        {/* Left arrow button */}
        <button
          type="button"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={clsx(
            "w-6 h-6 flex items-center justify-center transition-opacity",
            !canScrollLeft && "opacity-30 cursor-not-allowed",
          )}
        >
          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-gray-600" />
        </button>

        {/* Right arrow button */}
        <button
          type="button"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={clsx(
            "w-6 h-6 flex items-center justify-center transition-opacity",
            !canScrollRight && "opacity-30 cursor-not-allowed",
          )}
        >
          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Legend;
