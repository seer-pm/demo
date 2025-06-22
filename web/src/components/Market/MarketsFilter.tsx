import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useSearchParams } from "@/hooks/useSearchParams";
import { Collections, Filter, PlusCircleIcon, SearchIcon } from "@/lib/icons";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LinkButton } from "../Form/Button";
import Input from "../Form/Input";
import { Link } from "../Link";
import { MARKET_CATEGORIES } from "../MarketForm";
import { MarketsFilterBox } from "./MarketsFilterBox";

export function MarketsFilter({ isFutarchyPage }: { isFutarchyPage: boolean }) {
  const { address } = useAccount();
  const [searchParams] = useSearchParams();
  const {
    setMarketName: setMarketNameParam,
    // isShowMyMarkets,
    // toggleShowMyMarkets,
    hasFilters,
    marketName: marketNameParam,
    categoryList,
    setCategories,
  } = useMarketsSearchParams();
  const [marketName, setMarketName] = useState(marketNameParam || "");
  useEffect(() => {
    setMarketName(marketNameParam ?? "");
  }, [marketNameParam]);
  const debounceSetMarketNameParams = useCallback(
    debounce((value) => {
      setMarketNameParam(value);
    }, 300),
    [searchParams],
  );
  const onChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = (event.target as HTMLInputElement).value;
    setMarketName(value);
    debounceSetMarketNameParams(value);
  };

  const [isShowFilters, setShowFilters] = useState(false);
  return (
    <div>
      <div className="flex flex-col lg:flex-row max-lg:space-y-[12px] lg:space-x-[24px] relative">
        <div className="grow @container">
          <Input
            placeholder="Search by market, outcome or collection"
            className="w-full text-[13px] @[250px]:text-[14px] @[400px]:text-[16px]"
            icon={<SearchIcon fill="#9747ff" />}
            value={marketName}
            onChange={onChangeName}
            isClearable
            onClear={() => {
              setMarketName("");
              debounceSetMarketNameParams("");
            }}
          />
        </div>
        <button
          type="button"
          className={clsx(
            "select select-bordered bg-white lg:w-[210px] flex items-center gap-2 w-full",
            isShowFilters && "!outline-purple-primary !outline-2 outline outline-offset-2",
          )}
          onClick={() => setShowFilters((state) => !state)}
        >
          <div className="relative">
            {hasFilters && <div className="absolute w-2 h-2 bg-error-primary rounded-full right-[-5px] top-[-5px]" />}
            <Filter />
          </div>{" "}
          Filters
        </button>
        {isShowFilters && (
          <div className="absolute lg:top-[60px] top-[110px] left-0 w-full !ml-0 z-[1]">
            <MarketsFilterBox setShowFilters={setShowFilters} />
          </div>
        )}

        <div>
          <LinkButton
            to={isFutarchyPage ? "/futarchy/create-proposal" : "/create-market"}
            text={isFutarchyPage ? "Create New Proposal" : "Create New Market"}
            icon={<PlusCircleIcon />}
            className="max-lg:w-full min-w-[256px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-8">
        {[{ value: "all", text: "All" }, ...MARKET_CATEGORIES].map((category) => {
          if (category.value === "all") {
            return (
              <button
                className={clsx(
                  "border-2 border-white rounded-[300px] px-[16px] py-[6.5px] bg-[#FBF8FF] text-[#9747FF] text-[14px] text-center cursor-pointer hover:border-purple-primary transition-all",
                  !categoryList && "!bg-purple-primary !text-white",
                )}
                key={category.value}
                onClick={() => setCategories(undefined)}
                type="button"
              >
                {category.text}
              </button>
            );
          }
          return (
            <button
              className={clsx(
                "border-2 border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-[#FBF8FF] text-[#9747FF] text-[14px] text-center cursor-pointer hover:border-purple-primary transition-all",
                categoryList?.includes(category.value) && "!bg-purple-primary !text-white",
              )}
              key={category.value}
              onClick={() => setCategories([category.value])}
              type="button"
            >
              {category.text}
            </button>
          );
        })}
        {address && (
          <Link
            to={"/collections/default"}
            className="whitespace-nowrap flex items-center gap-2 ml-auto hover:opacity-80"
          >
            <Collections />
            <p className="text-[14px] text-purple-primary">My collections</p>
          </Link>
        )}
      </div>
    </div>
  );
}
