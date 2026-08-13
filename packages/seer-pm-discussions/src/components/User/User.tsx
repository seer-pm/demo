import { useEffect, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import { useEnsName } from "wagmi";
import type { DiscussionUser } from "../../types";
import { addressAccent } from "../../utils/linkify";
import { EnsIcon } from "../EnsIcon/EnsIcon";

export function UserPfp({ details, height = 44 }: { details?: DiscussionUser | null; height?: number }) {
  const accent = addressAccent(details?.address);
  const href = details?.profileHref ?? null;
  const avatar = (
    <span
      className="inline-block overflow-hidden rounded-full"
      style={{
        height,
        width: height,
        background: accent?.background ?? "var(--sd-bg-tertiary)",
        color: accent?.color ?? "var(--sd-color-active)",
      }}
      aria-hidden="true"
    >
      <svg style={{ width: "100%", height: "100%" }} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  );

  return (
    <div className="relative">
      {href ? (
        <a
          href={href}
          className="inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sd-color-active"
          aria-label={details ? `View @${details.username} profile` : "View profile"}
        >
          {avatar}
        </a>
      ) : (
        avatar
      )}
    </div>
  );
}

/** Displays an address label that copies the full address when clicked. */
export function CopyableAddress({
  address,
  shortAddress,
  className = "text-sd-color-secondary",
}: {
  address: string;
  shortAddress: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  }

  return (
    <button
      type="button"
      className={`shrink-0 rounded-sm font-normal underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      title={copied ? "Copied" : address}
      aria-label={copied ? "Address copied" : `Copy address ${address}`}
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
    >
      {copied ? "Copied" : shortAddress}
    </button>
  );
}

function EnsBadge({ name }: { name: string }) {
  return (
    <a
      href={`https://app.ens.domains/${encodeURIComponent(name)}`}
      target="_blank"
      rel="noreferrer"
      title="Verified ENS primary name"
      className="inline-flex max-w-[160px] shrink items-center gap-1 rounded-full border border-sd-border-main bg-sd-bg-secondary px-2 py-0.5 text-[11px] font-medium leading-4 text-sd-color-secondary no-underline hover:text-sd-color-active"
    >
      <EnsIcon />
      <span className="truncate">{name}</span>
    </a>
  );
}

export function Username({ details }: { details?: DiscussionUser | null }) {
  const address = details?.address;
  const normalizedAddress = address && isAddress(address) ? (address.toLowerCase() as Address) : undefined;
  const { data: ensName } = useEnsName({
    address: normalizedAddress,
    chainId: 1,
    query: { enabled: Boolean(normalizedAddress) },
  });
  const href = details?.profileHref ?? null;
  if (!details) return <>-</>;

  return (
    <span
      className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5${ensName ? " sd-user-has-ens" : ""}`}
    >
      {href ? (
        <a
          href={href}
          className="truncate rounded-sm font-medium text-sd-color-main no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sd-color-active"
        >
          {details.username}
        </a>
      ) : (
        <span className="truncate font-medium">{details.username}</span>
      )}
      {ensName && (
        <>
          <span className="shrink-0 text-sd-color-secondary" aria-hidden="true">
            ·
          </span>
          <EnsBadge name={ensName} />
        </>
      )}
    </span>
  );
}
