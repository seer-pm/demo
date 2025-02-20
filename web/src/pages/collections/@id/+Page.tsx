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
import { useGetCollections } from "@/hooks/collections/useGetCollections";
import { useUpdateCollection } from "@/hooks/collections/useUpdateCollection";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useMarkets } from "@/hooks/useMarkets";
import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useModal } from "@/hooks/useModal";

import { useSignIn } from "@/hooks/useSignIn";
import { useSortAndFilterResults } from "@/hooks/useSortAndFilterResults";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { EditIcon, PlusCircleIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isAccessTokenExpired } from "@/lib/utils";
import clsx from "clsx";
import { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import { useAccount } from "wagmi";

function CollectionsPage() {
  const { address, chainId = DEFAULT_CHAIN } = useAccount();
  let accessToken = useGlobalState((state) => state.accessToken);
  const signIn = useSignIn();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  let { data: collections = [] } = useGetCollections();
  const {
    routeParams: { id },
  } = usePageContext();
  const { data: collectionMarkets } = useCollectionMarkets(id === "default" ? "" : id);
  const params = useMarketsSearchParams();
  const results = useMarkets({ ...params, marketIds: collectionMarkets, disabled: !collectionMarkets?.length });
  const {
    data: markets = [],
    isLoading,
    pagination: { pageCount, handlePageClick, page },
  } = useSortAndFilterResults(params, results);
  collections = [{ id: "default", name: "Default" }, ...collections];
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

  if (!address) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Account not found">
          Connect your wallet to see your market collections.
        </Alert>
      </div>
    );
  }
  if (isAccessTokenExpired(accessToken)) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px] space-y-4">
        <Alert type="info" title="Sign in required">
          Sign in to see your market collections.
          <div className="mt-2">
            <Button
              type="button"
              text="Sign In"
              onClick={async () => {
                const data = await signIn.mutateAsync({ address: address!, chainId: chainId! });
                accessToken = data.token;
              }}
            />
          </div>
        </Alert>
      </div>
    );
  }
  const currentCollection = collections.find((x) => x.id === id);
  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
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

      {collections.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {collections.map((collection) => {
            return (
              <button
                className={clsx(
                  "border-2 border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-black-medium text-[14px] text-center cursor-pointer hover:border-purple-primary transition-all",
                  id === collection.id && "bg-purple-primary text-white",
                )}
                key={collection.id}
                onClick={() => navigate(paths.collection(collection.id))}
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
            <p className="text-[24px] font-semibold">{currentCollection.name}</p>
            {id !== "default" && (
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
                        setInput(currentCollection.name);
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
