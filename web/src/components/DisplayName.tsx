import { EnsIcon, useDisplayName } from "@seer-pm/discussions";
import clsx from "clsx";

/**
 * Renders a wallet's identity: a chosen Seer username (`@name`), else a verified ENS primary name,
 * else a nickname generated from the address.
 *
 * The `@` prefix is reserved for stored usernames, because they are the only labels
 * `paths.portfolioUsername()` can resolve — an `@` on a generated name would promise a route that
 * does not exist. Callers that also need the ENS badge should use `useDisplayName` directly.
 */
export function DisplayName({
  address,
  username,
  className,
}: {
  address?: string | null;
  username?: string | null;
  className?: string;
}) {
  const { label, source } = useDisplayName({ address, username });

  return (
    <span className={clsx("inline-flex min-w-0 items-center gap-1", className)} title={address ?? undefined}>
      {source === "ens" && (
        <span className="shrink-0" title="Verified ENS primary name" aria-hidden="true">
          <EnsIcon />
        </span>
      )}
      <span className={clsx("truncate", source === "generated" && "text-black-secondary-fg")}>
        {source === "username" ? `@${label}` : label}
      </span>
    </span>
  );
}
