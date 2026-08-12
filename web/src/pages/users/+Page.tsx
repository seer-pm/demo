import { Alert } from "@/components/Alert";
import ConnectWallet from "@/components/ConnectWallet";
import { EnsBadge } from "@/components/EnsBadge";
import Button from "@/components/Form/Button";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { type PublicUser, getPublicUser, usePublicUser } from "@/hooks/usePublicUser";
import { useSignIn } from "@/hooks/useSignIn";
import { Union } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { queryClient } from "@/lib/query-client";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { fetchAuth, shortenAddress } from "@/lib/utils";
import { CopyableAddress } from "@seer-pm/discussions";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { Address } from "viem";
import { navigate } from "vike/client/router";
import { useAccount, useEnsName } from "wagmi";

function EnsIdentity({ address }: { address: Address }) {
  const { data: ensName, isLoading } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) },
  });

  if (isLoading) return <div className="shimmer-container mt-2 h-6 w-32" />;
  if (!ensName) return <p className="mt-2 text-xs text-base-content/50">No ENS primary name detected.</p>;
  return <EnsBadge name={ensName} className="mt-2" />;
}

function ProfileHeader({
  address,
  description,
  eyebrow,
  isLoading,
  title,
}: {
  address: Address;
  description: ReactNode;
  eyebrow: ReactNode;
  isLoading?: boolean;
  title: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-primary/15 via-base-100 to-base-100 p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-primary shadow-md">
          <Union />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-primary">{eyebrow}</p>
          {isLoading ? (
            <div className="shimmer-container mt-2 h-8 w-52" />
          ) : (
            <h2 className="mt-1 break-all text-2xl font-bold">{title}</h2>
          )}
          <p className="mt-1 text-sm text-base-content/70">{description}</p>
          <EnsIdentity address={address} />
        </div>
      </div>
    </div>
  );
}

function UsernameManager({ accessToken, address }: { accessToken: string; address: Address }) {
  const { data: user, isLoading, error: loadError } = usePublicUser({ address });
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(user?.username ?? "");
  }, [user?.username]);

  useEffect(() => {
    if (loadError) {
      setMessage({ type: "error", text: loadError instanceof Error ? loadError.message : "Unable to load user" });
    }
  }, [loadError]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const username = normalizeUsername(draft);
    const validationError = validateUsername(username);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const data = (await fetchAuth(accessToken, "/.netlify/functions/users", "PATCH", { username })) as {
        user: PublicUser;
      };
      await queryClient.invalidateQueries({ queryKey: ["publicUser"] });
      setDraft(data.user.username);
      setMessage({ type: "success", text: `Your username is now @${data.user.username}.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save username" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <ProfileHeader
        address={address}
        eyebrow="Your Seer profile"
        isLoading={isLoading && !user}
        title={user ? `@${user.username}` : "Username unavailable"}
        description={
          user ? (
            <>
              Linked to <CopyableAddress address={user.address} shortAddress={shortenAddress(user.address)} />. You can
              update it below.
            </>
          ) : (
            "Every profile receives a username during its first verified wallet sign-in."
          )
        }
      />

      <form onSubmit={(event) => void save(event)} className="space-y-4 border-t border-base-300 p-6 sm:p-8">
        <label className="form-control w-full">
          <span className="label-text mb-2 font-medium">Username</span>
          <div className="flex items-center rounded-lg border border-base-300 bg-base-100 px-3 focus-within:border-purple-primary">
            <span className="text-base-content/50">@</span>
            <input
              aria-label="Username"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setMessage(null);
              }}
              className="input w-full border-0 bg-transparent px-1 focus:outline-none"
            />
          </div>
        </label>
        <p className="text-xs text-base-content/60">
          3–50 characters. Use lowercase letters, numbers, hyphens, or underscores. Usernames are unique.
        </p>
        <Button text="Save username" type="submit" disabled={saving || !draft.trim()} isLoading={saving} />
        {message && <Alert type={message.type}>{message.text}</Alert>}
      </form>
    </section>
  );
}

function UserSearch() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const username = normalizeUsername(query).replace(/^@/, "");
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSearching(true);
    try {
      const user = await getPublicUser({ username });
      if (!user) {
        setError("User not found.");
        return;
      }
      await navigate(paths.portfolioUsername(user.username));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unable to find user.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold">Find a user</h2>
      <p className="mt-1 text-sm text-base-content/70">Enter an exact username to open their portfolio.</p>
      <form onSubmit={(event) => void search(event)} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Search usernames"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setError("");
          }}
          placeholder="@username"
          className="input input-bordered w-full bg-base-100 focus:outline-purple-primary"
        />
        <Button text="View portfolio" type="submit" disabled={!query.trim()} isLoading={searching} />
      </form>
      {error && (
        <div className="mt-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}
    </section>
  );
}

function ConnectedUsernamePrompt({
  address,
  chainId,
  signIn,
}: {
  address: Address;
  chainId: number;
  signIn: ReturnType<typeof useSignIn>;
}) {
  const { data: user, isLoading: loading, isFetching, error, refetch } = usePublicUser({ address });

  return (
    <section className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <ProfileHeader
        address={address}
        eyebrow={user || error ? "Your Seer profile" : "Set up your profile"}
        isLoading={loading}
        title={error ? "Profile unavailable" : user ? `@${user.username}` : "Choose your username"}
        description={
          error ? (
            "Try loading your profile again before signing in."
          ) : user ? (
            "Sign in to update it."
          ) : (
            "Sign in to create a public username linked to your connected wallet."
          )
        }
      />
      <div className="border-t border-base-300 p-6 sm:p-8">
        {error ? (
          <Alert type="error" title="Unable to load your profile">
            <div className="mt-2">
              <Button text="Try again" size="small" isLoading={isFetching} onClick={() => void refetch()} />
            </div>
          </Alert>
        ) : (
          <Button
            text="Sign in with wallet"
            isLoading={signIn.isPending}
            onClick={() => signIn.mutateAsync({ address, chainId }).catch(() => undefined)}
          />
        )}
      </div>
    </section>
  );
}

export default function UsersPage() {
  const { address, chainId, isConnected } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const signIn = useSignIn();
  const signedIn = useIsConnectedAndSignedIn();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Seer users</h1>
        <p className="mt-2 text-base-content/70">Create your wallet-linked identity or find another user.</p>
      </div>

      {signedIn && address ? (
        <UsernameManager accessToken={accessToken} address={address} />
      ) : isConnected && address && chainId ? (
        <ConnectedUsernamePrompt address={address} chainId={chainId} signIn={signIn} />
      ) : (
        <section className="rounded-xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-primary">
            <Union />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Create your Seer profile</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-base-content/70">
            Connect your wallet once to create a username linked verifiably to your address.
          </p>
          <div className="mt-5 flex justify-center">
            <ConnectWallet size="large" />
          </div>
        </section>
      )}

      <UserSearch />
    </div>
  );
}
