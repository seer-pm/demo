import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import {
  canUsePohLinks,
  getAccessTokenChainId,
  useLinkPoh,
  usePohLinks,
  useUnlinkPoh,
} from "@/hooks/airdrop/usePohLink";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useSignIn } from "@/hooks/useSignIn";
import { formatSeer } from "@/lib/airdropFormat";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { shortenAddress } from "@/lib/utils";
import { checkWalletConnectCallback } from "@/lib/wallet";
import { useState } from "react";
import { type Address, isAddress } from "viem";
import { useAccount } from "wagmi";

function chainName(chainId: number) {
  return (SUPPORTED_CHAINS as Record<number, { name: string } | undefined>)[chainId]?.name ?? `Chain ${chainId}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-purple-medium dark:bg-neutral rounded-[3px] px-4 py-5 sm:px-5 space-y-3 border border-transparent dark:border-purple-primary/40">
      {children}
    </div>
  );
}

function RegisterLink({ account }: { account: Address }) {
  return (
    <a
      href={`https://v2.proofofhumanity.id/${account.replace(/^0x/, "")}/claim`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-semibold text-purple-primary"
    >
      No profile yet? Register on Proof of Humanity
    </a>
  );
}

/**
 * Lets the connected wallet send its Proof of Humanity share to a PoH profile it does not trade
 * from: another wallet, a multisig whose address differs per chain, or a chain PoH is not on. The
 * share is paid to the PROFILE, which is what makes an unproven link harmless. Only rendered on the
 * wallet's own portfolio; the link itself is private (see netlify/functions/poh-links.ts).
 */
export function PohLinkCard({ account }: { account: Address }) {
  const accessToken = useGlobalState((state) => state.accessToken);
  const { chainId: connectedChainId } = useAccount();
  const signIn = useSignIn();
  const { data, isLoading, error } = usePohLinks();
  const linkPoh = useLinkPoh(() => setInput(""));
  const unlinkPoh = useUnlinkPoh();
  const [input, setInput] = useState("");

  const tokenChainId = getAccessTokenChainId(accessToken);
  const signInOnCurrentChain = () =>
    checkWalletConnectCallback((address, chainId) => {
      signIn.mutateAsync({ address, chainId });
    });

  if (!canUsePohLinks(accessToken)) {
    return (
      <Shell>
        <p className="text-sm text-black-primary">
          Registered on Proof of Humanity with a different wallet? Sign in to link that profile and see how much SEER
          this wallet's holdings could add to it.
        </p>
        <Button text="Sign in" size="small" isLoading={signIn.isPending} onClick={signInOnCurrentChain} />
        <div>
          <RegisterLink account={account} />
        </div>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="text-sm text-black-primary">Loading Proof of Humanity link…</p>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <p className="text-sm text-error">Could not load your Proof of Humanity link.</p>
      </Shell>
    );
  }

  if (data.selfVerified) {
    return (
      <Shell>
        <p className="text-sm text-black-primary">
          This wallet is verified on Proof of Humanity, so its holdings earn its own Proof of Humanity share.
        </p>
      </Shell>
    );
  }

  const [mostRecent] = data.links;
  // The link would be made on the chain the token was signed on. If the wallet has switched since,
  // the server would reject it, so ask for a fresh sign-in first.
  const needsResign = connectedChainId !== undefined && connectedChainId !== tokenChainId;
  const trimmed = input.trim();
  const inputValid = isAddress(trimmed) && trimmed.toLowerCase() !== account.toLowerCase();

  return (
    <Shell>
      {data.links.length === 0 ? (
        <>
          <p className="text-sm font-semibold text-purple-primary">Link your Proof of Humanity profile</p>
          {data.potential && data.potential.toDate > 0 ? (
            <p className="text-sm text-black-primary">
              Linking a profile would add an estimated{" "}
              <strong className="tabular-nums">{formatSeer(data.potential.toDate)} SEER</strong> to date, and about{" "}
              <strong className="tabular-nums">{formatSeer(data.potential.monthly)} SEER</strong> over the next 30 days
              at current holdings.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-purple-primary">Linked Proof of Humanity profile</p>
          <ul className="space-y-2">
            {data.links.map((link) => (
              <li key={link.chainId} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-black-primary">
                  {chainName(link.chainId)}
                  {link === mostRecent ? " and every chain without its own link" : " only"}:
                </span>
                <span className="font-mono">{shortenAddress(link.pohAddress)}</span>
                <button
                  type="button"
                  className="text-purple-primary font-semibold disabled:opacity-50"
                  disabled={unlinkPoh.isPending}
                  onClick={() => unlinkPoh.mutate({ accessToken, chainId: link.chainId })}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-sm text-black-primary">
        The Proof of Humanity share this wallet's holdings earn is paid to the linked profile, not to this wallet. Your
        link is private. It counts for every past day, and applies from the next nightly update.
      </p>

      {needsResign ? (
        <div className="space-y-2">
          <p className="text-sm text-black-primary">
            You are signed in on {chainName(tokenChainId!)}. Sign in again to link on {chainName(connectedChainId!)}.
          </p>
          <Button text="Sign in" size="small" isLoading={signIn.isPending} onClick={signInOnCurrentChain} />
        </div>
      ) : (
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValid) {
              linkPoh.mutate({ accessToken, chainId: tokenChainId!, pohAddress: trimmed });
            }
          }}
        >
          <Input
            className="w-full"
            placeholder="PoH profile address (0x…)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="submit"
            size="small"
            className="sm:self-center"
            text={data.links.some((l) => l.chainId === tokenChainId) ? "Change" : "Link"}
            disabled={!inputValid}
            isLoading={linkPoh.isPending}
          />
        </form>
      )}
      <p className="text-xs text-black-secondary">
        Links are made for the chain your wallet is connected to ({chainName(tokenChainId!)}), and also apply to your
        other chains unless you link those separately.
      </p>
      <RegisterLink account={account} />
    </Shell>
  );
}
