import { Alert } from "@/components/Alert";
import { Link } from "@/components/Link";
import { useComputedPoolAddresses } from "@/hooks/useComputedPoolAddresses";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { ExternalLinkIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { TokenTransfer } from "@/lib/tokens";
import { displayBalance, isTwoStringsEqual, shortenAddress } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Address, zeroAddress } from "viem";

interface ActivityProps {
  market: Market;
}

function getTransactionType(transaction: TokenTransfer, pools: Address[]) {
  const { from, to } = transaction;

  if (from === zeroAddress || to === zeroAddress) {
    // split, merge or redeem
    return null;
  }

  // If from is any pool, it's a purchase
  const isFromRouter = pools.some((routerAddress) => isTwoStringsEqual(from, routerAddress));

  if (isFromRouter) {
    return { type: "bought", color: "text-success-primary" };
  }

  // Otherwise it's a sale
  return { type: "sold", color: "text-error-primary" };
}

export default function Activity({ market }: ActivityProps) {
  const { data, isLoading, error } = useMarketHolders(market.wrappedTokens, market.chainId);
  const { data: poolAddresses = [] } = useComputedPoolAddresses(market);

  if (isLoading) {
    return <div className="shimmer-container w-full h-[50px]"></div>;
  }

  if (error) {
    return <Alert type="warning">Error loading activity: {error.message}</Alert>;
  }

  if (!data || !data.recentTransactions || data.recentTransactions.length === 0) {
    return <Alert type="warning">No recent activity</Alert>;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

  return (
    <div className="p-4 bg-white border rounded-[3px] shadow-sm border-black-medium">
      <div className="w-full overflow-x-auto mb-6">
        <table className="simple-table table-fixed">
          <colgroup>
            <col style={{ width: "70%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <tbody>
            {data.recentTransactions
              .map((transaction) => {
                const tokenIndex = market.wrappedTokens.findIndex((wrappedToken) =>
                  isTwoStringsEqual(wrappedToken, transaction.token),
                );

                const timeAgo = formatDistanceToNow(new Date(transaction.timestamp * 1000), {
                  addSuffix: true,
                });

                const transactionType = getTransactionType(transaction, poolAddresses);

                // Skip mint/burn transactions
                if (!transactionType) {
                  return null;
                }

                return {
                  transaction,
                  tokenIndex,
                  timeAgo,
                  transactionType,
                };
              })
              .filter((item): item is NonNullable<typeof item> => item !== null)
              .map(({ transaction, tokenIndex, timeAgo, transactionType }) => (
                <tr key={transaction.id}>
                  <td className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                        <Link to={`/portfolio/${transaction.from}`} className="hover:text-purple-primary">
                          {shortenAddress(transaction.from)}
                        </Link>

                        <a
                          href={blockExplorerUrl && `${blockExplorerUrl}/address/${transaction.from}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon />
                        </a>
                      </span>
                      <span className={`text-sm font-medium ${transactionType.color}`}>{transactionType.type}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {displayBalance(BigInt(transaction.value), 18, true)}
                      </span>
                      <span className="text-sm text-gray-600">{market.outcomes[tokenIndex]}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="text-xs lg:text-sm text-gray-500">
                      <a
                        href={blockExplorerUrl && `${blockExplorerUrl}/tx/${transaction.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {timeAgo}
                      </a>
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
