import Button, { LinkButton } from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { CheckCircleIcon, SeerLogo } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { getAppUrl, shortenAddress } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

type CardInfo = {
  serial: string;
  campaignName: string | null;
  minUsd: number | null;
  maxUsd: number | null;
};

type ClaimedCard = {
  serial: string;
  campaignName?: string | null;
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
  | { state: "not_found" | "unavailable"; error?: string }
  | { state: "valid" | "inactive"; card?: CardInfo; error?: string }
  | { state: "claimed"; data: ClaimedCard; error?: string };

const explorerUrl = SUPPORTED_CHAINS[gnosis.id]?.blockExplorers?.default?.url ?? "https://gnosisscan.io";

const cardQueryKey = (code: string) => ["useCreditCard", code];

// Exponential ease-out for the reveal: fast at first, settling softly on the final amount.
const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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
    if (!animate || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setValue(Math.round(target * (1 - 2 ** (-10 * progress))));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setValue(target);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);
  return value;
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Groups a checksummed address in fours, so it can be compared against a wallet at a glance. */
function groupAddress(address: string) {
  return getAddress(address)
    .slice(2)
    .match(/.{1,4}/g)!
    .join(" ");
}

function CardShell({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <div className="container-fluid py-[24px] lg:py-[65px]">
      <div
        className="max-w-[480px] mx-auto card shadow-sm border border-separator-100 bg-base-100 p-5 lg:p-8 space-y-6"
        aria-busy={busy || undefined}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The printed card, on screen: serial and campaign on top, the amount sealed until the claim.
 * `amount` undefined keeps it sealed; `pending` pulses the seal while the claim is in flight.
 */
function CardFace({
  serial,
  campaignName,
  amount,
  revealing = false,
  pending = false,
}: {
  serial?: string;
  campaignName?: string | null;
  amount?: number;
  revealing?: boolean;
  pending?: boolean;
}) {
  const [sharp, setSharp] = useState(!revealing);
  useEffect(() => {
    if (!revealing) return;
    const frame = requestAnimationFrame(() => setSharp(true));
    return () => cancelAnimationFrame(frame);
  }, [revealing]);
  const counted = useCountUp(amount ?? 0, revealing);

  return (
    <div className="relative overflow-hidden rounded-xl bg-purple-dark text-white shadow-[0_12px_32px_-12px_rgba(89,9,126,0.55)] aspect-[2] sm:aspect-[1.7] p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <SeerLogo width="76px" height="35px" className="-ml-1 -mt-1 shrink-0" />
        <div className="text-right min-w-0">
          {serial && <p className="font-mono text-[13px] tracking-wide tabular-nums text-white/85">{serial}</p>}
          {campaignName && <p className="text-[13px] text-white/75 truncate">{campaignName}</p>}
        </div>
      </div>

      <div>
        <p className="text-[13px] text-white/75">Trading credits</p>
        {amount === undefined ? (
          <p className="text-[44px] leading-none font-semibold tracking-tight">
            <span className="sr-only">Amount hidden until you claim</span>
            <span
              aria-hidden
              className={clsx("inline-block select-none blur-[10px] opacity-70", pending && "animate-pulse")}
            >
              $88
            </span>
          </p>
        ) : (
          <p className="text-[44px] leading-none font-semibold tracking-tight tabular-nums">
            <span className="sr-only">{formatUsd(amount)}</span>
            <span
              aria-hidden
              className="inline-block motion-reduce:!transition-none motion-reduce:!blur-none"
              style={{
                filter: sharp ? "blur(0)" : "blur(10px)",
                opacity: sharp ? 1 : 0.6,
                transition: `filter 700ms ${EASE_OUT_EXPO}, opacity 700ms ${EASE_OUT_EXPO}`,
              }}
            >
              {formatUsd(counted)}
            </span>
          </p>
        )}
      </div>

      {/* The Seer bird, oversized and faint, so the face reads as a card rather than a panel. The wordmark
          half of the logo sits past the right edge and is clipped away. */}
      <SeerLogo
        width="300px"
        height="139px"
        fill="rgba(255,255,255,0.06)"
        className="pointer-events-none absolute -right-[176px] -bottom-8"
      />
    </div>
  );
}

function StateMessage({
  title,
  children,
  action,
  card,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  card?: CardInfo;
}) {
  return (
    <CardShell>
      {card && <CardFace serial={card.serial} campaignName={card.campaignName} />}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-balance">{title}</h1>
        <div className="text-base-content/80 space-y-2">{children}</div>
      </div>
      {action}
    </CardShell>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-purple-primary dark:text-purple-secondary underline underline-offset-2 decoration-1 hover:decoration-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary rounded-sm"
    >
      {children}
    </a>
  );
}

function claimErrorMessage(error: Error) {
  if (error.message === "Invalid address") {
    return "That address is not valid. Check it and try again.";
  }
  return "We could not reach Seer to claim your card. Check your connection and try again; the card is still yours to claim.";
}

function ClaimForm({ code, card, onClaimed }: { code: string; card?: CardInfo; onClaimed: () => void }) {
  const { address: connectedAddress } = useAccount();
  const { open } = useWeb3Modal();
  const [manualAddress, setManualAddress] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showAddressError, setShowAddressError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLHeadingElement>(null);
  const claim = useClaimCreditCard(code, onClaimed);

  const typingAddress = useManual || !connectedAddress;
  const trimmed = manualAddress.trim();
  const recipient = typingAddress ? trimmed : (connectedAddress ?? "");
  const isValidRecipient = isAddress(recipient);
  const refusal = claim.data && claim.data.state !== "claimed" ? claim.data.error : undefined;
  const errorText = claim.error ? claimErrorMessage(claim.error) : refusal;

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const continueWithAddress = () => {
    if (!isValidRecipient) {
      setShowAddressError(true);
      inputRef.current?.focus();
      return;
    }
    setConfirming(true);
  };

  const pasteAddress = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      setManualAddress(text);
      setShowAddressError(!!text && !isAddress(text));
    } catch {
      inputRef.current?.focus();
    }
  };

  const canPaste = typeof navigator !== "undefined" && !!navigator.clipboard?.readText;
  const rangeText =
    card?.minUsd != null && card?.maxUsd != null
      ? `between ${formatUsd(card.minUsd)} and ${formatUsd(card.maxUsd)}`
      : "a surprise amount";

  return (
    <CardShell>
      <CardFace serial={card?.serial} campaignName={card?.campaignName} pending={claim.isPending} />

      {confirming && isValidRecipient ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 ref={confirmRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
              Send your credits here?
            </h1>
            <p className="text-base-content/80">Credits go out on Gnosis Chain and cannot be sent back.</p>
          </div>
          <div className="rounded-lg bg-base-200 p-4 space-y-1">
            <p className="text-sm text-base-content/70">Recipient on Gnosis Chain</p>
            <p className="font-mono text-[15px] leading-relaxed tracking-wide break-words">
              <span className="text-base-content/70">0x</span> {groupAddress(recipient)}
            </p>
          </div>
          <p className="text-sm text-base-content/80">
            Use a wallet you control. An exchange deposit address may never credit these tokens, and the card cannot be
            claimed again.
          </p>
          {errorText && (
            <p role="alert" className="text-sm text-error-primary">
              {errorText}
            </p>
          )}
          <div className="space-y-2">
            <Button
              text={claim.isPending ? "Revealing…" : "Reveal my credits"}
              type="button"
              className="w-full"
              isLoading={claim.isPending}
              onClick={() => claim.mutate(recipient)}
            />
            <Button
              text="Change address"
              type="button"
              variant="secondary"
              className="w-full"
              disabled={claim.isPending}
              onClick={() => {
                claim.reset();
                setConfirming(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-balance">Reveal your Seer credits</h1>
            <p className="text-base-content/80">
              This card holds {rangeText} in credits for trading on Seer prediction markets. Choose where to send them,
              then reveal the amount.
            </p>
          </div>

          {!typingAddress ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-base-200 p-4 space-y-1">
                <p className="text-sm text-base-content/70">Sending to your connected wallet</p>
                <p className="font-mono text-[15px] break-all">{connectedAddress}</p>
              </div>
              {errorText && (
                <p role="alert" className="text-sm text-error-primary">
                  {errorText}
                </p>
              )}
              <Button
                text={claim.isPending ? "Revealing…" : "Reveal my credits"}
                type="button"
                className="w-full"
                isLoading={claim.isPending}
                onClick={() => claim.mutate(recipient)}
              />
              <Button
                text="Send to another address"
                type="button"
                variant="secondary"
                className="w-full"
                disabled={claim.isPending}
                onClick={() => setUseManual(true)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {!connectedAddress && (
                <>
                  <Button text="Connect a wallet" type="button" className="w-full" onClick={() => open()} />
                  <div className="flex items-center gap-3 text-sm text-base-content/70" aria-hidden>
                    <span className="h-px flex-1 bg-separator-100" />
                    or
                    <span className="h-px flex-1 bg-separator-100" />
                  </div>
                </>
              )}
              <form
                className="space-y-3"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  continueWithAddress();
                }}
              >
                <div className="space-y-1">
                  <label htmlFor="claim-address" className="text-sm font-semibold block">
                    Paste a Gnosis Chain address
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        ref={inputRef}
                        id="claim-address"
                        className="w-full font-mono"
                        placeholder="0x…"
                        value={manualAddress}
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-invalid={showAddressError && !isValidRecipient}
                        aria-describedby={showAddressError && !isValidRecipient ? "claim-address-error" : undefined}
                        onChange={(e) => {
                          setManualAddress(e.target.value);
                          if (showAddressError && isAddress(e.target.value.trim())) {
                            setShowAddressError(false);
                          }
                        }}
                        onBlur={() => setShowAddressError(!!trimmed && !isValidRecipient)}
                      />
                    </div>
                    {canPaste && (
                      <Button
                        text="Paste"
                        type="button"
                        variant="secondary"
                        className="!min-w-0"
                        onClick={pasteAddress}
                      />
                    )}
                  </div>
                  {showAddressError && !isValidRecipient && (
                    <p id="claim-address-error" className="text-sm text-error-primary">
                      {trimmed
                        ? "This is not a valid address. It should start with 0x and have 42 characters."
                        : "Paste an address first."}
                    </p>
                  )}
                </div>
                <Button
                  text="Continue"
                  type="submit"
                  variant={connectedAddress ? "primary" : "secondary"}
                  className="w-full"
                />
              </form>
              {connectedAddress && (
                <Button
                  text="Use my connected wallet"
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setUseManual(false);
                    setShowAddressError(false);
                  }}
                />
              )}
            </div>
          )}

          <div className="text-sm text-base-content/70 space-y-1 border-t border-separator-100 pt-4">
            <p>Free to claim: no signature and no gas fees. Each card can be claimed once.</p>
            {!connectedAddress && (
              <p>
                New to wallets? <TextLink href={paths.beginnerGuide()}>Find one to get started</TextLink>
              </p>
            )}
          </div>
        </div>
      )}
    </CardShell>
  );
}

function formatCredits(credits: string) {
  return Number(credits).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ClaimedView({ card, justClaimed }: { card: ClaimedCard; justClaimed: boolean }) {
  const { address: connectedAddress } = useAccount();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = card.status === "pending" || card.status === "sent";
  const recipient = card.claimedBy ? shortenAddress(card.claimedBy) : "your wallet";
  const isOwner =
    justClaimed || (!!connectedAddress && connectedAddress.toLowerCase() === card.claimedBy?.toLowerCase());

  useEffect(() => {
    if (justClaimed) headingRef.current?.focus();
  }, [justClaimed]);

  const creditPrice = card.credits && Number(card.credits) > 0 ? card.amountUsd / Number(card.credits) : null;

  if (!isOwner) {
    return (
      <CardShell>
        <CardFace serial={card.serial} campaignName={card.campaignName} amount={card.amountUsd} />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">This card was already claimed</h1>
          <p className="text-base-content/80">
            {card.claimedAt ? `Claimed on ${formatDate(card.claimedAt)}` : "Claimed"}
            {card.claimedBy && (
              <>
                {" "}
                by <span className="font-mono">{shortenAddress(card.claimedBy)}</span>
              </>
            )}
            . If that was you, connect that wallet to see your delivery.
          </p>
        </div>
        <LinkButton text="Explore Seer markets" to="/" variant="secondary" className="w-full" />
      </CardShell>
    );
  }

  const title =
    card.status === "confirmed"
      ? "Your credits are in your wallet"
      : card.status === "failed"
        ? "Your credits did not arrive"
        : "Sending your credits";

  return (
    <CardShell>
      <CardFace serial={card.serial} campaignName={card.campaignName} amount={card.amountUsd} revealing={justClaimed} />

      <div className="space-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {title}
        </h1>
        {card.credits && (
          <p className="text-base-content/80">
            {formatUsd(card.amountUsd)} became <strong>{formatCredits(card.credits)} Seer credits</strong>.
            {creditPrice && ` Each credit is backed by 1 sDAI, worth about $${creditPrice.toFixed(2)} today.`}
          </p>
        )}
      </div>

      <output aria-live="polite" className="block rounded-lg bg-base-200 p-4 space-y-2 text-[15px]">
        {inFlight && (
          <p className="flex items-start gap-2">
            <span className="loading loading-spinner loading-xs mt-1 shrink-0" aria-hidden />
            <span>Sending to {recipient}. This usually takes less than a minute.</span>
          </p>
        )}
        {card.status === "confirmed" && (
          <p className="flex items-start gap-2">
            <CheckCircleIcon width={16} height={16} className="mt-1 shrink-0 text-success-primary" aria-hidden />
            <span>
              Delivered to {recipient}.{" "}
              {card.txHash && <TextLink href={`${explorerUrl}/tx/${card.txHash}`}>View transaction</TextLink>}
            </span>
          </p>
        )}
        {card.status === "failed" && (
          <p>
            The transfer to {recipient} did not go through, and the card stays reserved for that address. Message us on{" "}
            <TextLink href={paths.discord()}>Discord</TextLink> with card{" "}
            <span className="font-mono">{card.serial}</span> and we will send it again.
          </p>
        )}
        {(card.dripStatus === "pending" || card.dripStatus === "sent") && (
          <p className="text-base-content/80">A little xDAI to pay gas fees is on its way too.</p>
        )}
        {card.dripStatus === "confirmed" && (
          <p className="text-base-content/80">We also sent a little xDAI so you can pay gas fees.</p>
        )}
        {card.dripStatus === "failed" && card.status !== "failed" && (
          <p className="text-base-content/80">
            The xDAI for gas fees did not go through. Message us on <TextLink href={paths.discord()}>Discord</TextLink>{" "}
            with card <span className="font-mono">{card.serial}</span> if you need it.
          </p>
        )}
      </output>

      {card.status === "confirmed" && <LinkButton text="Start trading" to="/" className="w-full" />}
    </CardShell>
  );
}

function LoadingCard() {
  return (
    <CardShell busy>
      <div className="shimmer-container aspect-[2] sm:aspect-[1.7] rounded-xl" aria-hidden />
      <div className="space-y-3" aria-hidden>
        <div className="shimmer-container h-8 w-3/4 rounded" />
        <div className="shimmer-container h-5 w-full rounded" />
        <div className="shimmer-container h-5 w-2/3 rounded" />
      </div>
      <div className="shimmer-container h-[45px] rounded" aria-hidden />
      {/* Last, so the visually hidden status does not pick up the stack's top margin. */}
      <output className="sr-only">Loading your card…</output>
    </CardShell>
  );
}

function ClaimCardPage() {
  const { routeParams } = usePageContext();
  const code = routeParams.code ?? "";
  const { data, isLoading, error, refetch, isRefetching } = useCreditCard(code);
  // Only the visit that claims gets the reveal; reopening the link shows the result straight away.
  const [justClaimed, setJustClaimed] = useState(false);

  if (isLoading) {
    return <LoadingCard />;
  }

  if (error || !data) {
    return (
      <StateMessage
        title="We could not load this card"
        action={
          <Button
            text="Try again"
            type="button"
            className="w-full"
            isLoading={isRefetching}
            onClick={() => refetch()}
          />
        }
      >
        <p>Check your connection and try again. Nothing has been claimed yet.</p>
      </StateMessage>
    );
  }

  if (data.state === "not_found") {
    return (
      <StateMessage
        title="This card link does not work"
        action={<LinkButton text="Explore Seer markets" to="/" variant="secondary" className="w-full" />}
      >
        <p>
          The link does not match any Seer card. Scan the QR code again and make sure the whole link opened in your
          browser.
        </p>
      </StateMessage>
    );
  }

  if (data.state === "inactive") {
    return (
      <StateMessage title="This card is not active yet" card={data.card}>
        <p>
          Cards are switched on when they are handed out, and nobody can claim this one until then. Open this link again
          later.
        </p>
        <p>
          Still inactive after the event? Ask us on <TextLink href={paths.discord()}>Discord</TextLink>
          {data.card?.serial && (
            <>
              {" "}
              with card <span className="font-mono">{data.card.serial}</span>
            </>
          )}
          .
        </p>
      </StateMessage>
    );
  }

  if (data.state === "claimed") {
    return <ClaimedView card={data.data} justClaimed={justClaimed} />;
  }

  return (
    <ClaimForm
      code={code}
      card={data.state === "valid" ? data.card : undefined}
      onClaimed={() => setJustClaimed(true)}
    />
  );
}

export default ClaimCardPage;
