import { TwitterIcon } from "@/lib/icons";
import clsx from "clsx";

/**
 * Links an OAuth-verified X account, matching `EnsBadge` so both verified identities read as one family.
 *
 * The icon takes `currentColor` because the badge sits on both the light and the dark card.
 */
export function XBadge({ handle, className }: { handle: string; className?: string }) {
  return (
    <a
      href={`https://x.com/${encodeURIComponent(handle)}`}
      target="_blank"
      rel="noreferrer"
      title="Verified X account"
      className={clsx(
        "inline-flex max-w-[160px] shrink items-center gap-1 rounded-full border border-purple-primary/25 bg-purple-primary/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-black-primary no-underline hover:text-purple-primary",
        className,
      )}
    >
      <TwitterIcon width={11} height={11} fill="currentColor" />
      <span className="truncate">@{handle}</span>
    </a>
  );
}
