import { Link } from "@/components/Link";
import clsx from "clsx";

const TABS = [
  { id: "pnl", label: "Profit & Loss", url: "/leaderboard" },
  { id: "airdrop", label: "Airdrop", url: "/leaderboard/airdrop" },
] as const;

export type LeaderboardTabId = (typeof TABS)[number]["id"];

/**
 * Switcher between the two boards. The header keeps a single "Leaderboard" link, so this is how
 * the airdrop board is discovered — render it on both pages.
 */
export function LeaderboardTabs({ active }: { active: LeaderboardTabId }) {
  return (
    <nav className="join" aria-label="Leaderboard type">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          to={tab.url}
          aria-current={tab.id === active ? "page" : undefined}
          className={clsx("btn btn-sm join-item", tab.id === active ? "btn-primary" : "btn-ghost")}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default LeaderboardTabs;
