import { EnsIcon } from "@seer-pm/discussions";
import clsx from "clsx";

/** Links a verified primary ENS name using the web application's badge styling. */
export function EnsBadge({ name, className }: { name: string; className?: string }) {
  return (
    <a
      href={`https://app.ens.domains/${encodeURIComponent(name)}`}
      target="_blank"
      rel="noreferrer"
      title="Verified ENS primary name"
      className={clsx(
        "inline-flex max-w-[160px] shrink items-center gap-1 rounded-full border border-[#e8e4f0] bg-[#fbf8ff] px-2 py-0.5 text-[11px] font-medium leading-4 text-[#5c6570] no-underline hover:text-[#9747ff]",
        className,
      )}
    >
      <EnsIcon />
      <span className="truncate">{name}</span>
    </a>
  );
}
