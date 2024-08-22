import { useGlobalState } from "@/hooks/useGlobalState";
import { Market } from "@/hooks/useMarket";
import { StarFilled, StarOutlined } from "@/lib/icons";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { useAccount } from "wagmi";

function MarketFavorite({ market, colorClassName }: { market: Market; colorClassName?: string }) {
  const { address = "" } = useAccount();
  const favorites = useGlobalState((state) => state.favorites);
  const toggleFavorite = useGlobalState((state) => state.toggleFavorite);
  const isFavorite = favorites[address]?.find((x) => x === market.id);
  const [isShowTooltip, setShowTooltip] = useState(false);
  const setFavorite = () => {
    setShowTooltip(false);
    toggleFavorite(address, market.id);
  };
  return (
    <>
      <div
        onClick={address ? setFavorite : () => {}}
        className="cursor-pointer !ml-auto"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isShowTooltip &&
          createPortal(
            <Tooltip id={`favorite-tooltip_${market.id}`} isOpen={isShowTooltip}>
              {address
                ? isFavorite
                  ? "Remove from favorite"
                  : "Add to favorite"
                : "Connect your wallet to add to favorite"}
            </Tooltip>,
            document.body,
          )}
        {isFavorite ? (
          <div data-tooltip-id={`favorite-tooltip_${market.id}`}>
            <StarFilled />
          </div>
        ) : (
          <div className={colorClassName} data-tooltip-id={`favorite-tooltip_${market.id}`}>
            <StarOutlined fill="currentColor" />
          </div>
        )}
      </div>
    </>
  );
}

export default MarketFavorite;
