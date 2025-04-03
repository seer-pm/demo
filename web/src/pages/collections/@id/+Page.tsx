import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import Button from "@/components/Form/Button";
import DropdownWrapper from "@/components/Form/DropdownWrapper";
import Input from "@/components/Form/Input";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { PreviewCard } from "@/components/Market/PreviewCard";
import { useCollectionMarkets } from "@/hooks/collections/useCollectionMarkets";
import { useCreateCollection } from "@/hooks/collections/useCreateCollection";
import { useDeleteCollection } from "@/hooks/collections/useDeleteCollection";
import { useGetCollectionById } from "@/hooks/collections/useGetCollectionById";
import { useGetCollections } from "@/hooks/collections/useGetCollections";
import { useUpdateCollection } from "@/hooks/collections/useUpdateCollection";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";

import { useSortAndFilterResults } from "@/hooks/useSortAndFilterResults";
import { EditIcon, PlusCircleIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { checkWalletConnectCallback, isAccessTokenExpired, isTwoStringsEqual, shortenAddress } from "@/lib/utils";
import clsx from "clsx";
import { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import { useAccount } from "wagmi";

function CollectionsPage() {
  const isAccountConnectedAndSignedIn = useIsConnectedAndSignedIn();
  const { address } = useAccount();
  const signIn = useSignIn();
  const checkWalletConnectAndSignIn = () => {
    checkWalletConnectCallback((address, chainId) => {
      if (isAccessTokenExpired(accessToken)) {
        signIn.mutateAsync({ address: address, chainId: chainId });
      }
    });
  };
  const accessToken = useGlobalState((state) => state.accessToken);
  const {
    routeParams: { id: idOrSlug },
  } = usePageContext();
  const id = idOrSlug.split("-").slice(-1)[0] || idOrSlug;
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  let { data: collections = [] } = useGetCollections();
  collections = [{ id: "default", name: "Default", url: "default" }, ...collections];

  let { data: currentCollection } = useGetCollectionById(id === "default" ? "" : id);
  currentCollection = id === "default" ? { id: "default", name: "Default", userId: address ?? "" } : currentCollection;
  const { data: collectionMarkets } = useCollectionMarkets(id === "default" ? "" : id);
  const params = useMarketsSearchParams();
  const results = useMarkets({ ...params, marketIds: collectionMarkets, disabled: !collectionMarkets?.length });
  const {
    data: markets = [],
    isLoading,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterResults(params, results);
  const {
    Modal: AddCollectionModal,
    openModal: openAddCollectionModal,
    closeModal: closeAddCollectionModal,
  } = useModal("add-collection-modal");
  const {
    Modal: UpdateCollectionModal,
    openModal: openUpdateCollectionModal,
    closeModal: closeUpdateCollectionModal,
  } = useModal("update-collection-modal");
  const {
    Modal: DeleteCollectionModal,
    openModal: openDeleteCollectionModal,
    closeModal: closeDeleteCollectionModal,
  } = useModal("delete-collection-modal");

  const createCollection = useCreateCollection(closeAddCollectionModal);
  const updateCollection = useUpdateCollection(closeUpdateCollectionModal);
  const deleteCollection = useDeleteCollection(() => {
    navigate(paths.collection("default"));
    closeDeleteCollectionModal();
  });

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] ">
      <Breadcrumb links={[{ title: "Collections" }]} />
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
      <UpdateCollectionModal
        className="max-w-[500px]"
        title="Update Collection"
        content={
          <div className="space-y-3">
            <p>Enter a new collection name</p>
            <Input className="w-full" value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="flex justify-center items-center gap-2">
              <Button
                text="Cancel"
                type="button"
                variant="secondary"
                disabled={updateCollection.isPending}
                onClick={() => closeUpdateCollectionModal()}
              />
              <Button
                text="Update"
                type="button"
                disabled={!input || input.trim() === currentCollection?.name || updateCollection.isPending}
                onClick={() => updateCollection.mutate({ accessToken, name: input.trim(), collectionId: id })}
              />
            </div>
          </div>
        }
      />

      <DeleteCollectionModal
        className="max-w-[500px]"
        title="Delete Collection"
        content={
          <div className="space-y-3">
            <p className="text-center">This action cannot be undone. Continue?</p>
            <div className="flex justify-center items-center gap-2">
              <Button
                text="Cancel"
                type="button"
                variant="secondary"
                disabled={deleteCollection.isPending}
                onClick={() => closeDeleteCollectionModal()}
              />
              <Button
                text="Delete"
                type="button"
                disabled={deleteCollection.isPending}
                onClick={() => deleteCollection.mutate({ accessToken, collectionId: id })}
              />
            </div>
          </div>
        }
      />
      {(!address || isAccessTokenExpired(accessToken)) && (
        <button
          className="text-purple-primary hover:opacity-80"
          type="button"
          onClick={() => checkWalletConnectAndSignIn()}
        >
          Sign in to view and manage your market collections
        </button>
      )}

      {isAccountConnectedAndSignedIn && collections.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {collections.map((collection) => {
            return (
              <button
                className={clsx(
                  "border-2 border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-black-medium text-[14px] text-center cursor-pointer hover:border-purple-primary transition-all",
                  id === collection.id && "bg-purple-primary text-white",
                )}
                key={collection.id}
                onClick={() => navigate(paths.collection(collection.url ?? collection.id))}
                type="button"
              >
                {collection.name}
              </button>
            );
          })}
          <button
            className={clsx(
              "flex items-center gap-2 px-[16px] py-[6.5px] text-[14px] text-center cursor-pointer text-purple-primary font-semibold hover:opacity-80 transition-all",
            )}
            onClick={() => openAddCollectionModal()}
            type="button"
          >
            <PlusCircleIcon width={20} />
            <p>Add new collection</p>
          </button>
        </div>
      )}

      {currentCollection && (
        <div>
          <div className="flex gap-2 items-center">
            <p className="text-[24px] font-semibold">
              {currentCollection.name}
              {isTwoStringsEqual(currentCollection.userId, address)
                ? ""
                : currentCollection.userId
                  ? ` (${shortenAddress(currentCollection.userId)}'s collection)`
                  : ""}
            </p>
            {id !== "default" &&
              isAccountConnectedAndSignedIn &&
              isTwoStringsEqual(currentCollection.userId, address) && (
                <DropdownWrapper
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  className="w-[200px]"
                  content={
                    <div className="p-2">
                      <button
                        type="button"
                        className="w-full rounded-[8px] p-2 hover:bg-[#ededed] transition-all"
                        onClick={() => {
                          setInput(currentCollection!.name);
                          openUpdateCollectionModal();
                        }}
                      >
                        Edit Collection Name
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-[8px] p-2 hover:bg-[#ededed] transition-all"
                        onClick={() => openDeleteCollectionModal()}
                      >
                        Remove Collection
                      </button>
                    </div>
                  }
                >
                  <div className="fill-purple-primary group tooltip cursor-pointer">
                    <p className="tooltiptext">Edit</p>
                    <div className="group-hover:opacity-80">
                      <EditIcon />
                    </div>
                  </div>
                </DropdownWrapper>
              )}
          </div>
        </div>
      )}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="shimmer-container h-[450px]"></div>
          <div className="shimmer-container h-[450px]"></div>
        </div>
      )}

      {!isLoading && markets.length === 0 && <Alert type="warning">No markets in this collection.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {markets.map((market) => (
          <PreviewCard key={market.id} market={market} />
        ))}
      </div>
      <MarketsPagination pageCount={pageCount} handlePageClick={handlePageClick} page={page} />
    </div>
  );
}

export default CollectionsPage;
