import { Market } from "@/hooks/useMarket";
import useMarketsSearchParams from "./useMarketsSearchParams";

const itemsPerPage = 10;

function useMarketsPagination(markets: Market[]) {
  const { page, setPage } = useMarketsSearchParams();
  const itemOffset = (page - 1) * itemsPerPage;
  const endOffset = itemOffset + itemsPerPage;

  const currentMarkets = markets.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(markets.length / itemsPerPage);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
  };

  return { currentMarkets, pageCount, handlePageClick, page: Number(page ?? "") };
}

export default useMarketsPagination;
