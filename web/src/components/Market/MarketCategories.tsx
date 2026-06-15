import { useGlobalState } from "@/hooks/useGlobalState";
import { useSignIn } from "@/hooks/useSignIn";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { CloseIcon, EditIcon, SaveIcon } from "@/lib/icons";
import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth, isAccessTokenExpired, isTwoStringsEqual } from "@/lib/utils";
import { getUseGraphMarketKey } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { MARKET_CATEGORIES } from "@seer-pm/sdk";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import MultiSelect from "../Form/MultiSelect";
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
      await queryClient.invalidateQueries({ queryKey: getUseGraphMarketKey(market.id, market.chainId) });
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
  const isCreator = isTwoStringsEqual(address, market.creator);
  const categoryTexts = MARKET_CATEGORIES.filter((c) => market.categories?.includes(c.value)).map((c) => c.text);

  if (isEdit) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-[240px]">
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
        </span>
        {isLoading ? (
          <Spinner className="w-[20px] bg-blue" />
        ) : (
          <span className="inline-flex items-center gap-1 fill-blue text-blue">
            <button className="group tooltip" onClick={() => saveCategories()} type="button">
              <p className="tooltiptext">Save</p>
              <span className="group-hover:opacity-80">
                <SaveIcon />
              </span>
            </button>
            <button className="group tooltip" onClick={() => setEdit(false)} type="button">
              <p className="tooltiptext">Cancel</p>
              <span className="group-hover:opacity-80">
                <CloseIcon fill="var(--blue)" width="18px" />
              </span>
            </button>
          </span>
        )}
      </span>
    );
  }

  if (categoryTexts.length === 0 && !isCreator) {
    return null;
  }

  return (
    <span className="tag">
      <span className="k">Category</span>
      <span className="v capitalize">{categoryTexts.length > 0 ? categoryTexts.join(", ") : "—"}</span>
      {isCreator && (
        <button
          className="group tooltip ml-1 flex items-center text-ink-4 hover:text-blue [&_svg]:w-[13px] [&_svg]:h-[13px] [&_*]:fill-current"
          onClick={() => setEdit(true)}
          type="button"
        >
          <p className="tooltiptext">Edit categories</p>
          <EditIcon />
        </button>
      )}
    </span>
  );
}

export default MarketCategories;
