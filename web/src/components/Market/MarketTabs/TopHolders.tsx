import { Alert } from "@/components/Alert";
import { Link } from "@/components/Link";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { ExternalLinkIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { displayBalance, isTwoStringsEqual, shortenAddress } from "@/lib/utils";

interface TopHoldersProps {
  market: Market;
}

export default function TopHolders({ market }: TopHoldersProps) {
  const { data, isLoading, error } = useMarketHolders(market.wrappedTokens, market.chainId);

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
    <div className="p-4 bg-white border rounded-[3px] shadow-sm border-black-medium">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {Object.entries(data.topHolders).map(([tokenId, holders]) => {
          const tokenIndex = market.wrappedTokens.findIndex((wrappedToken) => isTwoStringsEqual(wrappedToken, tokenId));
          return (
            <div key={tokenId}>
              {holders.length === 0 ? (
                <p className="text-gray-500 text-sm">No holders</p>
              ) : (
                <div className="w-full overflow-x-auto mb-6">
                  <table className="simple-table table-fixed">
                    <thead>
                      <tr>
                        <th className="text-left">
                          <a
                            href={blockExplorerUrl && `${blockExplorerUrl}/address/${market.wrappedTokens[tokenIndex]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {market.outcomes[tokenIndex]}
                          </a>
                        </th>
                        <th className="!text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.slice(0, 5).map((holder) => (
                        <tr key={holder.address}>
                          <td className="text-left">
                            <span className="text-sm text-gray-900 flex space-x-2 items-center">
                              <Link to={`/portfolio/${holder.address}`} className="hover:text-purple-primary">
                                {shortenAddress(holder.address)}
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
                            <span className="text-sm font-medium text-gray-900">
                              {displayBalance(BigInt(holder.balance), 18, true)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
