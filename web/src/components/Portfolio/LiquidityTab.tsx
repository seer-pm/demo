import { Alert } from "@/components/Alert";
import Input from "@/components/Form/Input";
import { Link } from "@/components/Link";
import { LoadError, LoadingBlock, RefreshError } from "@/components/LoadStates";
import { type TokenDisplay, V4PositionRow } from "@/components/Market/AddLiquidity/V4PositionsList";
import {
  type UserV4LiquidityPosition,
  useUserV4LiquidityPositions,
} from "@/hooks/portfolio/useUserV4LiquidityPositions";
import { QUIET_BUTTON_CLASS } from "@/lib/buttonClasses";
import { SearchIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isTextInString } from "@/lib/utils";
import { OUTCOME_TOKEN_DECIMALS, chainSupportsOrderBook } from "@seer-pm/order-book/v4";
import { useTokensInfo } from "@seer-pm/react";
import { type SupportedChain, getActivePrimaryCollateral } from "@seer-pm/sdk";
import { useMemo, useState } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

const MARKETS_PATH = "/";

type PositionGroup = {
  key: string;
  marketName: string;
  marketHref: string;
  outcomeLabel: string;
  items: UserV4LiquidityPosition[];
};

function groupByMarketOutcome(positions: UserV4LiquidityPosition[]): PositionGroup[] {
  const groups = new Map<string, PositionGroup>();
  for (const item of positions) {
    const key = `${item.market.id}-${item.outcomeIndex}`;
    const group = groups.get(key) ?? {
      key,
      marketName: item.market.marketName,
      marketHref: paths.market(item.market),
      outcomeLabel: item.market.outcomes[item.outcomeIndex] ?? `Outcome ${item.outcomeIndex}`,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

function LiquidityTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const { address: connectedAddress } = useAccount();
  const [filter, setFilter] = useState("");

  const canManage =
    account !== undefined && connectedAddress !== undefined && isAddressEqual(account, connectedAddress);
  const orderBookSupported = chainSupportsOrderBook(chainId);

  const { data, isLoading, error, refetch, isFetching } = useUserV4LiquidityPositions(account, chainId);
  const positions = data?.positions ?? [];

  const tokens = useMemo(
    () =>
      Array.from(
        new Set(positions.flatMap((p) => [p.position.poolKey.currency0, p.position.poolKey.currency1])),
      ) as Address[],
    [positions],
  );
  const { data: tokensInfo } = useTokensInfo(tokens.length > 0 ? tokens : undefined, chainId);
  const tokenDisplayByAddress = useMemo(() => {
    const map = new Map<string, TokenDisplay>();
    for (const token of tokensInfo ?? []) {
      map.set(token.address.toLowerCase(), { symbol: token.symbol, decimals: token.decimals });
    }
    return map;
  }, [tokensInfo]);

  // Until token metadata loads, or if it fails, amounts must not be scaled by a guessed decimals
  // count. Both sides are known locally: the primary collateral is configured per chain, and every
  // other currency in these pools is an outcome token, which always has 18 decimals.
  const collateral = getActivePrimaryCollateral(chainId);
  const tokenDisplay = (address: Address): TokenDisplay => {
    const known = tokenDisplayByAddress.get(address.toLowerCase());
    if (known) return known;
    if (isAddressEqual(address, collateral.address)) {
      return { symbol: collateral.symbol, decimals: collateral.decimals };
    }
    return { symbol: "", decimals: OUTCOME_TOKEN_DECIMALS };
  };

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your liquidity positions.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Liquidity positions aren't available on this network yet.</Alert>;
  }

  if (isLoading || (!data && !error)) {
    return <LoadingBlock label="Loading your liquidity positions" />;
  }

  // The full error is only for a list that never loaded; cached positions stay up when a refetch fails.
  if (!data) {
    return (
      <LoadError
        title="Couldn't load liquidity positions"
        description="Your positions couldn't be read right now. Nothing changed on-chain."
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const refreshNotice = error ? (
    <RefreshError subject="your liquidity positions" onRetry={() => refetch()} isRetrying={isFetching} />
  ) : null;

  if (positions.length === 0) {
    return (
      <>
        {refreshNotice}
        <Alert type="info" title="No liquidity positions">
          {canManage ? (
            <div className="space-y-3">
              <p>When you add liquidity to an outcome from its market page, the position shows up here.</p>
              <Link to={MARKETS_PATH} className={QUIET_BUTTON_CLASS}>
                Browse markets
              </Link>
            </div>
          ) : (
            <p>This account has no liquidity positions on this network.</p>
          )}
        </Alert>
      </>
    );
  }

  const groups = groupByMarketOutcome(
    positions.filter(
      (p) =>
        !filter ||
        isTextInString(filter, p.market.marketName) ||
        isTextInString(filter, p.market.outcomes[p.outcomeIndex] ?? ""),
    ),
  );

  return (
    <div>
      {refreshNotice}
      <div className="grow mb-6">
        <label className="sr-only" htmlFor="liquidity-search">
          Search by market or outcome
        </label>
        <Input
          id="liquidity-search"
          type="search"
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          value={filter}
          isClearable
          onClear={() => setFilter("")}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      {groups.length === 0 ? (
        <Alert type="info" title="No matching positions">
          <div className="space-y-3">
            <p>Nothing matches “{filter}”.</p>
            <button type="button" className={QUIET_BUTTON_CLASS} onClick={() => setFilter("")}>
              Clear search
            </button>
          </div>
        </Alert>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <h3 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[16px] font-normal">
                <a
                  href={group.marketHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold break-words text-purple-primary dark:text-purple-secondary hover:underline underline-offset-4"
                >
                  {group.marketName}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <span className="text-[14px] text-base-content/70">{group.outcomeLabel}</span>
              </h3>
              {group.items.map(({ position, market, outcomeIndex, outcomeIsToken0 }) => (
                <V4PositionRow
                  key={position.tokenId.toString()}
                  market={market}
                  outcomeIndex={outcomeIndex}
                  position={position}
                  poolState={data.poolStateById.get(position.poolId.toLowerCase())}
                  outcomeIsToken0={outcomeIsToken0}
                  token0={tokenDisplay(position.poolKey.currency0)}
                  token1={tokenDisplay(position.poolKey.currency1)}
                  account={account}
                  showActions={canManage}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiquidityTab;
