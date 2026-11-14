import { Alert } from "@/components/Alert";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import { LoadError, LoadingBlock, RefreshError } from "@/components/LoadStates";
import {
  type LiquidityRewardRow,
  useClaimLiquidityReward,
  useLiquidityRewards,
} from "@/hooks/portfolio/useLiquidityRewards";
import { PRIMARY_BUTTON_CLASS } from "@/lib/buttonClasses";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { displayBalance } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

const formatDate = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function RewardsTable({
  rows,
  pendingValidAt,
  claimLabel,
  claimingKey,
  onClaim,
}: {
  rows: LiquidityRewardRow[];
  pendingValidAt: Map<number, number>;
  /** `undefined` hides the claim action (no wallet connected). */
  claimLabel: string | undefined;
  claimingKey: string | undefined;
  onClaim: (row: LiquidityRewardRow) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] text-base-content/70 max-w-3xl">
        Rewards for Uniswap V4 liquidity are computed every Monday at 00:00 UTC and become claimable 48 hours later.
        Anyone can send a claim; the tokens always go to this account.
      </p>
      <ul className="border-t border-separator-100">
        {rows.map((row) => {
          const key = `${row.chainId}-${row.token}`;
          const amount = (value: bigint) => displayBalance(value, row.decimals, true);
          const validAt = pendingValidAt.get(row.chainId);
          const chainName = SUPPORTED_CHAINS[row.chainId as SupportedChain]?.name ?? `chain ${row.chainId}`;
          return (
            <li
              key={key}
              className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_13rem] gap-x-6 gap-y-4 items-center py-5 border-b border-separator-100"
            >
              <div>
                <p className="font-semibold">{row.symbol}</p>
                <p className="text-[14px] text-base-content/70">on {chainName}</p>
              </div>
              <div>
                <p className="text-[13px] text-base-content/70">Claimable now</p>
                <p className="text-[18px] font-semibold tabular-nums">{amount(row.claimable)}</p>
                <p className="text-[13px] text-base-content/70 tabular-nums">
                  {amount(row.earned)} earned · {amount(row.claimed)} claimed
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[13px] text-base-content/70">Next update</p>
                {row.upcoming > 0n && validAt !== undefined ? (
                  <p className="text-[14px]">
                    <span className="tabular-nums font-semibold">+{amount(row.upcoming)}</span>{" "}
                    <span className="text-base-content/70">claimable from {formatDate(validAt)}</span>
                  </p>
                ) : (
                  <p className="text-[14px] text-base-content/70">Nothing pending</p>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1 sm:text-right">
                {row.claimable === 0n ? (
                  <span className="text-[14px] text-base-content/70">Nothing to claim</span>
                ) : claimLabel ? (
                  <SwitchChainButtonWrapper chainId={row.chainId as SupportedChain} size="small">
                    <button
                      type="button"
                      className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto whitespace-nowrap`}
                      disabled={claimingKey !== undefined}
                      onClick={() => onClaim(row)}
                    >
                      {claimingKey === key ? "Claiming…" : claimLabel}
                    </button>
                  </SwitchChainButtonWrapper>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RewardsTab({ account }: { account: Address | undefined }) {
  const { address: connectedAddress } = useAccount();
  const { data, isLoading, error, refetch, isFetching } = useLiquidityRewards(account);
  const claim = useClaimLiquidityReward(account);

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your liquidity rewards.</Alert>;
  }
  if (isLoading || (!data && !error)) {
    return <LoadingBlock label="Loading your liquidity rewards" />;
  }
  if (!data) {
    return (
      <LoadError
        title="Couldn't load liquidity rewards"
        description="Your rewards couldn't be read right now. Nothing changed on-chain."
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }
  if (data.liveChainIds.length === 0) {
    return (
      <Alert type="info" title="Liquidity rewards aren't live yet">
        Rewards for providing liquidity on Uniswap V4 pools will show up here once the program starts.
      </Alert>
    );
  }

  const refreshNotice = error ? (
    <RefreshError subject="your liquidity rewards" onRetry={() => refetch()} isRetrying={isFetching} />
  ) : null;
  if (data.rows.length === 0) {
    return (
      <>
        {refreshNotice}
        <Alert type="info" title="No liquidity rewards yet">
          Liquidity that stays in range in a rewarded pool earns every second. What it earns shows up here after the
          next Monday update.
        </Alert>
      </>
    );
  }

  const isOwn = connectedAddress !== undefined && isAddressEqual(connectedAddress, account);
  return (
    <>
      {refreshNotice}
      <RewardsTable
        rows={data.rows}
        pendingValidAt={data.pendingValidAt}
        claimLabel={connectedAddress === undefined ? undefined : isOwn ? "Claim" : "Claim for this account"}
        claimingKey={
          claim.isPending && claim.variables ? `${claim.variables.chainId}-${claim.variables.token}` : undefined
        }
        onClaim={(row) => claim.mutate(row)}
      />
    </>
  );
}

export default RewardsTab;
