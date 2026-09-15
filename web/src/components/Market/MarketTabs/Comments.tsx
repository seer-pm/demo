import { Alert } from "@/components/Alert";
import ErrorBoundary from "@/components/ErrorBoundary";
import Button from "@/components/Form/Button";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsAccountConnected, useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { usePublicUser } from "@/hooks/usePublicUser";
import { useSignIn } from "@/hooks/useSignIn";
import { paths } from "@/lib/paths";
import { getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { Discussion, type DiscussionButtonProps, createDiscussionsClient, userFromAddress } from "@seer-pm/discussions";
import type { Market } from "@seer-pm/sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Children, type ReactNode, useMemo } from "react";
import { useAccount } from "wagmi";

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

function Comments({ market }: { market: Market }) {
  const { address, chainId } = useAccount();
  const isConnected = useIsAccountConnected();
  const isSignedIn = useIsConnectedAndSignedIn();
  const signIn = useSignIn();
  const { open } = useWeb3Modal();
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
        chainId: market.chainId,
        getProfileHref: ({ address, username }) =>
          username ? paths.portfolioUsername(username) : `/portfolio/${address}`,
        getAccessToken: () => {
          const token = useGlobalState.getState().accessToken;
          return isAccessTokenExpired(token) ? "" : token;
        },
      }),
    [market.id, market.chainId],
  );

  const user =
    isSignedIn && address && !isCurrentUserPending && currentUser
      ? userFromAddress(address, currentUser.username, paths.portfolioUsername(currentUser.username))
      : null;

  const requestConnect = async () => {
    if (isSignedIn && address) {
      // Signed in but the profile lookup failed: retry it instead of asking for another signature.
      await refetchCurrentUser();
      return;
    }
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

  // Posting needs the username; reading does not. A failed lookup keeps the thread readable.
  const profileUnavailable = isSignedIn && address && (currentUserError || !currentUser);

  return (
    <ErrorBoundary fallback={<p>Something went wrong.</p>}>
      {profileUnavailable ? (
        <Alert type="error" title="Unable to load your discussion profile" className="mb-4">
          <div className="mt-2">
            <Button
              text="Try again"
              size="small"
              isLoading={isCurrentUserFetching}
              onClick={() => void refetchCurrentUser()}
            />
          </div>
        </Alert>
      ) : null}
      <Discussion
        client={client}
        user={user}
        onRequestConnect={requestConnect}
        components={{ Button: DiscussionButton }}
      />
    </ErrorBoundary>
  );
}

export default Comments;
