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
  const orderBy = (searchParams.get("orderBy") || undefined) as Market_OrderBy;
  const page = Number(searchParams.get("page") ?? 1);
  const isShowMyMarkets = searchParams.get("myMarkets") === "true";
  const isShowConditionalMarkets = searchParams.get("conditionalMarkets") === "true";
  const isShowMarketsWithRewards = searchParams.get("rewardsMarkets") === "true";
  const orderDirection = (searchParams.get("orderDirection") || undefined) as "asc" | "desc";
  const minLiquidity = searchParams.get("minLiquidity") ? Number(searchParams.get("minLiquidity")) : 0;

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
        params.delete("orderDirection");
      } else {
        params.set("orderBy", orderBy);
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setOrderDirection = (orderDirection: "asc" | "desc") => {
    setSearchParams((params) => {
      params.set("orderDirection", orderDirection);
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

  const toggleShowConditionalMarkets = (showConditionalMarkets: boolean) => {
    setSearchParams((params) => {
      if (showConditionalMarkets) {
        params.set("conditionalMarkets", "true");
      } else {
        params.delete("conditionalMarkets");
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const toggleShowMarketsWithRewards = (showMarketsWithRewards: boolean) => {
    setSearchParams((params) => {
      if (showMarketsWithRewards) {
        params.set("rewardsMarkets", "true");
      } else {
        params.delete("rewardsMarkets");
      }
      if (page > 1) {
        params.set("page", "1");
      }
      return params;
    });
  };

  const setMinLiquidity = (value: number) => {
    setSearchParams((params) => {
      if (!value) {
        params.delete("minLiquidity");
      } else {
        params.set("minLiquidity", value.toString());
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
    isShowMyMarkets,
    isShowConditionalMarkets,
    isShowMarketsWithRewards,
    orderDirection,
    minLiquidity,

    setMarketName,
    setMarketStatus,
    setVerificationStatus,
    setChains,
    setOrderBy,
    setCategories,
    setPage,
    toggleShowMyMarkets,
    toggleShowConditionalMarkets,
    toggleShowMarketsWithRewards,
    setOrderDirection,
    setMinLiquidity,

    hasFilters:
      verificationStatusList?.length ||
      marketStatusList?.length ||
      chainsList?.length ||
      orderBy ||
      isShowConditionalMarkets ||
      isShowMarketsWithRewards ||
      minLiquidity > 0,
  };
}

export default useMarketsSearchParams;
