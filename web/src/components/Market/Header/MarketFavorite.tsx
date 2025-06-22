import Button from "@/components/Form/Button";
import DropdownWrapper from "@/components/Form/DropdownWrapper";
import Input from "@/components/Form/Input";
import { useAllCollectionsMarkets } from "@/hooks/collections/useAllCollectionsMarkets";
import { useCreateCollection } from "@/hooks/collections/useCreateCollection";
import { useGetCollections } from "@/hooks/collections/useGetCollections";
import { useUpdateCollectionItem } from "@/hooks/collections/useUpdateCollectionItem";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";
import { CheckIcon, PlusCircleIcon, PlusIcon, StarFilled, StarOutlined } from "@/lib/icons";
import { Market } from "@/lib/market";
import { isAccessTokenExpired } from "@/lib/utils";
import { checkWalletConnectCallback } from "@/lib/wallet";
import clsx from "clsx";
import { useState } from "react";

function MarketFavorite({
  market,
  colorClassName,
  iconWidth = "14",
}: {
  market: Market;
  colorClassName?: string;
  iconWidth?: string;
}) {
  const accessToken = useGlobalState((state) => state.accessToken);
  const isAccountConnectedAndSignedIn = useIsConnectedAndSignedIn();

  const signIn = useSignIn();
  const updateCollectionItem = useUpdateCollectionItem();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: collectionsMarkets = [] } = useAllCollectionsMarkets();
  let { data: collections = [] } = useGetCollections();
  collections = [{ id: "default", name: "Default", url: "default" }, ...collections];
  const isFavorite = collectionsMarkets.map((x) => x.marketId).includes(market.id);
  const checkWalletConnectAndSignIn = () => {
    checkWalletConnectCallback((address, chainId) => {
      if (isAccessTokenExpired(accessToken)) {
        signIn.mutateAsync({ address: address, chainId: chainId });
      }
    });
  };
  const {
    Modal: AddCollectionModal,
    openModal: openAddCollectionModal,
    closeModal: closeAddCollectionModal,
  } = useModal("add-collection-modal");
  const createCollection = useCreateCollection(closeAddCollectionModal);
  return (
    <>
      <AddCollectionModal
        className="max-w-[500px]"
        title="Add Collection"
        content={
          <div className="space-y-3">
            <p>Enter collection name</p>
            <Input className="w-full" value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="flex justify-center items-center gap-2">
              <Button
                text="Cancel"
                type="button"
                variant="secondary"
                disabled={createCollection.isPending}
                onClick={() => closeAddCollectionModal()}
              />
              <Button
                text="Add"
                type="button"
                disabled={!input || createCollection.isPending}
                onClick={() => createCollection.mutate({ accessToken, name: input.trim() })}
              />
            </div>
          </div>
        }
      />
      <DropdownWrapper
        direction="auto"
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        className="bg-white w[300px]"
        content={
          // biome-ignore lint/complexity/noUselessFragments:
          <>
            {isAccountConnectedAndSignedIn ? (
              <div className="p-4 space-y-3">
                <p className="font-semibold">Collections</p>
                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      className="text-[14px] w-full gap-2 flex items-center justify-between rounded-[8px] p-2 hover:bg-[#ededed] transition-all"
                      onClick={() => {
                        updateCollectionItem.mutateAsync({
                          marketIds: [market.id],
                          accessToken,
                          collectionId: collection.id === "default" ? undefined : collection.id,
                        });
                        setIsOpen(false);
                      }}
                    >
                      <p className="whitespace-nowrap max-w-[250px] overflow-x-hidden text-ellipsis">
                        {collection.name}
                      </p>
                      {collectionsMarkets
                        .filter((x) =>
                          !x.collectionId ? collection.id === "default" : x.collectionId === collection.id,
                        )
                        .map((x) => x.marketId)
                        .includes(market.id) ? (
                        <CheckIcon />
                      ) : (
                        <PlusIcon />
                      )}
                    </button>
                  ))}
                </div>
                <div className="w-full h-[1px] bg-[#eaeaea]" />
                <button
                  className={clsx(
                    "flex items-center gap-2 px-[16px] py-[6.5px] text-[14px] text-center cursor-pointer text-purple-primary font-semibold hover:opacity-80 transition-all",
                  )}
                  onClick={() => {
                    openAddCollectionModal();
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <PlusCircleIcon width={20} />
                  <p>Add new collection</p>
                </button>
              </div>
            ) : (
              <div className="p-4">
                <button
                  type="button"
                  className={clsx(
                    "flex items-center gap-2 px-[16px] py-[6.5px] text-[14px] font-semibold text-center cursor-pointer text-purple-primary hover:opacity-80 transition-all",
                  )}
                  onClick={() => {
                    checkWalletConnectAndSignIn();
                    setIsOpen(false);
                  }}
                >
                  Sign in to manage collection
                </button>
              </div>
            )}
          </>
        }
      >
        {isFavorite ? (
          <div className="tooltip cursor-pointer">
            <p className="tooltiptext">Remove from collection</p>
            <StarFilled width={iconWidth} />
          </div>
        ) : (
          <div className={clsx(colorClassName, "tooltip cursor-pointer")}>
            <p className="tooltiptext">
              {isAccountConnectedAndSignedIn ? "Add to collection" : "Sign in to add to collection"}
            </p>
            <StarOutlined width={iconWidth} />
          </div>
        )}
      </DropdownWrapper>
    </>
  );
}

export default MarketFavorite;
