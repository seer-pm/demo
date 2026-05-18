import { Alert } from "@/components/Alert";
import { Link } from "@/components/Link";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { ExternalLinkIcon } from "@/lib/icons";
import { displayBalance, displayNumber, isTwoStringsEqual, shortenAddress } from "@/lib/utils";
import { getActivePrimaryCollateral } from "@seer-pm/sdk";
import { Market } from "@seer-pm/sdk";
import type { TransactionData } from "@seer-pm/sdk";
import { format } from "date-fns";
import { useState } from "react";
import { Address, parseUnits } from "viem";
import { useAccount } from "wagmi";

interface ActivityProps {
  market: Market;
}

function activityTypeClass(type: TransactionData["type"]): string {
  if (type === "bought") return "text-success-primary";
  if (type === "sold") return "text-error-primary";
  return "text-base-content/90";
}

function activityTypeLabel(type: TransactionData["type"]): string {
  switch (type) {
    case "split":
      return "Split";
    case "merge":
      return "Merge";
    case "redeem":
      return "Redeem";
    case "bought":
      return "Bought";
    case "sold":
      return "Sold";
    default:
      return type;
  }
}

function formatActivityAmount(row: TransactionData): string {
  const s = row.amount ?? row.payout;
  if (!s) return "0";
  try {
    return displayBalance(parseUnits(s as `${string}`, 18), 18, true);
  } catch {
    return displayNumber(Number(s), 2, true);
  }
}

export default function Activity({ market }: ActivityProps) {
  const { address } = useAccount();
  const [showMyActivity, setShowMyActivity] = useState(false);
  const isFilteringMyActivity = Boolean(address && showMyActivity);
  const accountFilter = isFilteringMyActivity ? address : undefined;
  const { data, isLoading, error } = useMarketHolders(market, accountFilter);

  if (isLoading) {
    return <div className="shimmer-container w-full h-[50px]"></div>;
  }

  if (error) {
    return <Alert type="warning">Error loading activity: {error.message}</Alert>;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

  const rows = (data?.recentActivity ?? []).filter((row) => {
    if (!isFilteringMyActivity) return true;
    if (!address || !row.trader) return false;
    return isTwoStringsEqual(row.trader as string, address);
  });

  return (
    <div className="p-4 card shadow-sm border-separator-100">
      {address && (
        <div className="flex justify-end mb-4">
          <label className="cursor-pointer flex items-center gap-2 text-sm font-medium" htmlFor="show-my-activity">
            <input
              className="cursor-pointer checkbox"
              id="show-my-activity"
              type="checkbox"
              checked={showMyActivity}
              onChange={(event) => setShowMyActivity(event.target.checked)}
            />
            My activity
          </label>
        </div>
      )}
      {!data || rows.length === 0 ? (
        <Alert type="warning">
          {isFilteringMyActivity ? "No recent activity for your account" : "No recent activity"}
        </Alert>
      ) : (
        <div className="w-full overflow-x-auto mb-6">
          <table className="simple-table table-fixed">
            <colgroup>
              <col style={{ width: "70%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <tbody>
              {rows.map((row) => {
                const tokenIndex = row.outcomeToken
                  ? market.wrappedTokens.findIndex((w) => isTwoStringsEqual(w, row.outcomeToken as Address))
                  : -1;

                const occurredAt = format(new Date(row.timestamp * 1000), "MMM d, yyyy · HH:mm");

                const trader = row.trader;
                const txHash = row.transactionHash ?? "";

                return (
                  <tr key={row.transferId ?? `${txHash}-${row.timestamp}-${row.type}-${row.outcomeToken ?? ""}`}>
                    <td className="text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        {trader ? (
                          <span className="text-sm font-medium text-base-content/90 flex items-center space-x-2">
                            <Link to={`/portfolio/${trader}`} className="hover:text-purple-primary">
                              {shortenAddress(trader)}
                            </Link>

                            <a
                              href={blockExplorerUrl && `${blockExplorerUrl}/address/${trader}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLinkIcon />
                            </a>
                          </span>
                        ) : (
                          <span className="text-sm text-base-content/60">—</span>
                        )}
                        <span className={`text-sm font-medium ${activityTypeClass(row.type)}`}>
                          {activityTypeLabel(row.type)}
                        </span>
                        <span className="text-sm font-medium text-base-content/90">{formatActivityAmount(row)}</span>
                        <span className="text-sm text-base-content">
                          {tokenIndex >= 0
                            ? market.outcomes[tokenIndex]
                            : (getActivePrimaryCollateral(market.chainId).symbol ?? "—")}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="text-xs lg:text-sm text-gray-500">
                        <a
                          href={blockExplorerUrl && `${blockExplorerUrl}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={new Date(row.timestamp * 1000).toISOString()}
                        >
                          {occurredAt}
                        </a>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
