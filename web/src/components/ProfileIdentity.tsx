import { CopyButton } from "@/components/CopyButton";
import { EnsBadge } from "@/components/EnsBadge";
import { Union } from "@/lib/icons";
import { shortenAddress } from "@/lib/utils";
import { EnsIcon, useDisplayName } from "@seer-pm/discussions";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Address } from "viem";

/**
 * A wallet's identity block: avatar, resolved display name, literal address, and ENS badge.
 *
 * Shared by the portfolio header and the account page so the same person cannot render in two
 * visual languages depending on which route you arrived from.
 *
 * The name waits for the caller's username lookup before it renders. This is the header of the page
 * a person manages their identity on, and a label that arrives in stages renames them in front of
 * themselves.
 *
 * It deliberately does not wait on the ENS reverse lookup as well. That request depends on a
 * mainnet RPC the app does not control, so gating on it leaves a permanent skeleton wherever the
 * lookup never answers. An ENS name that arrives late upgrades the label in place, which is the
 * trade-off `resolveDisplayName` already documents.
 *
 * `nameAs` exists because the person is the subject of `/portfolio` (an `h1`) but only supporting
 * detail on `/profile`, where the page's own heading is "Account". Rendering a person's name as a
 * heading on a page it does not title puts it in the screen-reader outline as a peer of the
 * section headings around it.
 */
export function ProfileIdentity({
  address,
  username,
  isSelf,
  isLoading,
  nameAs = "p",
  children,
  className,
}: {
  address: Address;
  username?: string | null;
  isSelf?: boolean;
  /** Whether the caller's username lookup is still in flight. */
  isLoading?: boolean;
  nameAs?: "h1" | "p";
  children?: ReactNode;
  className?: string;
}) {
  const { label, source, ensName } = useDisplayName({ address, username });
  const NameTag = nameAs;

  return (
    <div className={clsx("flex gap-4 min-w-0", className)}>
      <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
        <Union />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 min-w-0 mb-2">
          {isLoading ? (
            <>
              <span className="sr-only">Loading name</span>
              <div className="shimmer-container h-6 w-40 max-w-full" aria-hidden />
            </>
          ) : (
            <NameTag className="text-[18px] font-semibold text-base-content truncate flex items-center gap-1 min-w-0">
              {source === "ens" ? (
                <span className="shrink-0" title="Verified ENS primary name" aria-hidden="true">
                  <EnsIcon />
                </span>
              ) : null}
              <span className={clsx("truncate", source === "generated" && "text-black-secondary-fg")}>
                {source === "username" ? `@${label}` : label}
              </span>
            </NameTag>
          )}
          <CopyButton textToCopy={address} size={16} className="shrink-0 min-h-11 min-w-11 text-black-primary" />
          {isSelf ? <span className="text-xs text-purple-primary font-medium shrink-0">You</span> : null}
        </div>
        {/* The label above may be a generated nickname, so the address is shown unconditionally as
            the only literal identifier on screen. */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs text-black-primary font-mono" title={address}>
            {shortenAddress(address)}
          </span>
          {source === "username" && ensName ? <EnsBadge name={ensName} /> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
