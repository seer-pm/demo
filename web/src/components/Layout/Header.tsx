import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";
import { filterChain } from "@/lib/chains";
import {
  BookIcon,
  BugIcon,
  CloseCircleOutlineIcon,
  CloseIcon,
  DiscordIcon,
  EthIcon,
  Menu,
  NotificationIcon,
  PolicyIcon,
  QuestionIcon,
  SeerLogo,
} from "@/lib/icons";
import { useTheme } from "@/hooks/useTheme";

// Sample-matched stroke icons for the header (16×16, fill:none, stroke
// currentColor 2px, rounded caps/joins). Match the .icon-button glyphs in
// `Seer New Redesign/index.html` exactly. Kept inline so other consumers of
// NotificationIcon / QuestionIcon (filled Material style) are unaffected.
const HeaderBellIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const HeaderHelpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const HeaderMoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const HeaderSunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
import { paths } from "@/lib/paths";
import { displayBalance, fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useTokenBalance } from "@seer-pm/react";
import {
  DEFAULT_COLLATERAL_PROFILE,
  type SupportedChain,
  getActiveCollateralProfile,
  getActiveCollateralProfileName,
} from "@seer-pm/sdk";
import clsx from "clsx";
import { Fragment, ReactElement, useEffect, useRef, useState } from "react";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";
import DepositGuide from "../DepositGuide";
import Button from "../Form/Button";
import { NotificationsForm } from "../Market/Header/NotificationsForm";
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
  const { data: balance = BigInt(0), isFetching } = useTokenBalance(address, token.address, chainId as SupportedChain);
  return { balance, isFetching, symbol: token.symbol, chainId };
}

// ── Small components ─────────────────────────────────────────────────────────

function AccountSettings({ isMobile }: { isMobile?: boolean }) {
  const { isConnected, address, chainId } = useAccount();
  const accessToken = useGlobalState((s) => s.accessToken);
  const [email, setEmail] = useState("");
  const signIn = useSignIn();

  useEffect(() => {
    if (!accessToken) return;
    fetchAuth(accessToken, "/.netlify/functions/me", "GET").then((d) => setEmail(d?.user?.email ?? ""));
  }, [accessToken]);

  const isAuthValid = !isAccessTokenExpired(accessToken);

  return (
    <div className={clsx(isMobile ? "space-y-2" : "w-[280px] max-w-[90vw] px-[16px] py-[16px] space-y-4")}>
      <div className={clsx("font-semibold", isMobile ? "text-[16px]" : "text-[15px]")}>
        Email Notifications
      </div>
      <p className="text-[12.5px] text-ink-3 leading-snug">
        Receive email notifications for your followed markets and important updates.
      </p>
      {isConnected ? (
        <div className="text-center space-y-4">
          {isAuthValid ? (
            <NotificationsForm key={`email-${email}`} email={email} accessToken={accessToken} />
          ) : (
            <Button
              variant="primary"
              size="large"
              text="Sign In"
              onClick={() => signIn.mutateAsync({ address: address!, chainId: chainId! })}
            />
          )}
        </div>
      ) : isMobile ? (
        <p className="text-[14px] text-black-secondary">Connect wallet to continue.</p>
      ) : (
        <div className="text-center">
          <ConnectWallet size="large" />
        </div>
      )}
    </div>
  );
}

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
    <div className="bg-[#fbfaf7] text-[#4b5563] dark:bg-surface-2 dark:text-ink-3 text-[12px] py-[8px] px-[30px] flex items-center justify-center gap-2 border-b border-[var(--border)]">
      <span>Note that this is a Beta version and can still be unstable</span>
      <button type="button" className="hover:opacity-80" onClick={dismiss}>
        <CloseCircleOutlineIcon width={12} height={12} fill="currentColor" />
      </button>
    </div>
  );
}

// ── Nav tree ─────────────────────────────────────────────────────────────────
type NavItemType = "container" | "link" | "custom" | "nested_links" | "connected-container";

type NavItem = {
  id: string;
  type: NavItemType;
  url?: string;
  title?: string;
  icon?: ReactElement;
  element?: ReactElement;
  className?: string;
  active?: boolean;
  children?: NavItem[];
};

const getNestedLinkClassName = (isMobile: boolean) =>
  isMobile
    ? "flex gap-2 items-center py-[16px] hover:font-semibold whitespace-nowrap"
    : // Sample `.menu a` — text-[13.5px] medium, ink-2 color, padded 9/12,
      // 6px radius, soft bg-2 hover. No left border accent.
      "flex items-center gap-2 px-[12px] py-[9px] rounded-[6px] text-[13.5px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink transition-colors";

const appLink = (id: string, key: keyof typeof paths, label: string, isMobile: boolean): NavItem => ({
  id,
  type: "link",
  url: (paths[key] as () => string)(),
  title: label,
  className: getNestedLinkClassName(isMobile),
  icon: <img className="h-[18px] w-auto" src={paths.logoImage(id)} alt={label} />,
});

// ── Renderer ──────────────────────────────────────────────────────────────────

function useNavRenderer(isMobile: boolean, isConnected: boolean) {
  function render(item: NavItem): ReactElement | null {
    const renderChildren = () => item.children?.map(render);
    switch (item.type) {
      case "container":
        return (
          <ul key={item.id} className={item.className}>
            {renderChildren()}
          </ul>
        );
      case "link":
        return (
          <Link
            key={item.id}
            to={item.url ?? ""}
            aria-current={item.active ? "page" : undefined}
            className={
              item.className ??
              (isMobile
                ? clsx("hover:font-semibold block", item.active && "font-semibold")
                : clsx(
                    "whitespace-nowrap px-[14px] py-[8px] rounded-[6px] transition-colors relative",
                    // Sample applies `.nav a:hover { background: var(--bg-2) }`
                    // to BOTH active and non-active links. The 2px underline
                    // sits at `bottom: -1px` with `border-radius: 2px 2px 0 0`
                    // — Tailwind's default `rounded-t` is 4px which made the
                    // line's rounded ends bulge above its 2px height and
                    // read as thicker than the sample's.
                    item.active
                      ? "text-ink hover:bg-bg-2 after:content-[''] after:absolute after:left-[14px] after:right-[14px] after:-bottom-[1px] after:h-[2px] after:bg-blue after:rounded-t-[2px]"
                      : "text-ink-3 hover:bg-bg-2 hover:text-ink",
                  ))
            }
          >
            {item.icon} {item.title}
          </Link>
        );
      case "custom":
        return <Fragment key={item.id}>{item.element}</Fragment>;
      case "nested_links":
        return isMobile ? (
          <div key={item.id} className={item.className}>
            {item.element ?? <p className="font-semibold text-[16px]">{item.title}</p>}
            <ul>{renderChildren()}</ul>
          </div>
        ) : (
          <div key={item.id} className={item.className ?? "dropdown dropdown-hover"}>
            {item.element ?? (
              <button
                type="button"
                tabIndex={0}
                className="flex items-center gap-1.5 px-[14px] py-[8px] rounded-[6px] text-ink-3 hover:bg-bg-2 hover:text-ink transition-colors"
              >
                <span>{item.title}</span> {item.icon}
              </button>
            )}
            <ul tabIndex={0} className="dropdown-content z-20 [&_svg]:text-blue">
              {renderChildren()}
            </ul>
          </div>
        );
      case "connected-container":
        return isConnected ? <Fragment key={item.id}>{renderChildren()}</Fragment> : null;
      default:
        return null;
    }
  }
  return render;
}

// ── Header ────────────────────────────────────────────────────────────────────

export default function Header() {
  const { urlParsed } = usePageContext();
  const { isConnected } = useAccount();
  const { balance, isFetching, symbol, chainId } = useWalletBalance();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const { Modal, openModal, closeModal } = useModal("deposit-modal", true);

  const toggle = () => {
    const next = !mobileOpen;
    document.body.classList.toggle("overflow-hidden", next);
    setMobileOpen(next);
  };

  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
  }, [urlParsed.pathname]);
  useEffect(() => {
    const updateTop = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const menuPos = rect.top + rect.height + scrollY;

        // Set the top offset for menu relative to navbar
        setTopOffset(menuPos);
      }
    };

    // update top offset for menu if header dom changes
    const observer = new MutationObserver(updateTop);
    const header = document.getElementById("header");
    if (header) {
      observer.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleResize() {
      setMobileOpen(false);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buildAndRender = (isMobile: boolean) => {
    const nestedLinkClassName = getNestedLinkClassName(isMobile);
    const profileMenuLinkClassName = clsx(nestedLinkClassName, !isMobile && "text-[14px] w-full");
    const render = useNavRenderer(isMobile, isConnected);
    const currentPath = urlParsed.pathname;

    const deposit = isMobile ? (
      <Button type="button" text="Deposit" onClick={openModal} />
    ) : (
      <button type="button" onClick={openModal} className={profileMenuLinkClassName}>
        Deposit
      </button>
    );

    const balanceDisplay = isMobile ? (
      <>
        {!isFetching && (
          <p className="text-[14px]">
            Current balance:{" "}
            <span className="text-purple-primary font-semibold">{displayBalance(balance, 18, true)}</span> {symbol}
          </p>
        )}
      </>
    ) : (
      <button
        type="button"
        tabIndex={0}
        className="relative top-[5px] flex flex-col items-center hover:opacity-85 text-ink-3"
      >
        
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {!isFetching && (
          <p className="text-[10px]">
            {displayBalance(balance, 18, true)} {symbol}
          </p>
        )}
      </button>
    );

    // Shared className for the round header icon buttons (notification, help, theme).
    // Matches the sample model's `.icon-button` spec: 36×36 circle, bg-2 surface,
    // transparent placeholder border, ink-3 → ink on hover. `relative` allows
    // an optional unread/notification badge dot to absolute-position inside.
    const iconButtonClassName =
      "relative inline-flex items-center justify-center w-[36px] h-[36px] rounded-full border border-transparent bg-bg-2 text-ink-3 hover:text-ink hover:bg-bg-3 transition-colors";

    const items: NavItem[] = [
      {
        id: "container-1",
        type: "container",
        className: isMobile
          ? "space-y-[24px]"
          : "hidden [@media(min-width:900px)]:menu-horizontal ml-[10%] [@media(min-width:1000px)]:ml-[16%] [@media(min-width:1200px)]:!ml-[0] text-[14px] font-medium space-x-[4px]",
        children: [
          { id: "market", type: "link", url: "/", title: "Markets", active: currentPath === "/" },
          {
            id: "create-market",
            type: "link",
            url: "/create-market",
            title: "Create Market",
            active: currentPath.startsWith("/create-market"),
          },
          {
            id: "policies-dropdown",
            type: "nested_links",
            title: "Policies",
            icon: <span className="text-[9px] text-ink-5 -translate-y-px leading-none">▾</span>,
            children: [
              {
                id: "verified-policy",
                type: "link",
                url: "/policy/verified",
                title: "Verified Market Policy",
                icon: <PolicyIcon />,
                className: nestedLinkClassName,
              },
              {
                id: "market-rules-policy",
                type: "link",
                url: "/policy/rules",
                title: "Market Rules Policy",
                icon: <PolicyIcon />,
                className: nestedLinkClassName,
              },
            ],
          },
          {
            id: "app-dropdown",
            type: "nested_links",
            title: "App",
            icon: <span className="text-[9px] text-ink-5 -translate-y-px leading-none">▾</span>,
            children: [
              appLink("futarchy", "futarchy", "Futarchy.fi", isMobile),
              appLink("deepfund", "deepfund", "Deepfunding", isMobile),
              appLink("foresight", "foresight", "Foresight", isMobile),
            ],
          },
        ],
      },
      {
        id: "container-2",
        type: "container",
        className: isMobile
          ? "space-y-[24px] mt-5"
          : "hidden [@media(min-width:900px)]:menu-horizontal gap-2 absolute right-[24px]",
        children: [
          { id: "connect-wallet", type: "custom", element: <ConnectWallet isMobile={isMobile} /> },
          {
            id: "container-connected",
            type: "connected-container",
            children: [
              {
                id: "connected-dropdown",
                type: "nested_links",
                // dropdown-end keeps the menu anchored to the trigger's
                // right edge so it doesn't extend off the right of the
                // viewport (this trigger sits near right-[24px]).
                className: isMobile ? "space-y-[12px]" : "dropdown dropdown-end dropdown-hover",
                element: balanceDisplay,
                children: [
                  { id: "deposit", type: "custom", element: deposit },
                  {
                    id: "portfolio",
                    type: "link",
                    url: "/portfolio",
                    title: "Portfolio",
                    className: profileMenuLinkClassName,
                  },
                  {
                    id: "collections",
                    type: "link",
                    url: "/collections/default",
                    title: "Market Collections",
                    className: profileMenuLinkClassName,
                  },
                  {
                    id: "trade-collateral",
                    type: "link",
                    url: paths.tradeCollateral(),
                    title: "Trade Collateral",
                    className: profileMenuLinkClassName,
                  },
                  {
                    id: "use-smart-account",
                    type: "custom",
                    element: <UseSmartAccountToggle className={profileMenuLinkClassName} />,
                  },
                ],
              },
            ],
          },
          {
            id: "container-3",
            type: "container",
            className: isMobile ? "" : "flex items-center space-x-2",
            children: [
              {
                id: "notification-dropdown",
                type: "nested_links",
                className: isMobile ? undefined : "dropdown dropdown-end dropdown-hover",
                icon: <NotificationIcon />,
                element: isMobile ? undefined : (
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label="Email notifications"
                    className={iconButtonClassName}
                  >
                    <HeaderBellIcon />
                  </button>
                ),
                children: [
                  {
                    id: "notification-settings",
                    type: "custom",
                    element: <AccountSettings isMobile={isMobile} />,
                  },
                ],
              },
              {
                id: "information",
                type: "nested_links",
                className: isMobile ? undefined : "dropdown dropdown-end dropdown-hover",
                icon: <QuestionIcon />,
                element: isMobile ? undefined : (
                  <button
                    type="button"
                    tabIndex={0}
                    aria-label="Help"
                    className={iconButtonClassName}
                  >
                    <HeaderHelpIcon />
                  </button>
                ),
                children: [
                  {
                    id: "help",
                    type: "link",
                    title: "Get Help",
                    icon: <DiscordIcon />,
                    url: paths.getHelp(),
                    className: nestedLinkClassName,
                  },
                  {
                    id: "bug-report",
                    type: "link",
                    title: "Report a Bug",
                    icon: <BugIcon />,
                    url: paths.bugReport(),
                    className: nestedLinkClassName,
                  },
                  {
                    id: "dapp-guide",
                    type: "link",
                    title: "DApp Guide",
                    icon: <BookIcon />,
                    url: paths.dappGuide(),
                    className: nestedLinkClassName,
                  },
                  {
                    id: "beginner-guide",
                    type: "link",
                    title: "Crypto Beginner's Guide",
                    icon: <EthIcon />,
                    url: paths.beginnerGuide(),
                    className: nestedLinkClassName,
                  },
                  {
                    id: "faq",
                    type: "link",
                    title: "FAQ",
                    icon: <QuestionIcon />,
                    url: paths.faq(),
                    className: nestedLinkClassName,
                  },
                ],
              },
              {
                id: "dark-mode",
                type: "custom",
                element: isMobile ? (
                  <div className="py-[16px]">
                    <ThemeToggleButton iconFill="var(--blue)" iconSize="17" showLabel />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    className={iconButtonClassName}
                  >
                    {theme === "light" ? <HeaderMoonIcon /> : <HeaderSunIcon />}
                  </button>
                ),
              },
            ],
          },
        ],
      },
    ];
    const renderedItems = items.map((item) => <Fragment key={item.id}>{render(item)}</Fragment>);
    if (isMobile) {
      return (
        <div
          style={{ top: `${topOffset}px` }}
          className="bg-base-100 text-base-content fixed left-0 right-0 bottom-0 w-full block z-[100] overflow-y-auto"
        >
          <div className="px-[24px] py-[48px]">
            <div className="text-[24px] font-semibold mb-[32px]">Explore</div>
            {renderedItems}
          </div>
        </div>
      );
    }
    return renderedItems;
  };

  return (
    <header id="header" className="bg-surface border-b border-[var(--border)] sticky top-0 z-50 text-ink">
      <Modal
        title="Deposit"
        className="w-[400px]"
        content={<DepositGuide closeModal={closeModal} chainId={chainId} balance={balance} symbol={symbol ?? ""} />}
      />
      <BetaWarning />
      <nav
        ref={navRef}
        className="navbar container-fluid text-ink-3 gap-4 flex items-center justify-start [@media(min-width:1200px)]:justify-center [@media(min-width:1200px)]:pr-[180px] relative"
      >
        <div className="absolute left-[24px]">
          <Link className="text-ink hover:text-blue transition-colors" to="/">
            <SeerLogo width="69px" height="32px" fill="currentColor" />
          </Link>
        </div>
        {buildAndRender(mobileOpen)}
        <div className="[@media(min-width:900px)]:hidden ml-auto">
          <button type="button" onClick={toggle}>
            {mobileOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>
      </nav>
    </header>
  );
}
