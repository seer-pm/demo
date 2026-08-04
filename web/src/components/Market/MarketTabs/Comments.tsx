import ErrorBoundary from "@/components/ErrorBoundary";
import Button from "@/components/Form/Button";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsAccountConnected, useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useSignIn } from "@/hooks/useSignIn";
import { getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { Discussion, type DiscussionButtonProps, createDiscussionsClient, userFromAddress } from "@seer-pm/discussions";
import { Market } from "@seer-pm/sdk";
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

  const client = useMemo(
    () =>
      createDiscussionsClient({
        baseUrl: getAppUrl(),
        marketId: market.id,
        getAccessToken: () => {
          const token = useGlobalState.getState().accessToken;
          return isAccessTokenExpired(token) ? "" : token;
        },
      }),
    [market.id],
  );

  const user = isSignedIn && address ? userFromAddress(address) : null;

  const requestConnect = async () => {
    if (!isConnected || !address || !chainId) {
      await open({ view: "Connect" });
      return;
    }
    await signIn.mutateAsync({ address, chainId });
  };

  return (
    <ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <Discussion
        context={market.id.toLowerCase()}
        client={client}
        user={user}
        onRequestConnect={requestConnect}
        components={{ Button: DiscussionButton }}
      />
    </ErrorBoundary>
  );
}

export default Comments;
