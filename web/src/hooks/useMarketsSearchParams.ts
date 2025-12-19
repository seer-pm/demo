import { useSearchParams } from "@/hooks/useSearchParams";
import { VerificationStatus } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { UseGraphMarketsParams } from "./useMarkets";

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
  const showMyMarkets = searchParams.get("myMarkets") === "true";
  const showConditionalMarkets = searchParams.get("conditionalMarkets") === "true";
  const showMarketsWithRewards = searchParams.get("rewardsMarkets") === "true";
  const showFutarchyMarkets = searchParams.get("type") === "Futarchy";
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

  const toggleShowFutarchyMarkets = (showFutarchyMarkets: boolean) => {
    setSearchParams((params) => {
      if (showFutarchyMarkets) {
        params.set("type", "Futarchy");
      } else {
        params.delete("type");
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
    limit: 24,
    showMyMarkets,
    showConditionalMarkets,
    showMarketsWithRewards,
    showFutarchyMarkets,
    type: (showFutarchyMarkets ? "Futarchy" : "Generic") as UseGraphMarketsParams["type"],
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
    toggleShowFutarchyMarkets,
    setOrderDirection,
    setMinLiquidity,

    hasFilters:
      verificationStatusList?.length ||
      marketStatusList?.length ||
      chainsList?.length ||
      orderBy ||
      showConditionalMarkets ||
      showMarketsWithRewards ||
      showFutarchyMarkets ||
      minLiquidity > 0,
  };
}

export default useMarketsSearchParams;
