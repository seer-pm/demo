import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { CloseIcon } from "@/lib/icons";
import { MARKET_CATEGORIES } from "@seer-pm/sdk";
import { MARKET_STATUS_LABELS } from "./marketPresentation";

export function AppliedMarketFilters() {
  const params = useMarketsSearchParams();
  const filters: { label: string; title?: string; remove: () => void }[] = [];
  if (params.categoryList.length) {
    filters.push({
      label: params.categoryList
        .map((value) => MARKET_CATEGORIES.find((category) => category.value === value)?.text ?? value)
        .join(", "),
      remove: () => params.setCategory(""),
    });
  }
  if (params.chainsList?.length) {
    filters.push({
      label: params.chainsList
        .map((value) => Object.values(SUPPORTED_CHAINS).find((chain) => String(chain.id) === value)?.name ?? value)
        .join(", "),
      remove: () => params.setChains(undefined),
    });
  }
  if (params.marketStatusList?.length) {
    const labels = params.marketStatusList.map((status) => MARKET_STATUS_LABELS[status]);
    filters.push({
      label: labels.length === 1 ? labels[0] : `Resolution: ${labels.length} statuses`,
      title: labels.join(", "),
      remove: () => params.setMarketStatus(undefined),
    });
  }
  if (params.verificationStatusList?.length) {
    const labels = params.verificationStatusList.map((status) => status.replaceAll("_", " "));
    filters.push({
      label: labels.length === 1 ? `Verification: ${labels[0]}` : `Verification: ${labels.length} statuses`,
      title: labels.join(", "),
      remove: () => params.setVerificationStatus(undefined),
    });
  }
  if (params.showConditionalMarkets)
    filters.push({ label: "Conditional only", remove: () => params.toggleShowConditionalMarkets(false) });
  if (params.showMarketsWithRewards)
    filters.push({ label: "With rewards", remove: () => params.toggleShowMarketsWithRewards(false) });
  if (params.showFutarchyMarkets)
    filters.push({ label: "Futarchy only", remove: () => params.toggleShowFutarchyMarkets(false) });
  if (params.minLiquidity > 0)
    filters.push({
      label: `Liquidity ≥ $${params.minLiquidity.toLocaleString("en-US")}`,
      remove: () => params.setMinLiquidity(0),
    });
  if (!filters.length) return null;

  return (
    <fieldset className="seer-applied-filters" aria-label="Active market filters">
      {filters.map((filter) => (
        <button
          key={filter.label}
          type="button"
          className="seer-filter-chip"
          title={filter.title}
          aria-label={`Remove filter: ${filter.label}`}
          onClick={filter.remove}
        >
          <span>{filter.label}</span>
          <CloseIcon fill="currentColor" />
        </button>
      ))}
      <button type="button" className="seer-clear-filters" onClick={params.clearFilters}>
        Clear filters
      </button>
    </fieldset>
  );
}
