import { MarketsFilter } from "../Market/MarketsFilter";
import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import { useModal } from "@/hooks/useModal";
import { filterChain } from "@/lib/chains";
import {
  BookIcon,
  BugIcon,
  CloseCircleOutlineIcon,
  CloseIcon,
  DiscordIcon,
  DownArrow,
  EthIcon,
  Menu,
  PersonAdd,
  PolicyIcon,
  QuestionIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
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
import { ThemeToggleButton } from "./ThemeToggleButton";
import { BrandLockup } from "./BrandLockup";
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
      <span>Note that this is a Beta version and can still be unstable</span>
      <button type="button" aria-label="Dismiss beta notice" className="hover:opacity-80" onClick={dismiss}>
        <CloseCircleOutlineIcon width={12} height={12} fill="white" />
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
  children?: NavItem[];
};

const getNestedLinkClassName = (isMobile: boolean) =>
  isMobile
    ? "flex gap-2 items-center py-[16px] hover:font-semibold whitespace-nowrap"
    : "flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium dark:hover:bg-neutral hover:border-l-purple-primary";

const appLink = (id: string, key: keyof typeof paths, label: string, isMobile: boolean): NavItem => ({
  id,
  type: "link",
  url: (paths[key] as () => string)(),
  title: label,
  className: getNestedLinkClassName(isMobile),
  icon: <img className="h-[32px] w-auto" src={paths.logoImage(id)} alt={label} />,
});

// ── Renderer ──────────────────────────────────────────────────────────────────

function useNavRenderer(isMobile: boolean, isConnected: boolean, pathname: string) {
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
            aria-current={
              item.url && (pathname === item.url || (item.url !== "/" && pathname.startsWith(`${item.url}/`)))
                ? "page"
                : undefined
            }
            to={item.url ?? ""}
            className={
              item.className ?? (isMobile ? "hover:font-semibold block" : "whitespace-nowrap hover:opacity-85 py-3")
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
          <div key={item.id} className={item.className ?? "dropdown dropdown-end"}>
            {item.element ?? (
              <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85 py-3">
                <span>{item.title}</span> {item.icon}
              </button>
            )}
            <ul tabIndex={0} className="dropdown-content z-20 w-[248px] [&_svg]:text-purple-primary font-normal">
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
  const isHome = urlParsed.pathname === "/";
  const { balance, isFetching, symbol, chainId } = useWalletBalance();
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
    setMobileOpen(false);
    document.body.classList.remove("overflow-hidden");
  }, [urlParsed.pathname]);
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

    // Menu offset follows the sticky header.
    const observer = new MutationObserver(updateTop);
    const header = document.getElementById("header");
    if (header) {
      observer.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
      });
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

  const buildAndRender = (isMobile: boolean) => {
    const nestedLinkClassName = getNestedLinkClassName(isMobile);
    const profileMenuLinkClassName = clsx(nestedLinkClassName, !isMobile && "text-[14px] w-full");
    const render = useNavRenderer(isMobile, isConnected, urlParsed.pathname);

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
      <button type="button" tabIndex={0} className="flex flex-col items-center hover:opacity-85">
        <PersonAdd />
        {!isFetching && (
          <p className="text-[10px]">
            {displayBalance(balance, 18, true)} {symbol}
          </p>
        )}
      </button>
    );

    const items: NavItem[] = [
      {
        id: "container-1",
        type: "container",
        className: isMobile ? "space-y-[24px]" : "seer-primary-nav",
        children: [
          { id: "market", type: "link", url: "/", title: "Markets" },
          { id: "portfolio-main", type: "link", url: "/portfolio", title: "Portfolio" },
          { id: "leaderboard", type: "link", url: "/leaderboard", title: "Leaderboard" },
          ...(!isHome || isMobile
            ? [{ id: "create-market", type: "link" as const, url: "/create-market", title: "Create Market" }]
            : []),
          {
            id: "policies-dropdown",
            type: "nested_links",
            title: "Policies",
            icon: <DownArrow />,
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
            icon: <DownArrow />,
            children: [
              appLink("futarchy", "futarchy", "Futarchy", isMobile),
              appLink("deepfund", "deepfund", "Deepfunding", isMobile),
              appLink("foresight", "foresight", "Foresight", isMobile),
              appLink("opportunity-markets", "opportunity-markets", "Opportunity Markets", isMobile),
            ],
          },
        ],
      },
      {
        id: "container-2",
        type: "container",
        className: isMobile ? "space-y-[24px] mt-5" : "seer-account-nav",
        children: [
          { id: "connect-wallet", type: "custom", element: <ConnectWallet isMobile={isMobile} /> },
          {
            id: "container-connected",
            type: "connected-container",
            children: [
              {
                id: "connected-dropdown",
                type: "nested_links",
                className: isMobile ? "space-y-[12px]" : undefined,
                element: balanceDisplay,
                children: [
                  {
                    id: "account",
                    type: "link",
                    url: paths.profile(),
                    title: "Account",
                    className: profileMenuLinkClassName,
                  },
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
                id: "information",
                type: "nested_links",
                icon: <QuestionIcon />,
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
                ],
              },
              {
                id: "dark-mode",
                type: "custom",
                element: isMobile ? (
                  <div className="py-[16px]">
                    <ThemeToggleButton iconFill="currentColor" iconSize="17" showLabel />
                  </div>
                ) : (
                  <ThemeToggleButton
                    iconFill="currentColor"
                    iconSize="20"
                    className="flex items-center justify-center w-[32px] h-[32px] rounded hover:bg-white/10 transition-colors"
                  />
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
    <header id="header" className={`seer-header ${isHome ? "seer-discovery-header" : ""}`}>
      <Modal
        title="Deposit"
        className="w-[400px]"
        content={<DepositGuide closeModal={closeModal} chainId={chainId} balance={balance} symbol={symbol ?? ""} />}
      />
      <BetaWarning />
      <nav ref={navRef} className="navbar container-fluid seer-navbar">
        <div className="seer-home-link">
          <Link aria-label="Seer home" className="hover:opacity-85" to="/">
            <BrandLockup />
          </Link>
        </div>
        {isHome && <MarketsFilter mode="search" />}
        {buildAndRender(mobileOpen)}
        {isHome && <MarketsFilter mode="actions" />}
        <div className="seer-mobile-actions">
          <ThemeToggleButton iconFill="currentColor" />
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={toggle}
          >
            {mobileOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>
      </nav>
    </header>
  );
}
