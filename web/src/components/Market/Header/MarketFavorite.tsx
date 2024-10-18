import { useGlobalState } from "@/hooks/useGlobalState";
import { Market } from "@/hooks/useMarket";
import { StarFilled, StarOutlined } from "@/lib/icons";
import clsx from "clsx";
import { useAccount } from "wagmi";

function MarketFavorite({ market, colorClassName }: { market: Market; colorClassName?: string }) {
  const { address = "" } = useAccount();
  const favorites = useGlobalState((state) => state.favorites);
  const toggleFavorite = useGlobalState((state) => state.toggleFavorite);
  const isFavorite = favorites[address]?.find((x) => x === market.id);
  const setFavorite = () => {
    toggleFavorite(address, market.id);
  };
  return (
    <>
      <div onClick={address ? setFavorite : () => {}} className="cursor-pointer !ml-auto flex items-center">
        {isFavorite ? (
          <div className="tooltip">
            <p className="tooltiptext">Remove from favorite</p>
            <StarFilled />
          </div>
        ) : (
          <div className={clsx(colorClassName, "tooltip")}>
            <p className="tooltiptext">{address ? "Add to favorite" : "Connect your wallet to add to favorite"}</p>
            <StarOutlined fill="currentColor" />
          </div>
        )}
      </div>
    </>
  );
}

export default MarketFavorite;
