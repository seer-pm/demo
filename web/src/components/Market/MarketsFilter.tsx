import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { useSearchParams } from "@/hooks/useSearchParams";
import { FilterLineIcon, SearchLineIcon } from "@/lib/icons";
import { MARKET_CATEGORIES } from "@seer-pm/sdk";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useState } from "react";
import { LinkButton } from "../Form/Button";
import Input from "../Form/Input";
import { Link } from "../Link";
import { MarketsFilterBox } from "./MarketsFilterBox";

export function MarketsFilter({ isFutarchyPage = false }: { isFutarchyPage?: boolean }) {
  const [searchParams] = useSearchParams();
  const {
    setMarketName: setMarketNameParam,
    // showMyMarkets,
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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-[12px] lg:gap-[14px] lg:items-center relative">
        <div className="grow @container">
          <Input
            placeholder="Search by market, outcome or collection"
            className="w-full h-[44px] !rounded-full !border-[var(--border)] text-[13px] @[400px]:text-[14px] placeholder:text-ink-5"
            icon={<SearchLineIcon fill="var(--ink-5)" />}
            value={marketName}
            onChange={onChangeName}
            isClearable
            onClear={() => {
              setMarketName("");
              debounceSetMarketNameParams("");
            }}
            disabled={!isClient}
          />
        </div>
        <button
          type="button"
          className={clsx(
            "h-[44px] px-[18px] rounded-full border border-[var(--border)] bg-surface text-ink-2 text-[14px] font-medium flex items-center justify-center gap-2 w-full lg:w-auto transition-colors hover:bg-bg-2 hover:border-[var(--ink-5)]",
            isShowFilters && "!border-blue",
          )}
          onClick={() => setShowFilters((state) => !state)}
        >
          <div className="relative flex items-center">
            {hasFilters && <div className="absolute w-2 h-2 bg-error-primary rounded-full right-[-5px] top-[-5px]" />}
            <FilterLineIcon fill="var(--ink-3)" />
          </div>
          Filters
          <span className="text-[9px] text-ink-5">▾</span>
        </button>
        {isShowFilters && (
          <div className="absolute lg:top-[60px] top-[110px] left-0 w-full !ml-0 z-30">
            <MarketsFilterBox setShowFilters={setShowFilters} />
          </div>
        )}

        <LinkButton
          to={isFutarchyPage ? "/futarchy/create-proposal" : "/create-market"}
          text={isFutarchyPage ? "Create New Proposal" : "Create New Market"}
          icon={
            <span className="w-[18px] h-[18px] rounded-full bg-white/20 inline-flex items-center justify-center text-[14px] font-semibold leading-none">
              +
            </span>
          }
          className="btn-cta !rounded-full max-lg:w-full !min-w-0 !h-[44px] !min-h-[44px] !text-[14px] !px-[20px] gap-2 whitespace-nowrap"
        />
      </div>
      <div className="flex mt-5 items-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[{ value: "all", text: "All" }, ...MARKET_CATEGORIES].map((category) => {
            if (category.value === "all") {
              return (
                <button
                  className={clsx("cat", !categoryList && "active")}
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
                className={clsx("cat", categoryList?.includes(category.value) && "active")}
                key={category.value}
                onClick={() => setCategories([category.value])}
                type="button"
              >
                {category.text}
              </button>
            );
          })}
        </div>
        <Link to={"/collections/default"} className="collections-link ml-auto">
          <span className="ico" />
          My collections
        </Link>
      </div>
    </div>
  );
}
