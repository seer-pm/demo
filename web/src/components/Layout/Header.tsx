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
  DownArrow,
  EthIcon,
  Menu,
  NotificationIcon,
  PersonAdd,
  PolicyIcon,
  QuestionIcon,
  SeerLogo,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useTokenBalance } from "@seer-pm/react";
import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS } from "@seer-pm/sdk";
import clsx from "clsx";
import { Fragment, ReactElement, useEffect, useRef, useState } from "react";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";
import DepositGuide from "../DepositGuide";
import Button from "../Form/Button";
import { NotificationsForm } from "../Market/Header/NotificationsForm";
import { ThemeToggleButton } from "./ThemeToggleButton";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useWalletBalance() {
  const { chainId: raw, address } = useAccount();
  const chainId = filterChain(raw);
  const token = chainId === gnosis.id ? COLLATERAL_TOKENS[chainId].secondary : COLLATERAL_TOKENS[chainId].primary;
  const { data: balance = BigInt(0), isFetching } = useTokenBalance(address, token?.address, chainId as SupportedChain);
  return { balance, isFetching, symbol: token?.symbol, chainId };
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
    <div className={clsx(isMobile ? "space-y-2" : "w-[416px] max-w-full px-[32px] py-[35px] space-y-6")}>
      <div className={clsx("font-semibold", isMobile ? "text-[16px]" : "text-[20px] text-center")}>
        Email Notifications
      </div>
      <p className="text-[14px] text-black-secondary">
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
    <div className="bg-[#40055B] text-white text-[12px] py-[8px] px-[30px] flex items-center justify-center gap-2">
      <span>Note that this is a Beta version and can still be unstable</span>
      <button type="button" className="hover:opacity-80" onClick={dismiss}>
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
            <ul className="dropdown-content z-20 w-[248px] [&_svg]:text-purple-primary font-normal">
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
    const render = useNavRenderer(isMobile, isConnected);

    const deposit = isMobile ? (
      <Button type="button" text="Deposit" onClick={openModal} />
    ) : (
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium dark:hover:bg-neutral hover:border-l-purple-primary"
      >
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
        className: isMobile
          ? "space-y-[24px]"
          : "hidden [@media(min-width:900px)]:menu-horizontal ml-[16%] [@media(min-width:1000px)]:ml-[25%] [@media(min-width:1200px)]:!ml-[0] text-[16px] space-x-[24px]",
        children: [
          { id: "market", type: "link", url: "/", title: "Markets" },
          { id: "create-market", type: "link", url: "/create-market", title: "Create Market" },
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
          : "hidden [@media(min-width:900px)]:menu-horizontal gap-2 absolute right-[12px]",
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
                  { id: "deposit", type: "custom", element: deposit },
                  {
                    id: "portfolio",
                    type: "link",
                    url: "/portfolio",
                    title: "Portfolio",
                    className: nestedLinkClassName,
                  },
                  {
                    id: "collections",
                    type: "link",
                    url: "/collections/default",
                    title: "Market Collections",
                    className: nestedLinkClassName,
                  },
                  {
                    id: "trade-collateral",
                    type: "link",
                    url: paths.tradeCollateral(),
                    title: "Trade Collateral",
                    className: nestedLinkClassName,
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
                icon: <NotificationIcon />,
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
                    <ThemeToggleButton iconFill="#9747FF" iconSize="17" showLabel />
                  </div>
                ) : (
                  <ThemeToggleButton
                    iconFill="white"
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
    <header id="header" className="bg-purple-dark">
      <Modal
        title="Deposit"
        className="w-[400px]"
        content={<DepositGuide closeModal={closeModal} chainId={chainId} balance={balance} symbol={symbol ?? ""} />}
      />
      <BetaWarning />
      <nav
        ref={navRef}
        className="navbar container-fluid text-white gap-4 flex items-center justify-start [@media(min-width:1200px)]:justify-center relative"
      >
        <div className="absolute left-[24px] lg:left-[12px]">
          <Link className="text-white hover:opacity-85" to="/">
            <SeerLogo width="99.2px" height="46px" />
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
