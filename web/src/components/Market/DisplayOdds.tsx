import { QuestionIcon } from "@/lib/icons";
import { MarketTypes, isOdd } from "@/lib/market";

export function DisplayOdds({ odd, marketType }: { odd: number | undefined | null; marketType: MarketTypes }) {
  if (!isOdd(odd)) {
    return (
      <div className="flex space-x-2 items-center">
        <div>NA</div>
        <div className="tooltip ml-auto">
          <p className="tooltiptext w-[300px] !whitespace-break-spaces">
            The odds cannot be displayed because the outcome's current price is far above 1. This typically happens when
            there is insufficient liquidity in the market.
          </p>
          <QuestionIcon fill="#9747FF" />
        </div>
      </div>
    );
  }
  if (marketType === MarketTypes.SCALAR || marketType === MarketTypes.MULTI_CATEGORICAL) {
    return odd === 0 ? 0 : (odd! / 100).toFixed(3);
  }

  return `${odd}%`;
}
