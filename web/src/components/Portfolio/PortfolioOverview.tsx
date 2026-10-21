import { formatDeltaPercent, signedTone } from "@/lib/formatUsd";

const REVIEW_RANGES = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;
export type ReviewRange = (typeof REVIEW_RANGES)[number];
const usd = (n: number, signed = false) =>
  `${signed && n >= 0 ? "+" : n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PortfolioOverview({
  value,
  delta,
  deltaPercent,
  positionsValue,
  available,
  pnl,
  pnlNotComputed = false,
  period,
  onPeriodChange,
  pending = false,
  error,
  retry,
  supported = REVIEW_RANGES,
}: {
  value?: number;
  delta?: number;
  deltaPercent?: number;
  positionsValue?: number;
  available?: number;
  pnl?: number;
  /** The P&L job has not produced a figure for this wallet yet. Distinct from a failed request, which is `error`. */
  pnlNotComputed?: boolean;
  period: ReviewRange;
  onPeriodChange: (period: ReviewRange) => void;
  pending?: boolean;
  error?: string;
  retry?: () => void;
  supported?: readonly ReviewRange[];
}) {
  const deltaTone = delta === undefined ? undefined : signedTone(delta);
  const deltaPercentLabel = deltaPercent === undefined ? undefined : formatDeltaPercent(deltaPercent);
  return (
    <section className="portfolio-overview" aria-label="Portfolio overview" aria-busy={pending}>
      <div className="portfolio-balance">
        <p className="portfolio-muted">
          Portfolio value <small>USD</small>
        </p>
        <div className="portfolio-total">{pending ? "Loading…" : value === undefined ? "Unavailable" : usd(value)}</div>
        {deltaTone === "flat" && <p className="portfolio-muted">No value change today</p>}
        {delta !== undefined && deltaTone !== "flat" && (
          <p className={deltaTone === "down" ? "portfolio-loss" : "portfolio-gain"}>
            {usd(delta, true)}
            {deltaPercentLabel ? ` (${deltaPercentLabel})` : ""} <span className="portfolio-muted">today</span>
          </p>
        )}
        <dl className="portfolio-breakdown">
          <div>
            <dt>Positions</dt>
            <dd>{positionsValue === undefined ? (pending ? "-" : "Not available") : usd(positionsValue)}</dd>
          </div>
          <div>
            <dt>Available balance</dt>
            <dd>{available === undefined ? (pending ? "-" : "Not available") : usd(available)}</dd>
          </div>
        </dl>
        <p className="portfolio-note">Positions + collateral, valued in USD</p>
      </div>
      <div className="portfolio-performance">
        <div className="portfolio-performance-heading">
          <div>
            <p className="portfolio-muted">Trading profit / loss</p>
            <p className={`portfolio-pnl ${pnl !== undefined && pnl < 0 ? "portfolio-loss" : "portfolio-gain"}`}>
              {pending ? (
                "Loading…"
              ) : pnlNotComputed ? (
                <span title="The P&L refresh job has not processed this wallet yet">Not computed yet</span>
              ) : pnl === undefined ? (
                "Not available"
              ) : (
                usd(pnl, true)
              )}
            </p>
            <p className="portfolio-muted">{period === "All" ? "All time" : period} · USD</p>
          </div>
          <div className="portfolio-ranges" aria-label="Profit and loss time range">
            {REVIEW_RANGES.map((range) => (
              <button
                type="button"
                key={range}
                disabled={!supported.includes(range)}
                title={!supported.includes(range) ? "This period is not supplied by the API yet" : undefined}
                aria-pressed={range === period}
                onClick={() => onPeriodChange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="portfolio-performance-error" role="alert">
            <span>{error}</span>
            {retry && (
              <button type="button" onClick={retry}>
                Try again
              </button>
            )}
          </div>
        )}
        <p className="portfolio-performance-note">Excludes deposits & withdrawals</p>
      </div>
    </section>
  );
}
