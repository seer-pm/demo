import { Alert } from "@/components/Alert";
import { DisplayName } from "@/components/DisplayName";
import { Link } from "@/components/Link";
import MarketsPagination from "@/components/Market/MarketsPagination";
import { TokenTransactionsResponse, useMarketHolders } from "@/hooks/useMarketHolders";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { ExternalLinkIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import { useComputedPoolAddresses } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { useMemo, useState } from "react";

/** Display cap per outcome; full holder lists come from the API. */
const TOP_HOLDERS_COUNT = 10;
/** Up to this many outcomes fit on one page, so the search box and pagination stay hidden. */
const MAX_OUTCOMES_WITHOUT_PAGINATION = 10;
/** Three rows of the two-column grid. */
const OUTCOMES_PER_PAGE = 6;

interface TopHoldersProps {
  market: Market;
}

function filterTopHolders(
  topHolders: TokenTransactionsResponse["topHolders"],
  poolAddresses: string[],
): TokenTransactionsResponse["topHolders"] {
  if (!topHolders) return {};
  if (!poolAddresses || poolAddresses.length === 0) return topHolders;

  const poolSet = new Set(poolAddresses.map((a) => a.toLowerCase()));
  const filtered: TokenTransactionsResponse["topHolders"] = {};

  for (const [tokenId, holders] of Object.entries(topHolders)) {
    filtered[tokenId] = holders.filter((holder) => !poolSet.has(holder.address.toLowerCase()));
  }

  return filtered;
}

export default function TopHolders({ market }: TopHoldersProps) {
  const { data, isLoading, error } = useMarketHolders(market);
  const { data: poolAddresses = [] } = useComputedPoolAddresses(market);
  const topHolders = useMemo(() => filterTopHolders(data?.topHolders ?? {}, poolAddresses), [data, poolAddresses]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const paginated = market.wrappedTokens.length > MAX_OUTCOMES_WITHOUT_PAGINATION;
  const outcomeIndexes = useMemo(() => {
    const indexes = market.wrappedTokens.map((_, index) => index);
    const term = searchTerm.trim().toLowerCase();
    if (!paginated || !term) return indexes;
    return indexes.filter((index) => (market.outcomes[index] ?? "").toLowerCase().includes(term));
  }, [market, paginated, searchTerm]);
  const pageCount = Math.ceil(outcomeIndexes.length / OUTCOMES_PER_PAGE);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const visibleIndexes = paginated
    ? outcomeIndexes.slice((currentPage - 1) * OUTCOMES_PER_PAGE, currentPage * OUTCOMES_PER_PAGE)
    : outcomeIndexes;

  if (isLoading) {
    return <div className="shimmer-container w-full h-[50px]"></div>;
  }

  if (error) {
    return <Alert type="warning">Error loading holders: {error.message}</Alert>;
  }

  if (!data || !data.topHolders || Object.keys(data.topHolders).length === 0) {
    return <Alert type="warning">No holders data available.</Alert>;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

  return (
    <div className="p-4 card shadow-sm border-separator-100">
      {paginated && (
        <div className="flex items-center gap-3 mb-4">
          <label htmlFor="holders-outcome-search" className="text-sm font-medium text-base-content">
            Search by outcome:
          </label>
          <input
            id="holders-outcome-search"
            type="text"
            placeholder="Type outcome name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered bg-base-100 focus:outline-purple-primary flex-1 max-w-md"
          />
        </div>
      )}
      {outcomeIndexes.length === 0 && <Alert type="warning">No outcomes found for the search.</Alert>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {visibleIndexes.map((tokenIndex) => {
          const tokenId = market.wrappedTokens[tokenIndex];
          const holders = topHolders[tokenId.toLowerCase()] ?? [];
          return (
            <div key={tokenId}>
              <div className="w-full overflow-x-auto mb-6">
                <table className="simple-table table-fixed">
                  <thead>
                    <tr>
                      <th className="text-left" style={{ width: "70%" }}>
                        <a
                          href={blockExplorerUrl && `${blockExplorerUrl}/address/${tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {market.outcomes[tokenIndex]}
                        </a>
                      </th>
                      <th className="!text-right" style={{ width: "30%" }}>
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.length === 0 ? (
                      <tr>
                        <td colSpan={2}>
                          <p className="text-gray-500 text-sm">No holders</p>
                        </td>
                      </tr>
                    ) : (
                      holders.slice(0, TOP_HOLDERS_COUNT).map((holder) => (
                        <tr key={holder.address}>
                          <td className="text-left">
                            <span className="text-sm text-base-content/90 flex space-x-2 items-center">
                              <Link
                                to={paths.portfolio(holder.address, holder.username)}
                                className="hover:text-purple-primary"
                              >
                                <DisplayName address={holder.address} username={holder.username} />
                              </Link>

                              <a
                                href={blockExplorerUrl && `${blockExplorerUrl}/address/${holder.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLinkIcon />
                              </a>
                            </span>
                          </td>
                          <td className="text-right">
                            <span className="text-sm font-medium text-base-content/90">
                              {displayBalance(BigInt(holder.balance), 18, true)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      {pageCount > 1 && (
        <MarketsPagination
          pageCount={pageCount}
          page={currentPage}
          handlePageClick={({ selected }) => setPage(selected + 1)}
        />
      )}
    </div>
  );
}
