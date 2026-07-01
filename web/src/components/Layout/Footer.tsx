import { DiscordIcon, GithubIcon, KlerosIcon, SeerLogo, TelegramIcon, TwitterIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { Link } from "../Link";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="container-fluid foot-inner">
        <span className="brand-mini-svg" aria-label="Seer">
          <SeerLogo fill="currentColor" className="h-[22px] w-auto" />
        </span>

        <div className="socials [&_svg_path]:fill-current" aria-label="Social links">
          <a href={paths.discord()} target="_blank" rel="noopener noreferrer" aria-label="Discord">
            <DiscordIcon />
          </a>
          <a href={paths.twitter()} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
            <TwitterIcon />
          </a>
          <a href={paths.telegram()} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <TelegramIcon />
          </a>
          <a href={paths.github()} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GithubIcon />
          </a>
        </div>

        <div className="links">
          <Link to="/policy/verified">Verified Market Policy</Link>
          <Link to="/policy/rules">Market Rules Policy</Link>
          <Link to={paths.faq()}>FAQ</Link>
        </div>

        <span className="copy flex items-center gap-1.5">
          © 2026 ·
          <a href="https://kleros.io" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            {/* Sample: `SECURED BY KLEROS <img style="margin-left:6px; vertical-align:-2px"/>`.
                The HTML keeps a literal space between "KLEROS" and the
                image — collapsed-whitespace ~3-4px plus the 6px margin
                gives the visible ~9-10px gap. Match that by emitting an
                explicit {" "} alongside ml-1.5 (6px). Fill uses var(--blue)
                so the K renders blue in light mode and Kleros purple in
                dark mode, instead of our brand purple in both. */}
            Secured by Kleros{" "}
            <KlerosIcon width={14} height={14} fill="var(--blue)" className="inline-block ml-1.5 align-[-2px]" />
          </a>
        </span>
      </div>
    </footer>
  );
}
