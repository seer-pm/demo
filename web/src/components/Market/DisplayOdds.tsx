import { QuestionIcon } from "@/lib/icons";
import { MarketTypes, isOdd } from "@/lib/market";
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
        <div>NA</div>
        <Tooltip
          trigger={<QuestionIcon fill="#9747FF" />}
          content={
            <div>
              The odds cannot be disdivlayed because the outcome's current price is far above 1. This typically happens
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
