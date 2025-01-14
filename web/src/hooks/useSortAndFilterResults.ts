import { ITEMS_PER_PAGE } from "@/lib/markets-search";
import { UseQueryResult } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { useFavorites } from "./useFavorites";
import { Market } from "./useMarket";
import { UseMarketsProps } from "./useMarkets";
import useMarketsSearchParams from "./useMarketsSearchParams";

export const useSortAndFilterResults = (
  params: UseMarketsProps,
  result: UseQueryResult<Market[] | undefined, Error>,
) => {
  const { address = "" } = useAccount();
  const { data: favorites = [] } = useFavorites();
  const { page, setPage } = useMarketsSearchParams();

  let data = result.data || [];

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

  // filter by category
  if (params.categoryList) {
    data = data.filter((market: Market) => {
      return params.categoryList?.some((category) => market.categories?.includes(category));
    });
  }

  // favorite markets on top, we use reduce to keep the current sort order
  const [favoriteMarkets, nonFavoriteMarkets] = data.reduce(
    (total, market) => {
      if (favorites.includes(market.id)) {
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
