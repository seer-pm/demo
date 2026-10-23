export type SeerAppId = "app" | "deep" | "futarchy" | "opportunity" | "risk";

export type SeerLink = { name: string; url: string };

export type SeerApp = SeerLink & {
  id: SeerAppId;
  /** One sentence on what the app prices, written for the person asking the question. */
  summary: string;
};

export type SeerSocialId = "discord" | "telegram" | "x" | "github";

export type SeerSocialLink = SeerLink & { id: SeerSocialId };

export type SeerLinkGroup = { title: string; links: readonly SeerLink[] };

export const SEER_HOME_URL = "https://seer.pm";

export const SEER_CONTACT_EMAIL = "info@seer.pm";

/** The applications built on the Seer protocol, in the order every site lists them. */
export const seerApps: readonly SeerApp[] = [
  {
    id: "app",
    name: "Seer app",
    url: "https://app.seer.pm",
    summary: "Find and trade every Seer market, whatever its type.",
  },
  {
    id: "deep",
    name: "Deep",
    url: "https://deep.seer.pm",
    summary: "Questions with many possible outcomes, including markets for AI agents.",
  },
  {
    id: "futarchy",
    name: "Futarchy",
    url: "https://futarchy.seer.pm",
    summary: "What a proposal is expected to do for a DAO if it passes, and if it does not.",
  },
  {
    id: "opportunity",
    name: "Opportunity Markets",
    url: "https://opportunity.seer.pm",
    summary: "Which submissions are likely to be selected, as a signal for the reviewers.",
  },
  {
    id: "risk",
    name: "Risk Pricing",
    url: "https://risk.seer.pm",
    summary: "Market estimates of default risk, compared across protocols.",
  },
];

export const seerResourceLinks: readonly SeerLink[] = [
  { name: "Documentation", url: "https://docs.seer.pm" },
  { name: "Blog", url: "https://seer-pm.medium.com" },
  { name: "Brand assets", url: "https://drive.google.com/drive/folders/1EOGhjj_jHJ5PPt86VEDuGZ2dovJpfY-l" },
];

export const seerSocialLinks: readonly SeerSocialLink[] = [
  { id: "discord", name: "Discord", url: "https://discord.com/invite/rBEB4MYQwV" },
  { id: "telegram", name: "Telegram", url: "https://t.me/Seerpredictionmarket" },
  { id: "x", name: "X", url: "https://x.com/seer_pm" },
  { id: "github", name: "GitHub", url: "https://github.com/seer-pm" },
];

export const KLEROS_URL = "https://kleros.io/";

/** Footer columns shared by every site. A site prepends its own group for its internal pages. */
export const seerFooterGroups: readonly SeerLinkGroup[] = [
  { title: "Ecosystem", links: seerApps },
  { title: "Resources", links: seerResourceLinks },
];
