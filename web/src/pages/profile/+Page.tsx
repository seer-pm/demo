import { NotificationsForm } from "@/components/Account/NotificationsForm";
import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import ConnectWallet from "@/components/ConnectWallet";
import Button from "@/components/Form/Button";
import { Link } from "@/components/Link";
import { ProfileIdentity } from "@/components/ProfileIdentity";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { type PublicUser, getPublicUser, usePublicUser } from "@/hooks/usePublicUser";
import { useSignIn } from "@/hooks/useSignIn";
import { queryClient } from "@/lib/query-client";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { fetchAuth } from "@/lib/utils";
import { type FormEvent, useEffect, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const SECTION = "border-t border-separator-100 p-6 sm:p-8";

type Availability = { state: "idle" | "checking" } | { state: "free" | "taken"; username: string };

/** Claims or renames the signed-in wallet's Seer username. */
function UsernameSection({ accessToken, address }: { accessToken: string; address: Address }) {
  const { data: user, isLoading, error: loadError, refetch, isFetching } = usePublicUser({ address });
  const current = user?.username ?? "";
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; username?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(current);
  }, [current]);

  const candidate = normalizeUsername(draft);
  const unchanged = candidate === current;

  /** Reports whether a candidate is free before the user commits to it, rather than after a 409. */
  const checkAvailability = async () => {
    if (!candidate || unchanged || validateUsername(candidate)) return;
    setAvailability({ state: "checking" });
    try {
      const found = await getPublicUser({ username: candidate });
      setAvailability({ state: found ? "taken" : "free", username: candidate });
    } catch {
      // An availability check that fails is not an error the user has to act on; the save itself
      // still reports a collision.
      setAvailability({ state: "idle" });
    }
  };

  const save = async (username: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const data = (await fetchAuth(accessToken, "/.netlify/functions/users", "PATCH", { username })) as {
        user: PublicUser;
      };
      await queryClient.invalidateQueries({ queryKey: ["publicUser"] });
      setDraft(data.user.username ?? "");
      setConfirming(null);
      setAvailability({ state: "idle" });
      setMessage({
        type: "success",
        text: `You are @${data.user.username} across Seer.`,
        username: data.user.username ?? undefined,
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save username" });
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateUsername(candidate);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }
    // A username is public, permanent, and already linked from anywhere it has been shared, so the
    // commitment gets its own step rather than happening on the same click as typing.
    setConfirming(candidate);
  };

  if (loadError) {
    return (
      <section className={SECTION} aria-labelledby="username-heading">
        <h2 id="username-heading" className="text-[18px] font-semibold mb-2">
          Username
        </h2>
        <Alert type="error" title="Couldn't load your username">
          <div className="mt-2">
            <Button text="Try again" isLoading={isFetching} onClick={() => void refetch()} />
          </div>
        </Alert>
      </section>
    );
  }

  return (
    <section className={SECTION} aria-labelledby="username-heading">
      <h2 id="username-heading" className="text-[18px] font-semibold">
        Username
      </h2>
      <p className="text-[14px] text-black-primary mt-1 mb-4">
        Your username labels you in comments, on the leaderboard, among top holders, and on your profile. It is
        optional. Without one you appear under your ENS name, or under a nickname generated from your address.
      </p>

      {isLoading && !user ? (
        <div className="shimmer-container h-12 w-full max-w-sm" aria-hidden />
      ) : (
        <form onSubmit={submit} className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="username" className="block text-[14px] font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[16px] top-0 bottom-0 flex items-center text-black-primary"
              >
                @
              </span>
              <input
                id="username"
                name="username"
                value={draft}
                autoComplete="off"
                spellCheck={false}
                maxLength={50}
                aria-describedby="username-rules"
                onBlur={() => void checkAvailability()}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setMessage(null);
                  setConfirming(null);
                  setAvailability({ state: "idle" });
                }}
                className="input input-bordered w-full bg-base-100 pl-[32px] focus:outline-purple-primary"
              />
            </div>
            <p id="username-rules" className="text-[12px] text-black-primary mt-2">
              3–50 characters: lowercase letters, numbers, hyphens, or underscores.
            </p>
            {availability.state === "checking" ? (
              <p className="text-[12px] text-black-primary mt-1">Checking availability…</p>
            ) : availability.state === "taken" ? (
              <p className="text-[12px] text-signed-down mt-1">@{availability.username} is taken. Try another.</p>
            ) : availability.state === "free" ? (
              <p className="text-[12px] text-signed-up mt-1">@{availability.username} is available.</p>
            ) : null}
          </div>

          {confirming ? (
            <Alert type="warning" title={current ? "Change your username?" : `Claim @${confirming}?`}>
              <p className="mt-1">
                {current
                  ? `You will be @${confirming} everywhere on Seer. Links you have already shared to @${current} will stop working, because a profile is reached by its current username.`
                  : `You will be @${confirming} everywhere on Seer: in comments, on the leaderboard, and on your profile. You can change it later, but a username cannot be removed once claimed.`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  text={current ? "Change username" : "Claim username"}
                  isLoading={saving}
                  onClick={() => void save(confirming)}
                />
                <Button text="Cancel" variant="secondary" disabled={saving} onClick={() => setConfirming(null)} />
              </div>
            </Alert>
          ) : (
            <Button
              type="submit"
              text={current ? "Change username" : "Claim username"}
              disabled={saving || !candidate || unchanged}
            />
          )}

          {message && (
            <Alert type={message.type}>
              <p>{message.text}</p>
              {message.username ? (
                <p className="mt-2">
                  <Link
                    to={`/portfolio/@${message.username}`}
                    className="text-purple-primary hover:underline font-medium"
                  >
                    See how you appear on Seer
                  </Link>
                </p>
              ) : null}
            </Alert>
          )}
        </form>
      )}
    </section>
  );
}

/** Collects the email address Seer sends market notifications to. */
function EmailSection({ accessToken }: { accessToken: string }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetchAuth(accessToken, "/.netlify/functions/me", "GET").then((d) => setEmail(d?.user?.email ?? ""));
  }, [accessToken]);

  return (
    <section className={SECTION} aria-labelledby="email-heading">
      <h2 id="email-heading" className="text-[18px] font-semibold">
        Email notifications
      </h2>
      <p className="text-[14px] text-black-primary mt-1 mb-4">
        Receive email notifications for your followed markets and important updates.
      </p>
      <div className="max-w-sm">
        <NotificationsForm key={`email-${email}`} email={email} accessToken={accessToken} />
      </div>
    </section>
  );
}

export default function AccountPage() {
  const { address, chainId, isConnected } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const signedIn = useIsConnectedAndSignedIn();
  const signIn = useSignIn();
  const { data: user, isLoading: isUserLoading } = usePublicUser(address ? { address } : null);

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px]">
      <Breadcrumb links={[{ title: "Account" }]} />
      <h1 className="text-[24px] font-semibold text-base-content">Account</h1>

      <div className="bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)]">
        {!isConnected || !address ? (
          <div className="p-6 sm:p-8">
            <p className="text-[14px] text-black-primary mb-4">
              Connect your wallet to choose a username and set where Seer emails you.
            </p>
            <ConnectWallet size="large" />
          </div>
        ) : !signedIn ? (
          <>
            <div className="p-6 sm:p-8">
              <ProfileIdentity address={address} username={user?.username} isLoading={isUserLoading} />
            </div>
            <div className={SECTION}>
              <p className="text-[14px] text-black-primary mb-4">
                Sign in with your wallet to change these settings. Signing proves you own this address; it costs no gas.
              </p>
              <Button
                text="Sign in with wallet"
                isLoading={signIn.isPending}
                onClick={() => signIn.mutateAsync({ address, chainId: chainId! }).catch(() => undefined)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="p-6 sm:p-8">
              <ProfileIdentity address={address} username={user?.username} isLoading={isUserLoading}>
                <Link to={`/portfolio/${address}`} className="text-[14px] text-purple-primary hover:underline">
                  View your public profile
                </Link>
              </ProfileIdentity>
            </div>
            <UsernameSection accessToken={accessToken} address={address} />
            <EmailSection accessToken={accessToken} />
          </>
        )}
      </div>
    </div>
  );
}
