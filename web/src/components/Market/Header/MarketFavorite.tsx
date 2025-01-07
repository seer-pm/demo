import { useFavorites } from "@/hooks/useFavorites";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { Market } from "@/hooks/useMarket";
import { useSignIn } from "@/hooks/useSignIn";
import { useUpdateCollectionItem } from "@/hooks/useUpdateCollectionItem";
import { StarFilled, StarOutlined } from "@/lib/icons";
import clsx from "clsx";
import { useAccount } from "wagmi";

function MarketFavorite({ market, colorClassName }: { market: Market; colorClassName?: string }) {
  const { address, chainId } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const isAccountConnectedAndSignedIn = useIsConnectedAndSignedIn();

  const signIn = useSignIn();
  const updateCollectionItem = useUpdateCollectionItem();

  const { data: favorites = [] } = useFavorites();
  const isFavorite = favorites.includes(market.id) || updateCollectionItem.isPending; // optimistic update
  return (
    <>
      <div
        onClick={() =>
          isAccountConnectedAndSignedIn
            ? updateCollectionItem.mutateAsync({ marketIds: [market.id], accessToken })
            : signIn.mutateAsync({ address: address!, chainId: chainId! })
        }
        className="cursor-pointer !ml-auto flex items-center"
      >
        {isFavorite ? (
          <div className="tooltip">
            <p className="tooltiptext">Remove from favorite</p>
            <StarFilled />
          </div>
        ) : (
          <div className={clsx(colorClassName, "tooltip")}>
            <p className="tooltiptext">
              {isAccountConnectedAndSignedIn ? "Add to favorite" : "Sign in to add to favorite"}
            </p>
            <StarOutlined fill="currentColor" />
          </div>
        )}
      </div>
    </>
  );
}

export default MarketFavorite;
