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

export function Username({ details }: { details?: DiscussionUser | null }) {
  const { displayName } = useAddressDisplay(details?.address);
  return <>{displayName ?? "-"}</>;
}

export function UserBadge({ details }: { details?: DiscussionUser | null }) {
  const { displayName } = useAddressDisplay(details?.address);
  if (!displayName) return null;
  return (
    <div className="rounded-lg bg-sd-badge-bg px-2 py-1 text-[12px] font-medium text-sd-badge-color">{displayName}</div>
  );
}
