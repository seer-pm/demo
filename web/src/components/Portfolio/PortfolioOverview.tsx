import { formatDeltaPercent, signedTone } from "@/lib/formatUsd";
import { useId, useState } from "react";

const REVIEW_RANGES = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;
export type ReviewRange = (typeof REVIEW_RANGES)[number];
export type PerformanceSeries = {
  points: number[];
  start: string;
  end: string;
  realized?: number;
  unrealized?: number;
};
const usd = (n: number, signed = false) =>
  `${signed && n >= 0 ? "+" : n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PerformanceChart({
  series,
  onInspect,
  unit = "USD",
}: { series: PerformanceSeries; onInspect: (value?: number, date?: string) => void; unit?: "USD" | "SEER" }) {
  const id = useId();
  const format = (value: number) =>
    unit === "USD" ? usd(value, true) : `${value.toLocaleString("en-US", { maximumFractionDigits: 3 })} SEER`;
  const [active, setActive] = useState<number>();
  const values = series.points;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const padding = (high - low) * 0.15 || 1;
  const x = (i: number) => 8 + (i / Math.max(1, values.length - 1)) * 622;
  const y = (v: number) => 16 + ((high + padding - v) / (high - low + padding * 2)) * 144;
  const date = (i: number) =>
    new Date(
      Date.parse(series.start) +
        (i / Math.max(1, values.length - 1)) * (Date.parse(series.end) - Date.parse(series.start)),
    ).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const inspect = (i?: number) => {
    setActive(i);
    onInspect(i === undefined ? undefined : values[i], i === undefined ? undefined : date(i));
  };
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <div
      className="portfolio-chart"
      role="slider"
      tabIndex={0}
      aria-label={`Explore ${unit === "USD" ? "profit and loss" : "allocation"} history with left and right arrow keys`}
      aria-valuemin={0}
      aria-valuemax={values.length - 1}
      aria-valuenow={active ?? values.length - 1}
      aria-valuetext={`${date(active ?? values.length - 1)}: ${format(values[active ?? values.length - 1])}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        inspect(
          Math.max(
            0,
            Math.min(
              values.length - 1,
              Math.round(((((e.clientX - r.left) / r.width) * 690 - 8) / 622) * (values.length - 1)),
            ),
          ),
        );
      }}
      onPointerLeave={() => inspect()}
      onBlur={() => inspect()}
      onKeyDown={(e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          inspect(
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? values.length - 1
                : Math.max(
                    0,
                    Math.min(values.length - 1, (active ?? values.length - 1) + (e.key === "ArrowLeft" ? -1 : 1)),
                  ),
          );
        }
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 690 195" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#7d33ff" stopOpacity=".25" />
            <stop offset="1" stopColor="#7d33ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[low, (low + high) / 2, high].map((v, i) => (
          <g key={i}>
            <line x1="8" x2="630" y1={y(v)} y2={y(v)} stroke="var(--seer-border)" />
            <text x="640" y={y(v) + 4}>
              {unit === "USD" ? `$${Math.round(v)}` : `${Math.round(v / 1000)}k`}
            </text>
          </g>
        ))}
        <polygon points={`8,168 ${points} 630,168`} fill={`url(#${id})`} />
        <polyline
          points={points}
          fill="none"
          stroke="var(--portfolio-accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {[0, Math.floor((values.length - 1) / 2), values.length - 1].map((i, j) => (
          <text key={j} x={x(i)} y="190" textAnchor={j === 0 ? "start" : j === 2 ? "end" : "middle"}>
            {date(i)}
          </text>
        ))}
        {active !== undefined && (
          <g>
            <line x1={x(active)} x2={x(active)} y1="10" y2="168" stroke="var(--seer-muted)" strokeDasharray="3 4" />
            <circle cx={x(active)} cy={y(values[active])} r="4" fill="var(--portfolio-accent)" />
          </g>
        )}
      </svg>
    </div>
  );
}

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
  series,
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
  series?: PerformanceSeries;
  pending?: boolean;
  error?: string;
  retry?: () => void;
  supported?: readonly ReviewRange[];
}) {
  const [inspection, setInspection] = useState<{ value: number; date?: string }>();
  const displayPnl = inspection?.value ?? pnl;
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
            <dd>{positionsValue === undefined ? "Not available" : usd(positionsValue)}</dd>
          </div>
          <div>
            <dt>Available balance</dt>
            <dd>{available === undefined ? "Not available" : usd(available)}</dd>
          </div>
        </dl>
        <p className="portfolio-note">Positions + collateral, valued in USD</p>
      </div>
      <div className="portfolio-performance">
        <div className="portfolio-chart-heading">
          <div>
            <p className="portfolio-muted">Trading profit / loss</p>
            <p
              className={`portfolio-pnl ${displayPnl !== undefined && displayPnl < 0 ? "portfolio-loss" : "portfolio-gain"}`}
            >
              {pending ? (
                "Loading…"
              ) : pnlNotComputed ? (
                <span title="The P&L refresh job has not processed this wallet yet">Not computed yet</span>
              ) : displayPnl === undefined ? (
                "Not available"
              ) : (
                usd(displayPnl, true)
              )}
            </p>
            <p className="portfolio-muted">{inspection?.date ?? (period === "All" ? "All time" : period)} · USD</p>
          </div>
          <div className="portfolio-ranges" aria-label="Profit and loss time range">
            {REVIEW_RANGES.map((range) => (
              <button
                type="button"
                key={range}
                disabled={!supported.includes(range)}
                title={!supported.includes(range) ? "This period is not supplied by the API yet" : undefined}
                aria-pressed={range === period}
                onClick={() => {
                  setInspection(undefined);
                  onPeriodChange(range);
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        {series ? (
          <PerformanceChart
            key={period}
            series={series}
            onInspect={(value, date) => setInspection(value === undefined ? undefined : { value, date })}
          />
        ) : (
          <div className="portfolio-chart-unavailable">
            <span>
              {error ?? (pending ? "Loading performance…" : "Historical P&L is not available for this account yet.")}
            </span>
            {error && retry && (
              <button type="button" onClick={retry}>
                Try again
              </button>
            )}
          </div>
        )}
        <div className="portfolio-chart-footer">
          <span>
            Realized <b>{series?.realized === undefined ? "Not available" : usd(series.realized, true)}</b>
          </span>
          <span>
            Unrealized <b>{series?.unrealized === undefined ? "Not available" : usd(series.unrealized, true)}</b>
          </span>
          <span>Excludes deposits & withdrawals</span>
        </div>
      </div>
    </section>
  );
}
