import { useGlobalState } from "@/hooks/useGlobalState";
import { Market } from "@/hooks/useMarket";
import { StarFilled, StarOutlined } from "@/lib/icons";
import { Tooltip } from "react-tooltip";
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
      <Tooltip id="favorite-tooltip">Connect your wallet to add to favorite.</Tooltip>
      <div onClick={address ? setFavorite : () => {}} className="cursor-pointer !ml-auto">
        {isFavorite ? (
          <StarFilled />
        ) : (
          <div className={colorClassName} data-tooltip-id={address ? "" : "favorite-tooltip"}>
            <StarOutlined fill="currentColor" />
          </div>
        )}
      </div>
    </>
  );
}

export default MarketFavorite;
