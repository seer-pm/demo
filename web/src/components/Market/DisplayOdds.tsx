import { QuestionIcon } from "@/lib/icons";
import { Tooltip } from "@seer-pm/discussions/tooltip";
import { MarketTypes, isOdd } from "@seer-pm/sdk";

export function DisplayOdds({
  odd,
  marketType,
}: {
  odd: number | undefined | null;
  marketType: MarketTypes;
}) {
  if (!isOdd(odd)) {
    return (
      <div className="flex space-x-2 items-center">
        <div>NA</div>
        <Tooltip
          trigger={
            <button
              type="button"
              className="inline-flex cursor-help border-0 bg-transparent p-0"
              aria-label="Why odds are unavailable"
            >
              <QuestionIcon fill="#9747FF" />
            </button>
          }
          content={
            <div>
              The odds cannot be displayed because the outcome's current price is far above 1. This typically happens
              when there is insufficient liquidity in the market.
            </div>
          }
        />
      </div>
    );
  }
  if (marketType === MarketTypes.SCALAR || marketType === MarketTypes.MULTI_CATEGORICAL) {
    return odd === 0 ? 0 : (odd! / 100).toFixed(3);
  }

  return `${odd}%`;
}
