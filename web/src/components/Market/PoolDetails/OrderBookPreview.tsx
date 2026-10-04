import { useState } from "react";
import { brazilOrderBookPreview as book } from "./brazilOrderBookPreview";
import { cumulativeCostRows } from "./cumulativeCostRows";
import "./order-book-preview.css";

export default function OrderBookPreview() {
  const [levels, setLevels] = useState(5);
  const [selected, setSelected] = useState<string | null>(null);
  const asks = cumulativeCostRows(book.asks.slice(0, levels), "sell");
  const bids = cumulativeCostRows(book.bids.slice(0, levels), "buy");
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
            aria-label={`${row.side === "sell" ? "Ask" : "Bid"} ${row.price.toFixed(4)}, ${format(row.shares)} shares, cumulative ${format(row.total)} ${book.collateral}`}
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
        <label>
          Levels
          <select
            aria-label="Order book levels"
            value={levels}
            onChange={(e) => {
              setLevels(Number(e.target.value));
              setSelected(null);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </label>
      </header>
      <p className="seer-depth-note">Frozen sample from Seer · 4 Oct 2026 · Not a live quote</p>
      <table>
        <caption className="sr-only">
          Prices in sDAI per share. Total is cumulative cost from the best price on each side.
        </caption>
        <thead>
          <tr>
            <th scope="col">Price ({book.collateral})</th>
            <th scope="col">Shares</th>
            <th scope="col" title="Running sum of price × shares from the best price on this side">
              Total ({book.collateral})
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
              {format(chosen.total)} {book.collateral} cumulative {chosen.side === "sell" ? "cost" : "proceeds"}
            </span>
          </>
        ) : (
          <span>Hover or select a price to inspect cumulative cost.</span>
        )}
      </output>
      <footer>
        Total adds each level’s price × shares, excluding fees.{" "}
        <a href={book.source} target="_blank" rel="noreferrer">
          View original market ↗
        </a>
      </footer>
    </section>
  );
}
