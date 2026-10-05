import { DESIGN_PREVIEW } from "@/lib/design-preview";
import { usePageContext } from "vike-react/usePageContext";
import { BrandStreak } from "./BrandStreak";

const sections: [string, string, string, string][] = [
  ["/leaderboard", "Find your edge", "Leaderboard", "Explore the people behind the predictions."],
  [
    "/create-market",
    "Bring a question to the world",
    "Create a market",
    "Turn a clear question into a prediction market.",
  ],
  ["/profile", "Make it yours", "Account", "Manage your identity, connections and preferences."],
  ["/airdrop", "Participation has value", "SEER rewards", "Explore your allocation and available claims."],
  ["/collections", "A clearer view", "Collections", "Keep the markets you care about together."],
  ["/trade-collateral", "Ready for your next move", "Trade collateral", "Manage the assets you use to trade."],
  ["/policy", "Clarity builds confidence", "Market policies", "Understand how Seer markets are created and resolved."],
  ["/futarchy", "Better decisions, together", "Create a proposal", "Let prediction markets inform your next decision."],
  [
    "/verification-check",
    "Trust, with evidence",
    "Market verification",
    "Review market information and verification status.",
  ],
  ["/claim", "Your next step", "Claim", "Review the details of your claim."],
  ["/confirm-email", "Stay connected", "Email confirmation", "Confirm your email for your Seer account."],
  ["/admin", "Seer workspace", "Administration", "Manage your Seer operations."],
];

export function PageIntro() {
  const { urlParsed } = usePageContext();
  const section = sections.find(([path]) => urlParsed.pathname === path || urlParsed.pathname.startsWith(`${path}/`));
  if (!section || (DESIGN_PREVIEW && urlParsed.pathname === "/create-market")) return null;
  const [, eyebrow, title, description] = section;
  return (
    <div
      className={`container-fluid seer-page-intro ${urlParsed.pathname === "/leaderboard" ? "seer-leaderboard-intro" : ""}`}
    >
      <div className="seer-page-intro-copy">
        <p className="seer-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="seer-page-description">{description}</p>
      </div>
      <BrandStreak className="seer-intro-streak" />
    </div>
  );
}
