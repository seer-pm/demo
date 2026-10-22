import ConnectWallet from "@/components/ConnectWallet";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { Link } from "@/components/Link";
import { useModal } from "@/hooks/useModal";
import { filterChain } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import {
  BookIcon,
  BugIcon,
  CloseCircleOutlineIcon,
  CloseIcon,
  DiscordIcon,
  EthIcon,
  Menu,
  PlusCircleIcon,
  PolicyIcon,
  QuestionIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { useTokenBalance } from "@seer-pm/react";
import {
  DEFAULT_COLLATERAL_PROFILE,
  type SupportedChain,
  getActiveCollateralProfile,
  getActiveCollateralProfileName,
} from "@seer-pm/sdk";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ReactElement, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount, useDisconnect } from "wagmi";
import DepositGuide from "../DepositGuide";
import Button from "../Form/Button";
import { BrandLockup } from "./BrandLockup";
import { HeaderMenu, MenuChevron } from "./HeaderMenu";
import { HeaderSearch } from "./HeaderSearch";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { UseSmartAccountToggle } from "./UseSmartAccountToggle";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useWalletBalance() {
  const { chainId: raw, address } = useAccount();
  const chainId = filterChain(raw);
  const profile = getActiveCollateralProfile(chainId);
  const useGnosisDefaultSecondary =
    chainId === gnosis.id && getActiveCollateralProfileName() === DEFAULT_COLLATERAL_PROFILE;
  const token = useGnosisDefaultSecondary ? (profile.secondary ?? profile.primary) : profile.primary;
  const { data: balance = BigInt(0) } = useTokenBalance(address, token.address, chainId as SupportedChain);
  return { balance, symbol: token.symbol, chainId };
}

// ── Links ────────────────────────────────────────────────────────────────────

type HeaderLink = { url: string; title: string; icon?: ReactElement };

const PRIMARY_LINKS: HeaderLink[] = [
  { url: "/", title: "Markets" },
  { url: "/portfolio", title: "Portfolio" },
  { url: "/leaderboard", title: "Leaderboard" },
];

const appLink = (id: keyof typeof paths, title: string): HeaderLink => ({
  url: (paths[id] as () => string)(),
  title,
  icon: <img className="seer-app-logo" src={paths.logoImage(id)} alt="" />,
});

const getAppLinks = () => [
  appLink("futarchy", "Futarchy"),
  appLink("deepfund", "Deepfunding"),
  appLink("foresight", "Foresight"),
  appLink("opportunity-markets", "Opportunity Markets"),
];

const getHelpLinks = (): HeaderLink[] => [
  { url: paths.getHelp(), title: "Get Help", icon: <DiscordIcon /> },
  { url: paths.bugReport(), title: "Report a Bug", icon: <BugIcon /> },
  { url: paths.dappGuide(), title: "DApp Guide", icon: <BookIcon /> },
  { url: paths.beginnerGuide(), title: "Crypto Beginner's Guide", icon: <EthIcon /> },
];

// The policies are reference reading, so they sit with the guides and in the footer rather than
// taking a slot in the primary nav.
const POLICY_LINKS: HeaderLink[] = [
  { url: "/policy/verified", title: "Verified Market Policy", icon: <PolicyIcon /> },
  { url: "/policy/rules", title: "Market Rules Policy", icon: <PolicyIcon /> },
];

const getAccountLinks = (): HeaderLink[] => [
  { url: paths.profile(), title: "Account" },
  { url: "/collections/default", title: "Market Collections" },
  { url: paths.tradeCollateral(), title: "Trade Collateral" },
];

const isCurrent = (pathname: string, url: string) =>
  pathname === url || (url !== "/" && pathname.startsWith(`${url}/`));

function LinkItems({ links, pathname }: { links: HeaderLink[]; pathname: string }) {
  return links.map((link) => (
    <li key={link.url}>
      <Link to={link.url} aria-current={isCurrent(pathname, link.url) ? "page" : undefined}>
        {link.icon}
        {link.title}
      </Link>
    </li>
  ));
}

// ── Small components ─────────────────────────────────────────────────────────

function BetaWarning() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(localStorage.getItem("beta-warning-closed") !== "1");
  }, []);
  if (!visible) return null;
  const dismiss = () => {
    localStorage.setItem("beta-warning-closed", "1");
    setVisible(false);
  };
  return (
    <div className="seer-beta">
      <p className="seer-beta-message">
        <span className="seer-beta-tag">Beta</span>
        Some features may be unstable.
      </p>
      <button type="button" aria-label="Dismiss beta notice" className="hover:opacity-80" onClick={dismiss}>
        <CloseCircleOutlineIcon width={12} height={12} fill="white" />
      </button>
    </div>
  );
}

function NetworkIcon() {
  const { chain, chainId } = useAccount();
  const src = chainId ? NETWORK_ICON_MAPPING[chainId] : undefined;
  return src ? <img className="seer-account-chain" src={src} alt={chain?.name ?? ""} /> : null;
}

/** Network switching and disconnecting, shared by the desktop menu and the mobile drawer. */
function WalletActions() {
  const { chain } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  return (
    <>
      <li>
        <button type="button" onClick={() => open({ view: "Networks" })}>
          Switch network
          {chain && <span className="seer-header-menu-meta">{chain.name}</span>}
        </button>
      </li>
      <li>
        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
      </li>
    </>
  );
}

// One control for the connected wallet. The balance stays out of the header: the trade form shows
// it where a trader decides, and Deposit opens the guide that explains it.
function AccountMenu({ pathname, onDeposit }: { pathname: string; onDeposit: () => void }) {
  return (
    <HeaderMenu
      triggerClassName="seer-account-trigger"
      trigger={
        <>
          <span className="sr-only">Account menu, </span>
          <NetworkIcon />
          <AddressOrName className="seer-account-name" />
          <MenuChevron />
        </>
      }
    >
      <ul>
        <li>
          <button type="button" onClick={onDeposit}>
            Deposit
          </button>
        </li>
        <LinkItems links={getAccountLinks()} pathname={pathname} />
        <li>
          <UseSmartAccountToggle className="seer-header-menu-row" />
        </li>
      </ul>
      <ul>
        <WalletActions />
      </ul>
    </HeaderMenu>
  );
}

function HelpMenuContent({ pathname }: { pathname: string }) {
  return (
    <>
      <ul>
        <LinkItems links={getHelpLinks()} pathname={pathname} />
      </ul>
      <ul>
        <LinkItems links={POLICY_LINKS} pathname={pathname} />
      </ul>
    </>
  );
}

function MobileGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="seer-mobile-nav-group">
      <summary>
        {title}
        <MenuChevron />
      </summary>
      {children}
    </details>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export default function Header() {
  const { urlParsed } = usePageContext();
  const pathname = urlParsed.pathname;
  const { isConnected, chain } = useAccount();
  const hasAccountMenu = isConnected && !!chain;
  const { balance, symbol, chainId } = useWalletBalance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDialogElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const { Modal, openModal, closeModal } = useModal("deposit-modal", true);

  const toggle = () => {
    const next = !mobileOpen;
    document.body.classList.toggle("overflow-hidden", next);
    setMobileOpen(next);
  };
  const closeNavigation = useCallback(() => {
    setMobileOpen(false);
    document.body.classList.remove("overflow-hidden");
    mobileToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    menu?.querySelector<HTMLElement>("button, a[href]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (!menu?.contains(event.target as Node) && event.target !== mobileToggleRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeNavigation();
      }
      if (event.key !== "Tab" || !menu?.contains(event.target as Node)) return;
      const controls = Array.from(
        menu.querySelectorAll<HTMLElement>("a[href], button, input, select, summary, [tabindex='0']"),
      ).filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeNavigation]);

  useEffect(() => {
    setMobileOpen(false);
    document.body.classList.remove("overflow-hidden");
  }, [pathname]);
  useEffect(() => {
    const updateTop = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const menuPos = rect.top + rect.height;

        // Set the top offset for menu relative to navbar
        setTopOffset(menuPos);
      }
    };

    updateTop();
    window.addEventListener("resize", updateTop);
    window.addEventListener("scroll", updateTop);

    // Menu offset follows the sticky header, and the beta notice above it, which scrolls away with
    // the page and can be dismissed while the menu is open.
    const observer = new MutationObserver(updateTop);
    const header = document.getElementById("header");
    if (header) {
      observer.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      if (header.parentElement) observer.observe(header.parentElement, { childList: true });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTop);
      window.removeEventListener("scroll", updateTop);
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setMobileOpen(false);
      document.body.classList.remove("overflow-hidden");
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const helpMenu = <HelpMenuContent pathname={pathname} />;

  const desktopNav = (
    <>
      <div className="seer-primary-nav">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.url}
            to={link.url}
            aria-current={isCurrent(pathname, link.url) ? "page" : undefined}
            className="seer-nav-link"
          >
            {link.title}
          </Link>
        ))}
        <HeaderMenu
          align="start"
          triggerClassName="seer-nav-link"
          trigger={
            <>
              Apps
              <MenuChevron />
            </>
          }
        >
          <ul>
            <LinkItems links={getAppLinks()} pathname={pathname} />
          </ul>
        </HeaderMenu>
      </div>
      <div className="seer-account-nav">
        {/* Creating a market is the rare task next to trading, so the link is secondary in weight
            and sits in one fixed slot, just before the wallet, on every route. */}
        <Link to="/create-market" className="seer-global-create">
          <PlusCircleIcon width={18} />
          Create market
        </Link>
        {hasAccountMenu ? (
          <AccountMenu pathname={pathname} onDeposit={openModal} />
        ) : (
          <ConnectWallet className="seer-header-connect" />
        )}
        <HeaderMenu label="Help and guides" triggerClassName="seer-header-icon" trigger={<QuestionIcon />}>
          {helpMenu}
        </HeaderMenu>
        <ThemeToggleButton iconFill="currentColor" iconSize="20" className="seer-header-icon" />
      </div>
    </>
  );

  // The account comes first in the drawer: on a phone, connecting and depositing are what the
  // visitor opens it for, and the header bar already holds the theme toggle and the close button.
  const mobileMenu = (
    <dialog
      ref={mobileMenuRef}
      id="seer-mobile-navigation"
      open
      aria-modal="true"
      aria-label="Navigation"
      style={{ top: `${topOffset}px` }}
      className="seer-mobile-menu bg-base-100 text-base-content fixed left-0 right-0 bottom-0 w-full block z-[100] overflow-y-auto"
    >
      <div className="seer-mobile-menu-content">
        <div className="seer-mobile-account">
          {hasAccountMenu ? (
            <>
              <span className="seer-mobile-account-id">
                <NetworkIcon />
                <AddressOrName />
              </span>
              <Button type="button" size="small" text="Deposit" className="seer-header-connect" onClick={openModal} />
            </>
          ) : (
            <ConnectWallet isMobile className="seer-header-connect" />
          )}
        </div>
        <ul className="seer-mobile-links">
          <LinkItems
            links={[...PRIMARY_LINKS, { url: "/create-market", title: "Create market" }]}
            pathname={pathname}
          />
        </ul>
        {hasAccountMenu && (
          <MobileGroup title="Account">
            <ul>
              <LinkItems links={getAccountLinks()} pathname={pathname} />
              <li>
                <UseSmartAccountToggle className="seer-header-menu-row" />
              </li>
              <WalletActions />
            </ul>
          </MobileGroup>
        )}
        <MobileGroup title="Apps">
          <ul>
            <LinkItems links={getAppLinks()} pathname={pathname} />
          </ul>
        </MobileGroup>
        <MobileGroup title="Help and guides">{helpMenu}</MobileGroup>
      </div>
    </dialog>
  );

  return (
    <>
      {/* Outside the sticky header, so the notice scrolls away instead of holding a row of the
          screen on every page. */}
      <BetaWarning />
      <header id="header" className="seer-header">
        <Modal
          title="Deposit"
          className="w-[400px]"
          content={<DepositGuide closeModal={closeModal} chainId={chainId} balance={balance} symbol={symbol ?? ""} />}
        />
        <nav ref={navRef} className="navbar container-fluid seer-navbar">
          <div className="seer-home-link">
            <Link aria-label="Seer home" className="hover:opacity-85" to="/">
              <BrandLockup />
            </Link>
          </div>
          <HeaderSearch />
          {mobileOpen ? mobileMenu : desktopNav}
          <div className="seer-mobile-actions">
            <ThemeToggleButton iconFill="currentColor" />
            <button
              ref={mobileToggleRef}
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls={mobileOpen ? "seer-mobile-navigation" : undefined}
              onClick={toggle}
            >
              {mobileOpen ? <CloseIcon /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
