import { Link } from "@/components/Link";
import clsx from "clsx";

const TABS = [
  { id: "pnl", label: "Profit & Loss", url: "/leaderboard" },
  { id: "airdrop", label: "Airdrop", url: "/leaderboard/airdrop" },
] as const;

export type LeaderboardTabId = (typeof TABS)[number]["id"];

/**
 * Switcher between the two boards — render it on both pages. The header links to each board
 * directly ("Leaderboard" and "Airdrop"), so this is the in-page way to move between them rather
 * than the only way to reach the airdrop board.
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
