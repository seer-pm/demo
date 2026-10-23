import { EcosystemFooter } from "@seer-pm/ui-kit/react";

const APP_LINKS = {
  title: "App",
  links: [
    { name: "Markets", url: "/" },
    { name: "Portfolio", url: "/portfolio" },
    { name: "Market rules", url: "/policy/rules" },
    { name: "Verification policy", url: "/policy/verified" },
  ],
};

export default function Footer() {
  return <EcosystemFooter homeUrl="/" tagline="A clearer view of what comes next." groups={[APP_LINKS]} />;
}
