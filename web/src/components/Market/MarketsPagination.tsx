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
      activeClassName="!border-[#9747FF] text-[#9747FF]"
      pageClassName="w-[32px] h-[32px] border border-solid border-[#E5E5E5] flex items-center justify-center rounded-[3px]"
      nextClassName="w-[32px] h-[32px] border border-solid border-[#E5E5E5] flex items-center justify-center rounded-[3px]"
      previousClassName="w-[32px] h-[32px] border border-solid border-[#E5E5E5] flex items-center justify-center rounded-[3px]"
      disabledLinkClassName="text-[#E5E5E5]"
    />
  );
}

export default MarketsPagination;
