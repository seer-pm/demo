import { Alert } from "@/components/Alert";
import Input from "@/components/Form/Input";
import { type TokenDisplay, V4PositionRow } from "@/components/Market/AddLiquidity/V4PositionsList";
import {
  type UserV4LiquidityPosition,
  useUserV4LiquidityPositions,
} from "@/hooks/portfolio/useUserV4LiquidityPositions";
import { SearchIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isTextInString } from "@/lib/utils";
import { chainSupportsOrderBook } from "@seer-pm/order-book/v4";
import { useTokensInfo } from "@seer-pm/react";
import type { SupportedChain } from "@seer-pm/sdk";
import { useMemo, useState } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

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

  const { data, isLoading, error } = useUserV4LiquidityPositions(account, chainId);
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

  const tokenDisplay = (address: Address): TokenDisplay =>
    tokenDisplayByAddress.get(address.toLowerCase()) ?? { symbol: "", decimals: 18 };

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your liquidity positions.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Uniswap V4 liquidity is not available on this chain.</Alert>;
  }

  if (isLoading) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }

  if (error) {
    return <Alert type="error">Failed to load liquidity positions: {(error as Error).message}</Alert>;
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
      <div className="grow mb-6">
        <Input
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          onKeyUp={(event) => setFilter((event.target as HTMLInputElement).value)}
        />
      </div>

      {groups.length === 0 ? (
        <div className="text-[14px] opacity-70">
          {positions.length === 0 ? "No Uniswap V4 liquidity positions." : "No positions match your search."}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <a
                  href={group.marketHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-semibold text-purple-primary hover:underline"
                >
                  {group.marketName}
                </a>
                <span className="text-[14px] text-black-secondary">{group.outcomeLabel}</span>
              </div>
              {group.items.map(({ position, market, outcomeIsToken0 }) => (
                <V4PositionRow
                  key={position.tokenId.toString()}
                  market={market}
                  position={position}
                  poolState={data?.poolStateById.get(position.poolId.toLowerCase())}
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
