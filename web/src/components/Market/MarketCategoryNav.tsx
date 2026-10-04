import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { MARKET_CATEGORIES } from "@seer-pm/sdk";

export function MarketCategoryNav() {
  const { categoryList, setCategory } = useMarketsSearchParams();
  return (
    <nav className="seer-categories" aria-label="Market categories">
      {[{ value: "", text: "All markets" }, ...MARKET_CATEGORIES].map(({ value, text }) => (
        <button
          key={value}
          type="button"
          aria-pressed={value ? categoryList.includes(value) : categoryList.length === 0}
          onClick={() => setCategory(value)}
        >
          {text}
        </button>
      ))}
    </nav>
  );
}
