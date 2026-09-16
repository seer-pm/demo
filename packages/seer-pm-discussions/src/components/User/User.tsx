import { useEffect, useState } from "react";
import { useDisplayName } from "../../hooks/useDisplayName";
import type { DiscussionUser } from "../../types";
import { addressUsername } from "../../utils/addressUsername";
import { addressAccent } from "../../utils/linkify";
import { EnsIcon } from "../EnsIcon/EnsIcon";

/**
 * Label for a discussion user without resolving ENS.
 *
 * Used where a name is needed as a plain string (avatar alt text). Deliberately skips ENS so that
 * rendering an avatar does not fire a reverse lookup per post.
 */
function displayNameFromDetails(details: DiscussionUser): string {
  return details.username ?? addressUsername(details.address);
}

/** Renders a deterministic wallet avatar linked to the user's profile when available. */
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
          aria-label={details ? `View ${displayNameFromDetails(details)} profile` : "View profile"}
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

/** Renders a verified primary ENS name as a link to the ENS application. */
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

/** Renders a user's identity: Seer username, else verified ENS primary name, else a generated nickname. */
export function Username({ details }: { details?: DiscussionUser | null }) {
  const { label, source, ensName } = useDisplayName({
    address: details?.address,
    username: details?.username,
  });
  const href = details?.profileHref ?? null;
  if (!details) return <>-</>;

  // Only a username label leaves the ENS name unshown, so only it needs the separate badge.
  const showEnsBadge = source === "username" && Boolean(ensName);

  const labelNode = (
    <span className="inline-flex min-w-0 items-center gap-1">
      {source === "ens" && (
        <span className="shrink-0" title="Verified ENS primary name" aria-hidden="true">
          <EnsIcon />
        </span>
      )}
      <span className={`truncate${source === "generated" ? " text-sd-color-secondary" : ""}`}>
        {source === "username" ? `@${label}` : label}
      </span>
    </span>
  );

  return (
    <span
      className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5${showEnsBadge ? " sd-user-has-ens" : ""}`}
    >
      {href ? (
        <a
          href={href}
          className="min-w-0 truncate rounded-sm font-medium text-sd-color-main no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sd-color-active"
        >
          {labelNode}
        </a>
      ) : (
        <span className="min-w-0 truncate font-medium">{labelNode}</span>
      )}
      {showEnsBadge && ensName && (
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
