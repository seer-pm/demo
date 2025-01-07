import { useSearchParams } from "@/hooks/useSearchParams";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { VerificationStatus } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

function useMarketsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const marketName = searchParams.get("marketName") ?? undefined;
  const marketStatusList =
    searchParams.getAll("marketStatus").length === 0
      ? undefined
      : (searchParams.getAll("marketStatus") as MarketStatus[]);
  const verificationStatusList =
    searchParams.getAll("verificationStatus").length === 0
      ? undefined
      : (searchParams.getAll("verificationStatus") as VerificationStatus[]);
  const chainsList = searchParams.getAll("chains").length === 0 ? undefined : searchParams.getAll("chains");
  const categoryList = searchParams.getAll("category").length === 0 ? undefined : searchParams.getAll("category");
  const orderBy = searchParams.get("orderBy") as Market_OrderBy;
  const page = Number(searchParams.get("page") ?? 1);
  const isShowMyMarkets = searchParams.get("myMarkets") === "true";

  const setMarketName = (value: string) => {
    setSearchParams((params) => {
      if (!value) {
        params.delete("marketName");
      } else {
        params.set("marketName", value);
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setMarketStatus = (statusList: MarketStatus[] | undefined) => {
    setSearchParams((params) => {
      params.delete("marketStatus");
      if (statusList) {
        statusList.map((x) => params.append("marketStatus", x));
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setVerificationStatus = (statusList: VerificationStatus[] | undefined) => {
    setSearchParams((params) => {
      params.delete("verificationStatus");
      if (statusList) {
        statusList.map((x) => params.append("verificationStatus", x));
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setChains = (chainsList: string[] | undefined) => {
    setSearchParams((params) => {
      params.delete("chains");
      if (chainsList) {
        chainsList.map((x) => params.append("chains", x));
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setCategories = (categories: string[] | undefined) => {
    setSearchParams((params) => {
      params.delete("category");
      if (categories) {
        categories.map((x) => params.append("category", x));
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setOrderBy = (orderBy: Market_OrderBy | "default") => {
    setSearchParams((params) => {
      if (orderBy === "default") {
        params.delete("orderBy");
      } else {
        params.set("orderBy", orderBy);
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setPage = (page: number) => {
    setSearchParams((params) => {
      params.set("page", page.toString());
      return params;
    });
  };

  const toggleShowMyMarkets = (showMyMarkets: boolean) => {
    setSearchParams((params) => {
      if (showMyMarkets) {
        params.set("myMarkets", "true");
      } else {
        params.delete("myMarkets");
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  return {
    marketName,
    marketStatusList,
    verificationStatusList,
    chainsList,
    categoryList,
    orderBy,
    page,

    setMarketName,
    setMarketStatus,
    setVerificationStatus,
    setChains,
    setOrderBy,
    setCategories,
    setPage,

    isShowMyMarkets,
    toggleShowMyMarkets,
    hasFilters: verificationStatusList?.length || marketStatusList?.length || chainsList?.length || orderBy,
  };
}

export default useMarketsSearchParams;
