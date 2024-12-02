import { ITEMS_PER_PAGE } from "@/lib/markets-search";
import { UseQueryResult } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { useGlobalState } from "./useGlobalState";
import { Market, VerificationStatus } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useMarketsSearchParams from "./useMarketsSearchParams";

export interface UseMarketsProps {
  marketName?: string;
  marketStatusList?: MarketStatus[];
  verificationStatusList?: VerificationStatus[];
  chainsList?: Array<string | "all">;
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  isShowMyMarkets?: boolean;
}

export const useSortAndFilterResults = (
  params: UseMarketsProps,
  result: UseQueryResult<Market[] | undefined, Error>,
) => {
  const { address = "" } = useAccount();
  const favorites = useGlobalState((state) => state.favorites);
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

  // favorite markets on top, we use reduce to keep the current sort order
  const [favoriteMarkets, nonFavoriteMarkets] = data.reduce(
    (total, market) => {
      if (favorites[address]?.find((x) => x === market.id)) {
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
