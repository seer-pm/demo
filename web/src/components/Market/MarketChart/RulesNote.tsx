import clsx from "clsx";
import { useState } from "react";

// Static placeholder ported from ui-fix/market.html (.chart-note). Content is a
// mockup — replace with real per-market rules when wiring this to live data.
export default function RulesNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className={clsx("chart-note", open && "rules-open")} id="rules-note">
      <p className="rules-lead">
        <span className="rules-label">Rules:</span> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <div className="rules-more-wrap">
        <div className="rules-more">
          <p>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
            totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
            explicabo.
          </p>
        </div>
      </div>
      <button className="rules-toggle" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
