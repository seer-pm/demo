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
      className="flex gap-1 items-center justify-center font-mono text-[13px] tabular-nums"
      activeClassName="!bg-blue !border-blue [&_a]:!text-white"
      pageClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-3 hover:border-[var(--border)] hover:text-ink transition-colors"
      nextClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-3 hover:border-[var(--border)] hover:text-ink transition-colors"
      previousClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-3 hover:border-[var(--border)] hover:text-ink transition-colors"
      disabledLinkClassName="text-ink-5"
      pageLinkClassName="w-full h-full flex items-center justify-center"
      previousLinkClassName="w-full h-full flex items-center justify-center"
      nextLinkClassName="w-full h-full flex items-center justify-center"
      breakLinkClassName="w-full h-full flex items-center justify-center"
    />
  );
}

export default MarketsPagination;
