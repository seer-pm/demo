import clsx from "clsx";
import { useState } from "react";

// Static placeholder ported from ui-fix/market.html (.chart-note). Content is a
// mockup — replace with real per-market rules when wiring this to live data.
export default function RulesNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className={clsx("chart-note", open && "rules-open")} id="rules-note">
      <p className="rules-lead">
        <span className="rules-label">Rules:</span> This market will resolve to the political party or alliance that
        wins the most seats in the 2026 Armenian parliamentary election.
      </p>
      <div className="rules-more-wrap">
        <div className="rules-more">
          <p>
            If a coalition or alliance secures the largest number of seats in the National Assembly, the market will
            resolve to that party or alliance. The resolution source for this market is the official results certified
            and published by the Central Electoral Commission of the Republic of Armenia, available at{" "}
            <a href="https://www.elections.am/" target="_blank" rel="noopener noreferrer">
              https://www.elections.am/
            </a>
            . Please note that this market is about the official seat count certified by the Central Electoral
            Commission, not according to exit polls, preliminary tallies, or other media or unofficial sources.
          </p>
        </div>
      </div>
      <button className="rules-toggle" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
