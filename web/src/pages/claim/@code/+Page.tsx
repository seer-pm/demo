import { Alert } from "@/components/Alert";
import Button, { LinkButton } from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getAppUrl, shortenAddress } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { isAddress } from "viem";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

type ClaimedCard = {
  serial: string;
  amountUsd: number;
  credits: string | null;
  status: "pending" | "sent" | "confirmed" | "failed";
  txHash: string | null;
  dripStatus: "none" | "pending" | "sent" | "confirmed" | "failed" | "skipped";
  dripTxHash: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
};

type CardResponse =
  | { state: "valid" | "inactive" | "not_found" | "unavailable"; error?: string }
  | { state: "claimed"; data: ClaimedCard; error?: string };

const explorerUrl = SUPPORTED_CHAINS[gnosis.id]?.blockExplorers?.default?.url ?? "https://gnosisscan.io";

const cardQueryKey = (code: string) => ["useCreditCard", code];

function useCreditCard(code: string) {
  return useQuery<CardResponse>({
    queryKey: cardQueryKey(code),
    enabled: !!code,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`${getAppUrl()}/.netlify/functions/credit-card?code=${encodeURIComponent(code)}`);
      const json = await response.json();
      if (!response.ok && response.status !== 404) {
        throw new Error(json.error ?? "Failed to load card");
      }
      return json;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.state !== "claimed") return false;
      const inFlight = (status: string) => status === "pending" || status === "sent";
      return inFlight(data.data.status) || inFlight(data.data.dripStatus) ? 4000 : false;
    },
  });
}

function useClaimCreditCard(code: string, onClaimed: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (address: string): Promise<CardResponse> => {
      const response = await fetch(`${getAppUrl()}/.netlify/functions/claim-credit-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, address }),
      });
      const json = await response.json();
      if (!response.ok && !json.state) {
        throw new Error(json.error ?? "Failed to claim card");
      }
      return json;
    },
    onSuccess: (result) => {
      // A refused claim (already claimed, inactive, unavailable) is shown by reloading the card state.
      if (result.state === "claimed" && !result.error) {
        onClaimed();
        queryClient.setQueryData(cardQueryKey(code), result);
      } else {
        queryClient.invalidateQueries({ queryKey: cardQueryKey(code) });
      }
    },
  });
}

/** Counts up to `target` once, so the amount feels revealed rather than printed. */
function useCountUp(target: number, animate: boolean) {
  const [value, setValue] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);
  return value;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid py-[24px] lg:py-[65px]">
      <div className="max-w-[520px] mx-auto card shadow-sm border border-separator-100 bg-base-100 p-6 lg:p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}

function ClaimForm({ code, onClaimed }: { code: string; onClaimed: () => void }) {
  const { address: connectedAddress } = useAccount();
  const { open } = useWeb3Modal();
  const [manualAddress, setManualAddress] = useState("");
  const [useManual, setUseManual] = useState(false);
  const claim = useClaimCreditCard(code, onClaimed);

  const recipient = useManual || !connectedAddress ? manualAddress.trim() : connectedAddress;
  const isValidRecipient = isAddress(recipient);
  const refusal = claim.data && claim.data.state !== "claimed" ? claim.data.error : undefined;

  return (
    <CardShell>
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-wide text-purple-primary font-semibold">Seer card</p>
        <h1 className="text-2xl lg:text-3xl font-semibold">You've got Seer credits</h1>
        <p className="text-base-content/70">
          This card holds a surprise amount of trading credits, between a few dollars and a lot more. Choose where to
          send them and reveal it.
        </p>
      </div>

      <div className="space-y-3">
        {connectedAddress && !useManual ? (
          <div className="rounded-lg bg-base-200 p-4 text-sm">
            <p className="text-base-content/60">Sending to your connected wallet</p>
            <p className="font-mono break-all">{connectedAddress}</p>
            <button
              type="button"
              className="text-purple-primary hover:underline mt-2"
              onClick={() => setUseManual(true)}
            >
              Use another address
            </button>
          </div>
        ) : (
          <>
            {!connectedAddress && (
              <Button text="Connect wallet" type="button" className="w-full" onClick={() => open()} />
            )}
            <div className="space-y-1">
              <label htmlFor="claim-address" className="text-sm font-semibold block">
                {connectedAddress ? "Recipient address" : "Or paste a Gnosis address"}
              </label>
              <Input
                id="claim-address"
                className="w-full font-mono"
                placeholder="0x…"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
              {manualAddress && !isValidRecipient && <p className="text-sm text-error-primary">Invalid address.</p>}
            </div>
            {connectedAddress && (
              <button
                type="button"
                className="text-sm text-purple-primary hover:underline"
                onClick={() => setUseManual(false)}
              >
                Use my connected wallet
              </button>
            )}
          </>
        )}
      </div>

      {(claim.error || refusal) && <Alert type="error">{claim.error?.message ?? refusal}</Alert>}

      <Button
        text="Reveal & claim"
        type="button"
        className="w-full"
        disabled={!isValidRecipient}
        isLoading={claim.isPending}
        onClick={() => claim.mutate(recipient)}
      />
      <p className="text-[12px] text-base-content/60 text-center">
        Credits are sent on Gnosis Chain. Each card can be claimed once.
      </p>
    </CardShell>
  );
}

function ClaimedView({ card, justClaimed }: { card: ClaimedCard; justClaimed: boolean }) {
  const amount = useCountUp(card.amountUsd, justClaimed);
  const inFlight = card.status === "pending" || card.status === "sent";

  return (
    <CardShell>
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-wide text-purple-primary font-semibold">
          {justClaimed ? "You got" : "This card was claimed"}
        </p>
        <p className="text-5xl lg:text-6xl font-semibold">${amount}</p>
        {card.credits && (
          <p className="text-base-content/70">
            {Number(card.credits).toLocaleString("en-US", { maximumFractionDigits: 2 })} Seer credits
          </p>
        )}
      </div>

      <div className="rounded-lg bg-base-200 p-4 text-sm space-y-2">
        {card.claimedBy && (
          <p>
            <span className="text-base-content/60">Recipient: </span>
            <span className="font-mono">{shortenAddress(card.claimedBy)}</span>
          </p>
        )}
        <p className="flex items-center gap-2">
          {inFlight && <span className="loading loading-spinner loading-xs" />}
          <span>
            {card.status === "confirmed" && "Credits delivered."}
            {inFlight && "Sending your credits…"}
            {card.status === "failed" && "The transfer failed. Our team has been notified and will retry it."}
          </span>
          {card.txHash && (
            <a
              href={`${explorerUrl}/tx/${card.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-primary hover:underline ml-auto"
            >
              View tx
            </a>
          )}
        </p>
        {card.dripStatus !== "none" && card.dripStatus !== "skipped" && (
          <p className="text-base-content/70">
            {card.dripStatus === "confirmed"
              ? "We also sent a little xDAI so you can pay for gas."
              : "A little xDAI for gas is on its way too."}
          </p>
        )}
      </div>

      {card.status === "confirmed" && <LinkButton text="Start trading" to="/" className="w-full" />}
    </CardShell>
  );
}

function ClaimCardPage() {
  const { routeParams } = usePageContext();
  const code = routeParams.code ?? "";
  const { data, isLoading, error } = useCreditCard(code);
  // Only the visit that claims gets the reveal; reopening the link shows the result straight away.
  const [justClaimed, setJustClaimed] = useState(false);

  if (isLoading) {
    return (
      <CardShell>
        <div className="shimmer-container h-48 rounded-lg" />
      </CardShell>
    );
  }

  if (error || !data) {
    return (
      <CardShell>
        <Alert type="error" title="Something went wrong">
          We could not load this card. Please try again in a moment.
        </Alert>
      </CardShell>
    );
  }

  if (data.state === "not_found") {
    return (
      <CardShell>
        <Alert type="error" title="Invalid card">
          This link does not match any Seer card. Check that you scanned the full QR code.
        </Alert>
      </CardShell>
    );
  }

  if (data.state === "inactive") {
    return (
      <CardShell>
        <Alert type="warning" title="This card is not active">
          This card cannot be claimed right now. If you just received it, try again later.
        </Alert>
      </CardShell>
    );
  }

  if (data.state === "claimed") {
    return <ClaimedView card={data.data} justClaimed={justClaimed} />;
  }

  return <ClaimForm code={code} onClaimed={() => setJustClaimed(true)} />;
}

export default ClaimCardPage;
