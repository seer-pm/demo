import { Alert } from "@/components/Alert";
import ErrorBoundary from "@/components/ErrorBoundary";
import Button from "@/components/Form/Button";
import Tooltip from "@/components/Tooltip";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsAccountConnected, useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { usePublicUser } from "@/hooks/usePublicUser";
import { useSignIn } from "@/hooks/useSignIn";
import { paths } from "@/lib/paths";
import { displayBalance, getAppUrl, isAccessTokenExpired, isTwoStringsEqual } from "@/lib/utils";
import {
  Discussion,
  type DiscussionButtonProps,
  type DiscussionUserPositionBadgeProps,
  createDiscussionsClient,
  userFromAddress,
} from "@seer-pm/discussions";
import type { Market } from "@seer-pm/sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Children, type ReactNode, useMemo } from "react";
import { useAccount } from "wagmi";

type OutcomePosition = {
  tokenId: string;
  outcome: string;
  balance: bigint;
};

function buttonLabel(children: ReactNode): string {
  const text = Children.toArray(children)
    .filter((child) => typeof child === "string" || typeof child === "number")
    .join("")
    .trim();
  return text || " ";
}

function DiscussionButton({
  children,
  variant = "primary",
  isLoading,
  type,
  disabled,
  onClick,
}: DiscussionButtonProps) {
  return (
    <Button
      text={buttonLabel(children)}
      variant={variant === "secondary" ? "secondary" : "primary"}
      size="small"
      isLoading={isLoading}
      type={type}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

/** Displays one outcome position or a tooltip summarizing multiple positions. */
function PositionBadge({ positions }: { positions: OutcomePosition[] }) {
  if (positions.length === 0) return null;

  const pillClassName =
    "max-w-40 shrink truncate rounded-full border border-sd-color-active bg-sd-color-active px-2 py-0.5 text-[11px] font-medium leading-4 text-white";
  /** Formats a position for tooltip and accessibility labels. */
  const formatPositionLabel = ({ outcome, balance }: OutcomePosition) =>
    `${outcome}: ${displayBalance(balance, 18, true)} shares`;

  if (positions.length === 1) {
    const [position] = positions;
    return (
      <>
        <span className="sd-position-separator shrink-0 text-sd-color-secondary" aria-hidden="true">
          ·
        </span>
        <span className={pillClassName} title={formatPositionLabel(position)}>
          {position.outcome} {displayBalance(position.balance, 18, true)}
        </span>
      </>
    );
  }

  return (
    <>
      <span className="sd-position-separator shrink-0 text-sd-color-secondary" aria-hidden="true">
        ·
      </span>
      <Tooltip
        trigger={
          <button
            type="button"
            className={`${pillClassName} cursor-help`}
            aria-label={`Multiple positions: ${positions.map(formatPositionLabel).join(", ")}`}
          >
            Multiple Positions
          </button>
        }
        content={
          <div className="min-w-40">
            <p className="m-0 mb-1.5 text-xs font-semibold">Positions held</p>
            <ul className="m-0 list-none space-y-1 p-0">
              {positions.map(({ tokenId, outcome, balance }) => (
                <li key={tokenId} className="flex items-center justify-between gap-4 font-normal">
                  <span>{outcome}</span>
                  <span className="tabular-nums">{displayBalance(balance, 18, true)}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </>
  );
}

function Comments({ market }: { market: Market }) {
  const { address, chainId } = useAccount();
  const isConnected = useIsAccountConnected();
  const isSignedIn = useIsConnectedAndSignedIn();
  const signIn = useSignIn();
  const { open } = useWeb3Modal();
  const { data: marketHolders } = useMarketHolders(market);
  const {
    data: currentUser,
    isPending: isCurrentUserPending,
    isFetching: isCurrentUserFetching,
    error: currentUserError,
    refetch: refetchCurrentUser,
  } = usePublicUser(isSignedIn && address ? { address } : null);

  const client = useMemo(
    () =>
      createDiscussionsClient({
        baseUrl: getAppUrl(),
        marketId: market.id,
        getProfileHref: ({ username }) => paths.portfolioUsername(username),
        getAccessToken: () => {
          const token = useGlobalState.getState().accessToken;
          return isAccessTokenExpired(token) ? "" : token;
        },
      }),
    [market.id],
  );

  const user =
    isSignedIn && address && !isCurrentUserPending && currentUser
      ? userFromAddress(address, currentUser.username, paths.portfolioUsername(currentUser.username))
      : null;

  const positionsByUserAddress = useMemo(() => {
    const positionsByAddress = new Map<string, OutcomePosition[]>();

    for (const [tokenId, holders] of Object.entries(marketHolders?.topHolders ?? {})) {
      const outcomeIndex = market.wrappedTokens.findIndex((wrappedToken) => isTwoStringsEqual(wrappedToken, tokenId));
      const outcome = market.outcomes[outcomeIndex];
      if (!outcome) continue;

      for (const holder of holders) {
        const balance = BigInt(holder.balance);
        if (balance <= 0n) continue;

        const userAddress = holder.address.toLowerCase();
        const userPositions = positionsByAddress.get(userAddress) ?? [];
        userPositions.push({ tokenId, outcome, balance });
        positionsByAddress.set(userAddress, userPositions);
      }
    }

    return positionsByAddress;
  }, [marketHolders?.topHolders, market.outcomes, market.wrappedTokens]);

  const UserPositionBadge = useMemo(() => {
    /** Displays the current market positions held by a discussion user. */
    function UserPositionBadge({ user }: DiscussionUserPositionBadgeProps) {
      return <PositionBadge positions={positionsByUserAddress.get(user.address.toLowerCase()) ?? []} />;
    }
    return UserPositionBadge;
  }, [positionsByUserAddress]);

  const discussionComponents = useMemo(() => ({ Button: DiscussionButton, UserPositionBadge }), [UserPositionBadge]);

  const requestConnect = async () => {
    if (!isConnected || !address || !chainId) {
      await open({ view: "Connect" });
      return;
    }
    // toastify already reports the failure; swallow so onRequestConnect never rejects
    await signIn.mutateAsync({ address, chainId }).catch(() => undefined);
  };

  if (isSignedIn && address && isCurrentUserPending) {
    return <div className="shimmer-container h-48 w-full" />;
  }

  if (isSignedIn && address && (currentUserError || !currentUser)) {
    return (
      <Alert type="error" title="Unable to load your discussion profile">
        <div className="mt-2">
          <Button
            text="Try again"
            size="small"
            isLoading={isCurrentUserFetching}
            onClick={() => void refetchCurrentUser()}
          />
        </div>
      </Alert>
    );
  }

  return (
    <ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <Discussion client={client} user={user} onRequestConnect={requestConnect} components={discussionComponents} />
    </ErrorBoundary>
  );
}

export default Comments;
