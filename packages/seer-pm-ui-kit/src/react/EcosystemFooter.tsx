import { useId } from "react";
import { KLEROS_URL, SEER_HOME_URL, type SeerLinkGroup, seerFooterGroups, seerSocialLinks } from "../ecosystem";
import { BrandLockup } from "./BrandLockup";

export type EcosystemFooterProps = {
  /** Columns placed before the shared Ecosystem and Resources columns, such as a site's own pages. */
  groups?: readonly SeerLinkGroup[];
  /** One line under the lockup. Nothing renders when it is omitted. */
  tagline?: string;
  /** Where the lockup leads. An app passes its own root, the landing keeps seer.pm. */
  homeUrl?: string;
  /** The application's name in the lockup, as in the header. */
  appName?: string;
};

/** The footer every Seer site closes with. Needs tokens.css and components.css. */
export function EcosystemFooter({ groups = [], tagline, homeUrl = SEER_HOME_URL, appName }: EcosystemFooterProps) {
  const id = useId();
  return (
    <footer className="seer-footer">
      <div className="seer-footer-inner seer-footer-top">
        <div>
          <a href={homeUrl} aria-label={appName ? `Seer ${appName} home` : "Seer home"}>
            <BrandLockup appName={appName} />
          </a>
          {tagline && <p className="seer-footer-tagline">{tagline}</p>}
        </div>
        <nav aria-label="Footer" className="seer-footer-nav">
          {[...groups, ...seerFooterGroups].map((group, index) => (
            <div key={group.title} className="seer-footer-group">
              <p id={`${id}-${index}`} className="seer-footer-group-title">
                {group.title}
              </p>
              <ul aria-labelledby={`${id}-${index}`}>
                {group.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="seer-footer-inner seer-footer-bottom">
        <a href={KLEROS_URL} target="_blank" rel="noopener noreferrer" aria-label="Secured by Kleros">
          <span className="seer-icon seer-icon-secured-by-kleros" aria-hidden="true" />
        </a>
        <div className="seer-footer-socials">
          {seerSocialLinks.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Seer on ${social.name}`}
            >
              <span className={`seer-icon seer-icon-${social.id}`} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
