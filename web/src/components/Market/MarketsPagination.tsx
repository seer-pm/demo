import { ChevronLeft, ChevronRight } from "@/lib/icons";
import ReactPaginate from "react-paginate";

function MarketsPagination({
  pageCount,
  handlePageClick,
  page,
}: {
  pageCount: number;
  handlePageClick: ({ selected }: { selected: number }) => void;
  page: number;
}) {
  return (
    <ReactPaginate
      breakLabel="..."
      nextLabel={<ChevronRight fill="currentColor" />}
      onPageChange={handlePageClick}
      forcePage={page - 1}
      pageCount={pageCount}
      previousLabel={<ChevronLeft fill="currentColor" />}
      renderOnZeroPageCount={null}
      className="flex gap-2 items-center justify-center"
      activeClassName="!border-purple-primary text-purple-primary"
      pageClassName="w-[32px] h-[32px] border border-solid border-black-medium flex items-center justify-center rounded-[3px]"
      nextClassName="w-[32px] h-[32px] border border-solid border-black-medium flex items-center justify-center rounded-[3px]"
      previousClassName="w-[32px] h-[32px] border border-solid border-black-medium flex items-center justify-center rounded-[3px]"
      disabledLinkClassName="text-black-medium"
    />
  );
}

export default MarketsPagination;
