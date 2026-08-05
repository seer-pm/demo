import { useEffect, useState } from "react";
import useAddressDisplay from "../../hooks/useAddressDisplay";
import type { DiscussionUser } from "../../types";
import { addressAccent } from "../../utils/linkify";

export function UserPfp({ details, height = 44 }: { details?: DiscussionUser | null; height?: number }) {
  const accent = addressAccent(details?.address);

  return (
    <div className="relative">
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
    </div>
  );
}

function CopyableAddress({ address, shortAddress }: { address: string; shortAddress: string }) {
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
      className="shrink-0 rounded-sm font-normal text-sd-color-secondary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sd-color-active"
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

function AddressLabel({
  displayName,
  shortAddress,
  address,
}: {
  displayName: string;
  shortAddress: string | null;
  address: string | null;
}) {
  return (
    <>
      <span className="truncate">{displayName}</span>
      {shortAddress && address && (
        <>
          <span className="mx-1.5 shrink-0 text-sd-color-secondary" aria-hidden="true">
            ·
          </span>
          <CopyableAddress address={address} shortAddress={shortAddress} />
        </>
      )}
    </>
  );
}

export function Username({ details }: { details?: DiscussionUser | null }) {
  const { displayName, shortAddress, address } = useAddressDisplay(details?.address);
  if (!displayName) return <>-</>;

  return (
    <span className="inline-flex min-w-0 max-w-full items-center">
      <AddressLabel displayName={displayName} shortAddress={shortAddress} address={address} />
    </span>
  );
}
