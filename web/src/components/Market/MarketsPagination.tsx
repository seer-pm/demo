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
      nextLabel={<span className="text-[13px] leading-none">→</span>}
      onPageChange={handlePageClick}
      forcePage={page - 1}
      pageCount={pageCount}
      previousLabel={<span className="text-[13px] leading-none">←</span>}
      renderOnZeroPageCount={null}
      marginPagesDisplayed={3}
      pageRangeDisplayed={5}
      className="paginator flex gap-1 items-center justify-center font-mono text-[13px] font-medium tabular-nums"
      activeClassName="paginator-active pointer-events-none"
      pageClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-3 hover:border-[var(--border)] hover:text-ink hover:bg-surface transition-colors"
      nextClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-4 hover:border-[var(--border)] hover:text-ink hover:bg-surface transition-colors"
      previousClassName="min-w-[36px] h-[36px] border border-transparent flex items-center justify-center rounded-[8px] text-ink-4 hover:border-[var(--border)] hover:text-ink hover:bg-surface transition-colors"
      disabledLinkClassName="text-ink-5"
      pageLinkClassName="w-full h-full flex items-center justify-center"
      previousLinkClassName="w-full h-full flex items-center justify-center"
      nextLinkClassName="w-full h-full flex items-center justify-center"
      breakLinkClassName="w-full h-full flex items-center justify-center"
    />
  );
}

export default MarketsPagination;
