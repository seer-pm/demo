import { QuestionIcon } from "@/lib/icons";
import { MarketTypes, isOdd } from "@seer-pm/sdk";
import Tooltip from "../Tooltip";

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
        <span className="text-xs font-medium tracking-normal">Price unavailable</span>
        <Tooltip
          trigger={<QuestionIcon fill="#7D33FF" />}
          content={
            <div>
              A reliable price is not available for this outcome. This can happen when there is insufficient liquidity.
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
