import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ChainFilterChips } from "@/components/ChainFilterChips";
import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import AirdropTab, { AirdropHero } from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import PortfolioOverview, { type ReviewRange } from "@/components/Portfolio/PortfolioOverview";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import { ProfileIdentity } from "@/components/ProfileIdentity";
import { usePortfolioIdentity } from "@/hooks/portfolio/usePortfolioIdentity";
import { usePrefetchPortfolioTabs } from "@/hooks/portfolio/usePrefetchPortfolioTabs";
import { usePublicUser } from "@/hooks/usePublicUser";
import { useSearchParams } from "@/hooks/useSearchParams";
import { parsePortfolioChainParam } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { queryClient } from "@/lib/query-client";
import { isTwoStringsEqual, shortenAddress } from "@/lib/utils";
import { usePortfolioPnL, usePortfolioValue } from "@seer-pm/react";
import type { PortfolioChainId, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { Address, getAddress, isAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import { useAccount } from "wagmi";

const TABS = [
  { id: "positions", label: "Positions", panelId: "portfolio-panel-positions" },
  { id: "history", label: "History", panelId: "portfolio-panel-history" },
  { id: "airdrop", label: "Airdrop", panelId: "portfolio-panel-airdrop" },
] as const;

type PortfolioTab = (typeof TABS)[number]["id"];

function parsePortfolioTab(raw: string | null): PortfolioTab {
  if (raw === "history" || raw === "airdrop" || raw === "positions") return raw;
  return "positions";
}

function parsePnLPeriod(raw: string | null): PortfolioPnLPeriod {
  if (raw === "1d" || raw === "1w" || raw === "1m" || raw === "all") return raw;
  return "all";
}

function LivePortfolioOverview({
  account,
  chainId,
  period,
  onPeriodChange,
}: {
  account: Address;
  chainId: PortfolioChainId;
  period: PortfolioPnLPeriod;
  onPeriodChange: (period: PortfolioPnLPeriod) => void;
}) {
  const value = usePortfolioValue(account, chainId);
  const pnl = usePortfolioPnL(account, chainId, period);
  const periods: Record<PortfolioPnLPeriod, ReviewRange> = { "1d": "1D", "1w": "1W", "1m": "1M", all: "All" };
  return (
    <PortfolioOverview
      value={value.data?.currentPortfolioValue}
      delta={value.data?.delta}
      deltaPercent={value.data?.deltaPercent}
      pnl={pnl.data?.computed === false ? undefined : pnl.data?.pnl}
      period={periods[period]}
      onPeriodChange={(range) => onPeriodChange(range.toLowerCase() as PortfolioPnLPeriod)}
      supported={["1D", "1W", "1M", "All"]}
      pending={value.isLoading || pnl.isLoading}
      error={value.error || pnl.error ? "Couldn't load portfolio performance." : undefined}
      retry={() => {
        value.refetch();
        pnl.refetch();
      }}
    />
  );
}

/**
 * The TradeExecutor contracts this profile trades through.
 *
 * Rendered only when there are any — which is a handful of users — so the header keeps its current
 * height for everyone else. Without it the merged Positions and History tables would show holdings
 * under an address the page never names.
 */
function LinkedExecutors({ account }: { account: Address }) {
  const { data } = usePortfolioIdentity(account);
  const executors = data?.executors ?? [];
  if (executors.length === 0) return null;

  return (
    <p className="text-sm text-black-primary mt-1">
      Trading via {executors.length} Trade Executor{executors.length > 1 ? "s" : ""}:{" "}
      {executors.map((executor, index) => (
        <span key={executor}>
          {index > 0 ? ", " : ""}
          <span className="font-mono">{shortenAddress(executor)}</span>
        </span>
      ))}
    </p>
  );
}

function PortfolioPage() {
  const { address: connectedAccount } = useAccount();
  const { routeParams } = usePageContext();
  const routeIdentity = routeParams?.id ? String(routeParams.id) : "";
  const requestedIdentity = routeIdentity || connectedAccount || "";
  const isUsernameRoute = requestedIdentity.startsWith("@");
  const requestedUsername = isUsernameRoute ? requestedIdentity.slice(1).toLowerCase() : "";
  const addressIsValid = !isUsernameRoute && isAddress(requestedIdentity);
  const requestedAddress = addressIsValid ? getAddress(requestedIdentity) : undefined;
  const userLookup = isUsernameRoute
    ? { username: requestedUsername }
    : requestedAddress
      ? { address: requestedAddress }
      : null;
  const { data: publicUser, isLoading, error: userError } = usePublicUser(userLookup);
  const account = isUsernameRoute ? (publicUser ? getAddress(publicUser.address) : undefined) : requestedAddress;
  const username = publicUser?.username ?? null;
  const error = isUsernameRoute
    ? userError instanceof Error
      ? userError.message
      : !isLoading && !publicUser
        ? "User not found"
        : undefined
    : requestedIdentity && !addressIsValid
      ? "This portfolio address is invalid."
      : undefined;
  const isSelf = isTwoStringsEqual(connectedAccount, account);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // `/portfolio/@name` is the one URL a person with a username should ever see or share, but the
  // address route stays the fallback for every wallet without one, so links, the header and pasted
  // URLs still arrive here by address. Replace the address (or bare `/portfolio`) with the vanity
  // route once the lookup says there is one. The redirect never fires for `@` routes or unknown
  // wallets, so it cannot loop.
  useEffect(() => {
    if (isUsernameRoute || !publicUser?.username) return;
    // The `@` route re-runs the lookup under its own key; seed it so the header does not shimmer.
    queryClient.setQueryData(["publicUser", "username", publicUser.username], publicUser);
    navigate(`${paths.portfolioUsername(publicUser.username)}${window.location.search}`, {
      overwriteLastHistoryEntry: true,
      keepScrollPosition: true,
    });
  }, [isUsernameRoute, publicUser]);

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = parsePortfolioTab(searchParams.get("tab"));
  const chainId = parsePortfolioChainParam(searchParams.get("chain"));
  const plPeriod = parsePnLPeriod(searchParams.get("pl"));
  usePrefetchPortfolioTabs(account, chainId);
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  const setTab = (tab: PortfolioTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const setChainId = (nextChain: number | "all") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chain", String(nextChain));
      return next;
    });
  };

  const setPlPeriod = (period: PortfolioPnLPeriod) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pl", period);
      return next;
    });
  };

  const selectTab = (index: number, focus = false) => {
    const nextIndex = (index + TABS.length) % TABS.length;
    setTab(TABS[nextIndex].id);
    if (focus) {
      requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
    }
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    if (index < 0) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(index - 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(TABS.length - 1, true);
    }
  };

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
        <Alert type={error ? "warning" : "info"} title={error ? "Account not found" : "Your portfolio starts here"}>
          <p>{error || "Connect your wallet to see positions, trading performance and SEER rewards."}</p>
          {!error && (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <ConnectWallet size="large" />
              <Link to="/leaderboard" className="text-purple-primary text-sm">
                Explore public portfolios ↗
              </Link>
            </div>
          )}
          {/* A mistyped or renamed @username otherwise dead-ends here; the leaderboard is the one
              place that searches usernames and addresses by substring. */}
          {isUsernameRoute ? (
            <p className="mt-2">
              <Link to="/leaderboard" className="text-purple-primary hover:underline">
                Search traders by username or address
              </Link>
            </p>
          ) : null}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid portfolio-page">
      <div className="portfolio-page-heading">
        <div>
          <h1>{isSelf ? "Your portfolio" : "Portfolio"}</h1>
          <p>A clearer view of every position.</p>
        </div>
        <details className="portfolio-account-details">
          <summary>Account · {shortenAddress(account)}</summary>
          <ProfileIdentity
            address={account}
            username={username}
            xAccount={publicUser?.xAccount}
            isSelf={isSelf}
            isLoading={isLoading}
            nameAs="h2"
          />
          <LinkedExecutors account={account} />
          {isSelf && !username && <Link to={paths.profile()}>Set a username</Link>}
        </details>
      </div>
      <div className="space-y-4">
        {activeTab !== "airdrop" ? <ChainFilterChips value={chainId} onChange={setChainId} /> : null}
        {activeTab === "airdrop" ? (
          <div className="portfolio-source">
            <p>Total SEER allocation</p>
            <AirdropHero account={account} />
          </div>
        ) : (
          <LivePortfolioOverview account={account} chainId={chainId} period={plPeriod} onPeriodChange={setPlPeriod} />
        )}
      </div>

      <div>
        <div
          role="tablist"
          aria-label="Portfolio sections"
          className="portfolio-view-tabs"
          onKeyDown={onTabListKeyDown}
        >
          {TABS.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`portfolio-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={tab.panelId}
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className={`tab min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary ${selected ? "tab-active" : ""}`}
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={activeTabMeta.panelId} aria-labelledby={`portfolio-tab-${activeTab}`}>
          <h2 className="sr-only">{activeTabMeta.label}</h2>
          {activeTab === "positions" && <PositionsTab account={account} chainId={chainId} />}
          {activeTab === "history" && <HistoryTab account={account} chainId={chainId} />}
          {activeTab === "airdrop" && <AirdropTab account={account} />}
        </div>
      </div>
    </div>
  );
}

export default PortfolioPage;
