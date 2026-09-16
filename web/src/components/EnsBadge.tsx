import { EnsIcon } from "@seer-pm/discussions";
import clsx from "clsx";

/**
 * Links a verified primary ENS name using the web application's badge styling.
 *
 * Colours come from tokens, which resolve per theme: the badge sits on both the light and the dark
 * card, and each surface needs its own fill, border and text value.
 */
export function EnsBadge({ name, className }: { name: string; className?: string }) {
  return (
    <a
      href={`https://app.ens.domains/${encodeURIComponent(name)}`}
      target="_blank"
      rel="noreferrer"
      title="Verified ENS primary name"
      className={clsx(
        "inline-flex max-w-[160px] shrink items-center gap-1 rounded-full border border-purple-primary/25 bg-purple-primary/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-black-primary no-underline hover:text-purple-primary",
        className,
      )}
    >
      <EnsIcon />
      <span className="truncate">{name}</span>
    </a>
  );
}
