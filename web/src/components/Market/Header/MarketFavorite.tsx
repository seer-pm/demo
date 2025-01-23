import { useFavorites } from "@/hooks/useFavorites";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { Market } from "@/hooks/useMarket";
import { useSignIn } from "@/hooks/useSignIn";
import { useUpdateCollectionItem } from "@/hooks/useUpdateCollectionItem";
import { StarFilled, StarOutlined } from "@/lib/icons";
import { checkWalletConnectCallback, isAccessTokenExpired } from "@/lib/utils";
import clsx from "clsx";

function MarketFavorite({ market, colorClassName }: { market: Market; colorClassName?: string }) {
  const accessToken = useGlobalState((state) => state.accessToken);
  const isAccountConnectedAndSignedIn = useIsConnectedAndSignedIn();

  const signIn = useSignIn();
  const updateCollectionItem = useUpdateCollectionItem();

  const { data: favorites = [], isLoading } = useFavorites();
  const isFavorite = favorites.includes(market.id);
  const checkWalletConnectAndSignIn = () => {
    checkWalletConnectCallback((address, chainId) => {
      if (isAccessTokenExpired(accessToken)) {
        signIn.mutateAsync({ address: address, chainId: chainId });
      }
    });
  };
  return (
    <>
      <button
        type="button"
        onClick={() =>
          isAccountConnectedAndSignedIn
            ? updateCollectionItem.mutateAsync({ marketIds: [market.id], accessToken })
            : checkWalletConnectAndSignIn()
        }
        className="cursor-pointer !ml-auto flex items-center"
        disabled={updateCollectionItem.isPending || isLoading}
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
      </button>
    </>
  );
}

export default MarketFavorite;
