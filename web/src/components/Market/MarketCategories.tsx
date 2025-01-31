import { useGlobalState } from "@/hooks/useGlobalState";
import { Market, getUseGraphMarketKey } from "@/hooks/useMarket";
import { useSignIn } from "@/hooks/useSignIn";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { CloseIcon, EditIcon, SaveIcon } from "@/lib/icons";
import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth, isAccessTokenExpired, isTwoStringsEqual } from "@/lib/utils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import MultiSelect from "../Form/MultiSelect";
import { MARKET_CATEGORIES } from "../MarketForm";
import { Spinner } from "../Spinner";

function MarketCategories({ market }: { market: Market }) {
  const { address, chainId = DEFAULT_CHAIN } = useAccount();
  const [isEdit, setEdit] = useState(false);
  const [isLoading, setLoading] = useState(false);
  let accessToken = useGlobalState((state) => state.accessToken);
  const signIn = useSignIn();
  const useFormReturn = useForm<{ marketCategories: string[] }>({
    mode: "all",
    defaultValues: {
      marketCategories: market.categories ?? [],
    },
  });
  const categories = useFormReturn.watch("marketCategories");
  const saveCategories = async () => {
    setLoading(true);
    try {
      if (isAccessTokenExpired(accessToken)) {
        const data = await signIn.mutateAsync({ address: address!, chainId: chainId! });
        accessToken = data.token;
      }
      await fetchAuth(accessToken, "/.netlify/functions/market-categories", "POST", {
        marketId: market.id,
        categories,
        chainId: market.chainId,
      });
      await queryClient.invalidateQueries({ queryKey: getUseGraphMarketKey(market.id) });
      queryClient.invalidateQueries({ queryKey: ["useGraphMarkets"] });
      setEdit(false);
      // biome-ignore lint/suspicious/noExplicitAny:
    } catch (e: any) {
      if (e && e?.cause?.code !== 4001) {
        toastError({ title: e?.details || e?.message || e });
      }
    }
    setLoading(false);
  };
  return (
    <div className="text-left flex items-center gap-2 flex-wrap">
      <div className="w-full flex items-center gap-2 font-semibold">
        {isEdit ? "Edit Categories" : "Categories"}{" "}
        {isEdit ? (
          <>
            {isLoading ? (
              <Spinner className="w-[20px] bg-purple-primary" />
            ) : (
              <div className="flex items-center gap-1">
                <button className="fill-purple-primary group tooltip" onClick={() => saveCategories()} type="button">
                  <p className="tooltiptext">Save</p>
                  <div className="group-hover:opacity-80">
                    <SaveIcon />
                  </div>
                </button>
                <button className="fill-purple-primary group tooltip" onClick={() => setEdit(false)} type="button">
                  <p className="tooltiptext">Cancel</p>
                  <div className="group-hover:opacity-80">
                    <CloseIcon fill="#9747ff" width="20px" />
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {isTwoStringsEqual(address, market.creator) && (
              <button className="fill-purple-primary group tooltip" onClick={() => setEdit(true)} type="button">
                <p className="tooltiptext">Edit</p>
                <div className="group-hover:opacity-80">
                  <EditIcon />
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {isEdit ? (
        <div className="w-[300px]">
          <MultiSelect
            options={MARKET_CATEGORIES}
            useFormReturn={useFormReturn}
            {...useFormReturn.register("marketCategories", {
              validate: {
                arrayNotEmpty: (v) => v.length > 0 || "Select at least one.",
              },
            })}
            value={categories}
            onChange={(values) => useFormReturn.setValue("marketCategories", values)}
            placeholder="Select one or more options"
          />
        </div>
      ) : (
        MARKET_CATEGORIES.map((category) => {
          if (market.categories?.includes(category.value)) {
            return (
              <div
                className="border border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-[#f2f2f2] text-[14px] text-center"
                key={category.value}
              >
                {category.text}
              </div>
            );
          }
          return null;
        })
      )}
    </div>
  );
}

export default MarketCategories;
