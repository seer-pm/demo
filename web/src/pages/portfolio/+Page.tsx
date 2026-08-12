import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { EnsBadge } from "@/components/EnsBadge";
import AirdropTab from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import { usePublicUser } from "@/hooks/usePublicUser";
import { useSearchParams } from "@/hooks/useSearchParams";
import { filterChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, Union } from "@/lib/icons";
import { shortenAddress } from "@/lib/utils";
import { CopyableAddress } from "@seer-pm/discussions";
import { usePortfolioPnL, usePortfolioValue } from "@seer-pm/react";
import { getActiveCollateralProfile } from "@seer-pm/sdk";
import { type PortfolioPnLPeriod, type SupportedChain } from "@seer-pm/sdk";
import { useState } from "react";
import { type Address, isAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount, useEnsName } from "wagmi";

function PortfolioValueVariation({ account, chainId }: { account: Address; chainId: SupportedChain }) {
  const { data, isLoading, error } = usePortfolioValue(account, chainId);
  const currentPortfolioValue = data?.currentPortfolioValue ?? 0;
  const delta = data?.delta ?? 0;
  const deltaPercent = data?.deltaPercent ?? 0;

  if (error) {
    return (
      <div>
        <p className="text-[16px] text-black-secondary">Total</p>
        <p className="text-sm text-error">Unable to load portfolio value.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[16px] text-black-secondary">Total</p>
      {isLoading ? (
        <div className="mt-3 shimmer-container h-[28px] w-[300px]" />
      ) : (
        <p className="text-[32px] text-base-content font-semibold">
          {Number(currentPortfolioValue).toFixed(2)} {getActiveCollateralProfile(chainId).primary.symbol}
        </p>
      )}
      {isLoading ? (
        <div className="shimmer-container h-[20px] w-[300px]" />
      ) : delta >= 0 ? (
        <p className="text-[#00C42B] flex gap-2">
          <span>
            <ArrowDropUp fill="#00C42B" />
          </span>
          {delta.toFixed(2)} {getActiveCollateralProfile(chainId).primary.symbol} ({deltaPercent.toFixed(2)}%) today
        </p>
      ) : (
        <p className="text-[#c40000] flex gap-2">
          <span>
            <ArrowDropDown fill="#c40000" />
          </span>
          {delta.toFixed(2)} {getActiveCollateralProfile(chainId).primary.symbol} ({deltaPercent.toFixed(2)}%) today
        </p>
      )}
    </div>
  );
}

function PortfolioPnLHistory({ account, chainId }: { account: Address; chainId: SupportedChain }) {
  const [plPeriod, setPlPeriod] = useState<PortfolioPnLPeriod>("1d");
  const { data: plData, isLoading, error } = usePortfolioPnL(account, chainId, plPeriod);

  const pnl = plData?.pnl ?? 0;
  const isPnlPositive = pnl >= 0;
  const pnlTextColor = isPnlPositive ? "text-[#00C42B]" : "text-[#c40000]";

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-3">
        <p className="text-[16px] text-black-secondary">Profit/Loss</p>
        <div className="join">
          {(["1d", "1w", "1m", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-xs join-item ${plPeriod === p ? "btn-active" : "btn-ghost"}`}
              onClick={() => setPlPeriod(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="shimmer-container h-[28px] w-[160px]" />
      ) : error ? (
        <p className="text-sm text-error">Unable to load P/L.</p>
      ) : (
        <p className={`text-[32px] font-semibold ${pnlTextColor}`}>
          {isPnlPositive ? "+" : ""}
          {pnl.toFixed(2)} {getActiveCollateralProfile(chainId).primary.symbol}
        </p>
      )}
    </div>
  );
}

function PortfolioPage() {
  const { address: connectedAccount, chainId: rawChainId } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const chainId: SupportedChain = filterChain(rawChainId);
  const { routeParams } = usePageContext();
  const routeIdentity = routeParams?.id ? String(routeParams.id) : "";
  const requestedIdentity = routeIdentity || connectedAccount || "";
  const isUsernameRoute = requestedIdentity.startsWith("@");
  const requestedUsername = isUsernameRoute ? requestedIdentity.slice(1).toLowerCase() : "";
  const addressIsValid = !isUsernameRoute && isAddress(requestedIdentity);
  const requestedAddress = addressIsValid ? (requestedIdentity.toLowerCase() as Address) : undefined;
  const userLookup = isUsernameRoute
    ? { username: requestedUsername }
    : requestedAddress
      ? { address: requestedAddress }
      : null;
  const { data: publicUser, isLoading, error: userError } = usePublicUser(userLookup);
  const account = isUsernameRoute ? publicUser?.address : requestedAddress;
  const username = publicUser?.username;
  const error = isUsernameRoute
    ? userError instanceof Error
      ? userError.message
      : !isLoading && !publicUser
        ? "User not found"
        : undefined
    : requestedIdentity && !addressIsValid
      ? "This portfolio address is invalid."
      : undefined;
  const { data: ensName } = useEnsName({
    address: account,
    chainId: 1,
    query: { enabled: Boolean(account) },
  });

  const activeTab = searchParams.get("tab") || "positions";

  if (isUsernameRoute && isLoading) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px]">
        <Breadcrumb links={[{ title: "Portfolio" }]} />
        <div className="shimmer-container h-[162px] w-full" />
      </div>
    );
  }

  if (!account || error) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
        <Breadcrumb links={[{ title: "Portfolio" }]} />
        <Alert type="warning" title="Account not found">
          {error || "Connect your wallet to see your portfolio."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Portfolio" }]} />
      <div className="mt-8 bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] min-h-[162px] px-6 py-[28px] flex gap-4 items-start justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center">
            <Union />
          </div>
          <div className="min-w-0">
            <h1 className="break-all text-xl font-semibold">
              {username ? `@${username}` : <CopyableAddress address={account} shortAddress={shortenAddress(account)} />}
            </h1>
            {username && (
              <CopyableAddress
                address={account}
                shortAddress={shortenAddress(account)}
                className="mb-4 block text-xs text-base-content/60"
              />
            )}
            {ensName && <EnsBadge name={ensName} className="mb-4" />}
            <PortfolioValueVariation account={account} chainId={chainId} />
          </div>
        </div>

        <PortfolioPnLHistory account={account} chainId={chainId} />
      </div>

      <div>
        <div
          role="tablist"
          className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1 w-fit max-w-[600px] mb-6"
        >
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "positions" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "positions",
              })
            }
          >
            Positions
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "history" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "history",
              })
            }
          >
            History
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "airdrop" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "airdrop",
              })
            }
          >
            Airdrop
          </button>
        </div>
        {activeTab === "positions" && <PositionsTab account={account} chainId={chainId} />}
        {activeTab === "history" && <HistoryTab account={account} chainId={chainId} />}
        {activeTab === "airdrop" && <AirdropTab account={account} />}
      </div>
    </div>
  );
}

export default PortfolioPage;
