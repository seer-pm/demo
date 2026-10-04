import { useState } from "react";
import { getBrazilPreviewBook } from "./brazilOrderBookPreview";
import { cumulativeCostRows } from "./cumulativeCostRows";
import "./order-book-preview.css";

export default function OrderBookPreview({
  outcome = "Flávio Bolsonaro",
  totalMode = "cost",
}: { outcome?: string; totalMode?: "cost" | "shares" }) {
  const book = getBrazilPreviewBook(outcome);
  const unit = totalMode === "cost" ? book.collateral : "shares";
  const makeRows = (levels: typeof book.asks, side: "sell" | "buy") => {
    const rows = cumulativeCostRows(levels.slice(0, 5), side);
    if (totalMode === "shares") {
      let total = 0;
      const ordered = side === "sell" ? [...rows].reverse() : rows;
      for (const row of ordered) {
        total += row.shares;
        row.total = total;
      }
      for (const row of rows) row.pct = row.total / total;
    }
    return rows;
  };
  const [selected, setSelected] = useState<string | null>(null);
  const asks = makeRows(book.asks, "sell");
  const bids = makeRows(book.bids, "buy");
  const chosen = [...asks, ...bids].find((row) => row.id === selected);
  const format = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sideRows = (rows: ReturnType<typeof cumulativeCostRows>) =>
    rows.map((row) => (
      <tr key={row.id} className={`seer-depth-row ${row.side} ${selected === row.id ? "selected" : ""}`}>
        <td>
          <button
            type="button"
            onMouseEnter={() => setSelected(row.id)}
            onFocus={() => setSelected(row.id)}
            onClick={() => setSelected(row.id)}
            aria-label={`${row.side === "sell" ? "Ask" : "Bid"} ${row.price.toFixed(4)}, ${format(row.shares)} shares, cumulative ${format(row.total)} ${unit}`}
          >
            <span className="seer-depth-fill" style={{ width: `${row.pct * 100}%` }} aria-hidden="true" />
            <span>{row.price.toFixed(4)}</span>
          </button>
        </td>
        <td>{format(row.shares)}</td>
        <td>{format(row.total)}</td>
      </tr>
    ));
  return (
    <section className="seer-depth-preview" aria-label="Brazilian election demo order book">
      <header>
        <div>
          <h2>
            Order book <span>Demo</span>
          </h2>
          <p>
            {book.outcome} · {book.collateral}
          </p>
        </div>
      </header>
      <p className="seer-depth-note">
        {book.synthetic
          ? "Illustrative sample depth · Not a live quote"
          : "Frozen sample from Seer · 4 Oct 2026 · Not a live quote"}
      </p>
      <table>
        <caption className="sr-only">
          Prices in sDAI per share. Total is cumulative {totalMode} from the best price on each side.
        </caption>
        <thead>
          <tr>
            <th scope="col">Price ({book.collateral})</th>
            <th scope="col">Shares</th>
            <th
              scope="col"
              title={
                totalMode === "cost"
                  ? "Running sum of price × shares from the best price on this side"
                  : "Running sum of shares from the best price on this side"
              }
            >
              Total ({unit})
            </th>
          </tr>
        </thead>
        <tbody>
          {sideRows(asks)}
          <tr className="seer-depth-spread">
            <td colSpan={3}>
              Last {book.last.toFixed(4)}{" "}
              <span>
                Spread {(book.asks[0].price - book.bids[0].price).toFixed(4)} {book.collateral}
              </span>
            </td>
          </tr>
          {sideRows(bids)}
        </tbody>
      </table>
      <output className="seer-depth-summary">
        {chosen ? (
          <>
            <strong>
              {chosen.side === "sell" ? "Buy" : "Sell"} through {chosen.price.toFixed(4)}
            </strong>
            <span>
              {format(chosen.total)} {unit} cumulative{" "}
              {totalMode === "shares" ? "quantity" : chosen.side === "sell" ? "cost" : "proceeds"}
            </span>
          </>
        ) : (
          <span>Hover or select a price to inspect cumulative {totalMode}.</span>
        )}
      </output>
      <footer>
        {totalMode === "cost"
          ? "Total adds each level’s price × shares, excluding fees."
          : "Total adds the shares at each level."}{" "}
        <a href={book.source} target="_blank" rel="noreferrer">
          View original market ↗
        </a>
      </footer>
    </section>
  );
}
