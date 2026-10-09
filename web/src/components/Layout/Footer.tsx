import { Link } from "@/components/Link";
import { DiscordIcon, GithubIcon, SecuredByKleros, TelegramIcon, TwitterIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { BrandLockup } from "./BrandLockup";

export default function Footer() {
  return (
    <footer className="seer-footer">
      <div className="container-fluid seer-footer-top">
        <div>
          <BrandLockup />
          <p>A clearer view of what comes next.</p>
        </div>
        <nav aria-label="Footer" className="seer-footer-links">
          <Link to="/">Markets</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/policy/rules">Market rules</Link>
          <Link to="/policy/verified">Verification policy</Link>
        </nav>
      </div>
      <div className="container-fluid seer-footer-bottom">
        <a href="https://kleros.io/" target="_blank" rel="noopener noreferrer" aria-label="Secured by Kleros">
          <SecuredByKleros />
        </a>
        <div className="flex items-center gap-5">
          <a href={paths.discord()} aria-label="Seer Discord" target="_blank" rel="noopener noreferrer">
            <DiscordIcon />
          </a>
          <a href={paths.telegram()} aria-label="Seer Telegram" target="_blank" rel="noopener noreferrer">
            <TelegramIcon />
          </a>
          <a href={paths.twitter()} aria-label="Seer on X" target="_blank" rel="noopener noreferrer">
            <TwitterIcon />
          </a>
          <a href={paths.github()} aria-label="Seer GitHub" target="_blank" rel="noopener noreferrer">
            <GithubIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
