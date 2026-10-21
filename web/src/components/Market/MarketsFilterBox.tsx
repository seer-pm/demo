import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { CloseIcon } from "@/lib/icons";
import { MarketStatus, type VerificationStatus } from "@seer-pm/sdk";
import { type ReactNode, useState } from "react";
import { MARKET_STATUS_LABELS } from "./marketPresentation";

const MARKET_STATES = Object.values(MarketStatus).map((value) => ({ value, text: MARKET_STATUS_LABELS[value] }));
const VERIFICATION_STATES: { value: VerificationStatus; text: string }[] = [
  { value: "verified", text: "Verified" },
  { value: "verifying", text: "Verification in progress" },
  { value: "challenged", text: "Challenged" },
  { value: "not_verified", text: "Not verified" },
];
const NETWORKS = Object.values(SUPPORTED_CHAINS).map((chain) => ({ value: String(chain.id), text: chain.name }));

function FilterOptions({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: { value: string; text: string }[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="seer-filter-group">
      <legend>{label}</legend>
      {[{ value: "", text: "All" }, ...options].map((option) => (
        <label key={option.value} className="seer-filter-option">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={option.value ? value.includes(option.value) : value.length === options.length}
            onChange={(event) => {
              if (!option.value) return onChange(event.target.checked ? options.map((item) => item.value) : []);
              onChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value));
            }}
            aria-describedby={value.length === 0 ? `${id}-error` : undefined}
          />
          <span>{option.text}</span>
        </label>
      ))}
      {value.length === 0 && (
        <p id={`${id}-error`} className="seer-filter-error">
          Select at least one option.
        </p>
      )}
    </fieldset>
  );
}

function FilterToggle({
  children,
  checked,
  onChange,
}: {
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="seer-filter-option">
      <input
        type="checkbox"
        className="checkbox checkbox-sm"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function MarketsFilterBox({ setShowFilters }: { setShowFilters: (isShowFilters: boolean) => void }) {
  const params = useMarketsSearchParams();
  const [states, setStates] = useState(params.marketStatusList ?? MARKET_STATES.map((option) => option.value));
  const [verification, setVerification] = useState(
    params.verificationStatusList ?? VERIFICATION_STATES.map((option) => option.value),
  );
  const [networks, setNetworks] = useState(params.chainsList ?? NETWORKS.map((option) => option.value));
  const [conditional, setConditional] = useState(params.showConditionalMarkets);
  const [rewards, setRewards] = useState(params.showMarketsWithRewards);
  const [futarchy, setFutarchy] = useState(params.showFutarchyMarkets);
  const [liquidity, setLiquidity] = useState<number | "">(params.minLiquidity);
  const valid =
    states.length > 0 &&
    verification.length > 0 &&
    networks.length > 0 &&
    (liquidity === "" || (Number.isFinite(liquidity) && liquidity >= 0));

  return (
    <form
      className="seer-filters"
      aria-labelledby="market-filters-title"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        params.applyFilters({
          marketStatusList: states.length === MARKET_STATES.length ? undefined : states,
          verificationStatusList: verification.length === VERIFICATION_STATES.length ? undefined : verification,
          chainsList: networks.length === NETWORKS.length ? undefined : networks,
          showConditionalMarkets: conditional,
          showMarketsWithRewards: rewards,
          showFutarchyMarkets: futarchy,
          minLiquidity: Number(liquidity),
        });
        setShowFilters(false);
      }}
    >
      <div className="seer-filters-heading">
        <h2 id="market-filters-title">Filter markets</h2>
        <button
          type="button"
          className="seer-icon-button"
          aria-label="Close filters"
          onClick={() => setShowFilters(false)}
        >
          <CloseIcon fill="currentColor" />
        </button>
      </div>
      <div className="seer-filter-columns">
        <FilterOptions
          id="market-state"
          label="Resolution status"
          options={MARKET_STATES}
          value={states}
          onChange={(values) => setStates(values as MarketStatus[])}
        />
        <FilterOptions id="market-network" label="Network" options={NETWORKS} value={networks} onChange={setNetworks} />
        <fieldset className="seer-filter-group">
          <legend>Market features</legend>
          <FilterToggle checked={conditional} onChange={setConditional}>
            Only conditional markets
          </FilterToggle>
          <FilterToggle checked={rewards} onChange={setRewards}>
            Only markets with rewards
          </FilterToggle>
        </fieldset>
      </div>
      <details className="seer-filter-advanced">
        <summary>
          Advanced filters
          {params.verificationStatusList?.length || params.minLiquidity > 0 || params.showFutarchyMarkets
            ? " (active)"
            : ""}
        </summary>
        <div className="seer-filter-columns">
          <FilterOptions
            id="market-verification"
            label="Verification"
            options={VERIFICATION_STATES}
            value={verification}
            onChange={(values) => setVerification(values as VerificationStatus[])}
          />
          <fieldset className="seer-filter-group">
            <legend>Liquidity</legend>
            <label className="seer-filter-liquidity" htmlFor="market-min-liquidity">
              Minimum liquidity (USD)
            </label>
            <input
              id="market-min-liquidity"
              className="input input-bordered w-full"
              type="number"
              min="0"
              step="any"
              value={liquidity}
              onChange={(event) => setLiquidity(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </fieldset>
          <fieldset className="seer-filter-group">
            <legend>Futarchy</legend>
            <FilterToggle checked={futarchy} onChange={setFutarchy}>
              Show only futarchy markets
            </FilterToggle>
          </fieldset>
        </div>
      </details>
      <div className="seer-filter-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setShowFilters(false)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Apply filters
        </button>
      </div>
    </form>
  );
}
