import { Market } from "@/lib/market";
import { isTextInString } from "@/lib/utils";
import { UseQueryResult } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useAllCollectionsMarkets } from "./collections/useAllCollectionsMarkets";
import { useCollectionsSearch } from "./collections/useCollectionsSearch";
import { UseMarketsProps } from "./useMarkets";
import useMarketsSearchParams from "./useMarketsSearchParams";

const ITEMS_PER_PAGE = 20;

export const useSortAndFilterResults = (
  params: UseMarketsProps,
  result: UseQueryResult<Market[] | undefined, Error>,
) => {
  const { address = "" } = useAccount();
  const { data: collectionsMarkets = [] } = useAllCollectionsMarkets();
  const { data: marketsInCollections = [] } = useCollectionsSearch(params.marketName);
  const { page, setPage } = useMarketsSearchParams();

  let data = result.data || [];

  // filter by market name or market outcomes or markets in collections which name contains search string
  if (params.marketName) {
    data = data.filter((market) => {
      const isMatchName = isTextInString(params.marketName!, market.marketName);
      const isMatchOutcomes = market.outcomes.some((outcome) => isTextInString(params.marketName!, outcome));
      const isInCollection = marketsInCollections.includes(market.id);
      return isMatchName || isMatchOutcomes || isInCollection;
    });
  }

  // filter by verification status
  if (params.verificationStatusList) {
    data = data.filter((market) => {
      return params.verificationStatusList?.some((status) => market.verification?.status === status);
    });
  }

  // filter my markets
  if (params.isShowMyMarkets) {
    data = data.filter((market: Market) => {
      return address && market.creator?.toLocaleLowerCase() === address.toLocaleLowerCase();
    });
  }

  // filter conditional markets
  if (params.isShowConditionalMarkets) {
    data = data.filter((market: Market) => {
      return market.parentMarket.id !== zeroAddress;
    });
  }

  // filter markets with rewards
  if (params.isShowMarketsWithRewards) {
    data = data.filter((market: Market) => {
      return market.incentive > 0;
    });
  }

  // filter by category
  if (params.categoryList) {
    data = data.filter((market: Market) => {
      return params.categoryList?.some((category) => market.categories?.includes(category));
    });
  }

  // filter by minimum liquidity
  if (params.minLiquidity) {
    data = data.filter((market: Market) => {
      return market.liquidityUSD > params.minLiquidity!;
    });
  }

  // favorite markets on top, we use reduce to keep the current sort order
  const [favoriteMarkets, nonFavoriteMarkets] = data.reduce(
    (total, market) => {
      const isFavorite = collectionsMarkets.map((x) => x.marketId).includes(market.id);
      if (isFavorite) {
        total[0].push(market);
      } else {
        total[1].push(market);
      }
      return total;
    },
    [[], []] as Market[][],
  );
  data = favoriteMarkets.concat(nonFavoriteMarkets);

  //pagination
  const itemOffset = (page - 1) * ITEMS_PER_PAGE;
  const endOffset = itemOffset + ITEMS_PER_PAGE;

  const currentMarkets = data.slice(itemOffset, endOffset) as Market[];
  const pageCount = Math.ceil(data.length / ITEMS_PER_PAGE);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
  };

  return {
    ...result,
    data: currentMarkets,
    pagination: { pageCount, handlePageClick, page: Number(page ?? "") },
  };
};
