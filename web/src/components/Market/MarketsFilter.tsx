import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { Filter, PlusIcon, SearchIcon } from "@/lib/icons";
import clsx from "clsx";
import { useState } from "react";
import { useAccount } from "wagmi";
import { LinkButton } from "../Form/Button";
import Input from "../Form/Input";
import { MarketsFilterBox } from "./MarketsFilterBox";

export function MarketsFilter() {
  const { address } = useAccount();
  const { setMarketName, isShowMyMarkets, toggleShowMyMarkets, hasFilters } = useMarketsSearchParams();
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setMarketName((event.target as HTMLInputElement).value);
  };
  const [isShowFilters, setShowFilters] = useState(false);
  return (
    <div>
      <div className="flex flex-col lg:flex-row max-lg:space-y-[12px] lg:space-x-[24px] relative">
        <div className="grow">
          <Input placeholder="Search" className="w-full" icon={<SearchIcon />} onKeyUp={marketNameCallback} />
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
          <LinkButton to={"/create-market"} text="Create New Market" icon={<PlusIcon />} className="max-lg:w-full" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        {address && (
          <div className="flex items-center m-1 gap-2">
            <label className="text-purple-primary text-[14px] cursor-pointer" htmlFor="show-my-market">
              Show only my markets
            </label>
            <input
              className="cursor-pointer checkbox"
              id="show-my-market"
              type="checkbox"
              checked={!!isShowMyMarkets}
              onChange={(e) => toggleShowMyMarkets(e.target.checked)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
