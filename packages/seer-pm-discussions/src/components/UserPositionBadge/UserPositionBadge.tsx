import { formatUnits } from "viem";
import type { DiscussionPosition, DiscussionUserPositionBadgeProps } from "../../types";
import Tooltip from "../Tooltip/Tooltip";

const OUTCOME_TOKEN_DECIMALS = 18;

function formatBalance(balance: bigint): string {
  const value = Number(formatUnits(balance, OUTCOME_TOKEN_DECIMALS));
  if (!value) return "0";
  if (value <= 0.001) return "<0.001";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
  return value.toFixed(2);
}

function formatPosition({ outcome, balance }: DiscussionPosition): string {
  return `${outcome}: ${formatBalance(balance)} shares`;
}

/** Default Seer position badge shown beside a commenter's address. */
export default function UserPositionBadge({ positions }: DiscussionUserPositionBadgeProps) {
  if (positions.length === 0) return null;

  if (positions.length === 1) {
    const [position] = positions;
    const label = formatPosition(position);
    return (
      <span
        className="max-w-40 shrink truncate rounded-full border border-sd-color-active bg-sd-color-active px-2 py-0.5 text-[11px] font-medium leading-4 text-white"
        title={label}
      >
        {position.outcome} {formatBalance(position.balance)}
      </span>
    );
  }

  return <MultiplePositionsBadge positions={positions} />;
}

function MultiplePositionsBadge({ positions }: { positions: readonly DiscussionPosition[] }) {
  const label = `Multiple positions: ${positions.map(formatPosition).join(", ")}`;

  return (
    <Tooltip
      trigger={
        <button
          type="button"
          className="max-w-40 shrink cursor-help truncate rounded-full border border-sd-color-active bg-sd-color-active px-2 py-0.5 text-[11px] font-medium leading-4 text-white"
          aria-label={label}
        >
          Multiple Positions
        </button>
      }
      content={
        <div style={{ minWidth: 160 }}>
          <p style={{ margin: "0 0 6px" }}>Positions held</p>
          <ul style={{ display: "grid", gap: 4, margin: 0, padding: 0, listStyle: "none" }}>
            {positions.map(({ tokenId, outcome, balance }) => (
              <li key={tokenId} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontWeight: 400 }}>
                <span>{outcome}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatBalance(balance)}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
