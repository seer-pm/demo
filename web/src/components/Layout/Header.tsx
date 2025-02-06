import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import useCheckAccount from "@/hooks/useCheckAccount";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useSignIn } from "@/hooks/useSignIn";
import {
  BookIcon,
  BugIcon,
  CloseIcon,
  DownArrow,
  EthIcon,
  Menu,
  NotificationIcon,
  PolicyIcon,
  QuestionIcon,
  SeerLogo,
  TelegramIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";
import Button from "../Form/Button";
import { NotificationsForm } from "../Market/Header/NotificationsForm";

type MenuItem = {
  text: string;
  to: string;
  icon?: React.ReactNode;
  isExternal?: boolean;
  children?: {
    text: string;
    to: string;
    icon: React.ReactNode;
    isExternal?: boolean;
  }[];
};

const MAIN_MENU_ITEMS: MenuItem[] = [
  { text: "Markets", to: "/" },
  { text: "Create Market", to: "/create-market" },
  {
    text: "Policies",
    to: "#",
    children: [
      {
        text: "Verified Market Policy",
        to: "/policy/verified",
        icon: <PolicyIcon />,
      },
      {
        text: "Market Rules Policy",
        to: "/policy/rules",
        icon: <PolicyIcon />,
      },
    ],
  },
  { text: "Airdrop", to: "/airdrop" },
  { text: "Portfolio", to: "/portfolio" },
];

const HELP_MENU_ITEMS: MenuItem[] = [
  {
    text: "Get Help",
    to: paths.getHelp(),
    icon: <TelegramIcon />,
    isExternal: true,
  },
  {
    text: "Report a Bug",
    to: paths.bugReport(),
    icon: <BugIcon />,
    isExternal: true,
  },
  {
    text: "DApp Guide",
    to: paths.dappGuide(),
    icon: <BookIcon />,
    isExternal: true,
  },
  {
    text: "Crypto Beginner's Guide",
    to: paths.beginnerGuide(),
    icon: <EthIcon />,
    isExternal: true,
  },
];

function AccountSettings({ isMobile }: { isMobile?: boolean }) {
  const { isConnected, address, chainId } = useAccount();
  const { hasAccount } = useCheckAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const isAuthValid = !isAccessTokenExpired(accessToken);
  const [email, setEmail] = useState("");

  const isAccountConnected = isConnected && hasAccount;

  const signIn = useSignIn();

  useEffect(() => {
    (async () => {
      if (accessToken) {
        const data = await fetchAuth(accessToken, "/.netlify/functions/me", "GET");
        setEmail(data?.user?.email || "");
      }
    })();
  }, [accessToken]);

  return (
    <div className={clsx(isMobile ? "space-y-2" : "w-[416px] max-w-full px-[32px] py-[35px] space-y-6")}>
      {!isMobile && <div className="text-[20px] font-semibold text-center">Email Notifications</div>}
      <p className="text-[14px] text-black-secondary">
        Receive email notifications for your followed markets and important updates.
      </p>
      {isAccountConnected && (
        <div className="text-center space-y-4">
          {!isAuthValid ? (
            <Button
              variant="primary"
              size="large"
              text="Sign In"
              onClick={() => signIn.mutateAsync({ address: address!, chainId: chainId! })}
            />
          ) : (
            <NotificationsForm key={`email-${email}`} email={email} accessToken={accessToken} />
          )}
        </div>
      )}

      {!isAccountConnected && !isMobile && (
        <div className="text-center">
          <ConnectWallet size="large" />
        </div>
      )}
      {!isAccountConnected && isMobile && (
        <p className="text-[14px] text-black-secondary">Connect wallet to continue.</p>
      )}
    </div>
  );
}

export default function Header() {
  const pageContext = usePageContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMenu = () => {
    if (!mobileMenuOpen) {
      window.document.body.classList.add("overflow-hidden");
    } else {
      window.document.body.classList.remove("overflow-hidden");
    }

    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      toggleMenu();
    }
  }, [pageContext.urlParsed.pathname]);

  useEffect(() => {
    function handleResize() {
      setMobileMenuOpen(false);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header>
      <nav className="navbar justify-between bg-purple-dark px-[24px] text-white gap-4">
        <div className="min-[1150px]:w-1/3 w-1/4">
          <Link className="text-white hover:opacity-85" to="/">
            <SeerLogo width={`${141.73 * 0.7}px`} height={`${65.76 * 0.7}px`} />
          </Link>
        </div>

        {mobileMenuOpen && <MobileMenu />}

        <ul className="hidden lg:menu-horizontal gap-2 text-[16px] font-semibold space-x-[32px] justify-center">
          {MAIN_MENU_ITEMS.map((item) => (
            <li key={item.text}>
              {item.children ? (
                <div className="dropdown dropdown-end">
                  <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85">
                    <span>{item.text}</span> <DownArrow />
                  </button>
                  <ul className="dropdown-content z-[2] w-[248px] [&_svg]:text-purple-primary font-normal">
                    {item.children.map((child) => (
                      <li
                        key={child.text}
                        className="flex space-x-2 items-center px-[24px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                      >
                        <Link to={child.to} className="flex items-center space-x-2">
                          {child.icon} <span>{child.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link to={item.to} className="whitespace-nowrap hover:opacity-85">
                  {item.text}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <ul className="hidden lg:menu-horizontal gap-[16px] justify-end w-1/3">
          <li>
            <ConnectWallet />
          </li>

          <li className="flex items-center space-x-2">
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <NotificationIcon />
              </button>
              <ul className="dropdown-content z-[1] [&_svg]:text-purple-primary">
                <li>
                  <AccountSettings />
                </li>
              </ul>
            </div>
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <QuestionIcon />
              </button>
              <ul className="dropdown-content z-[2] w-[248px] [&_svg]:text-purple-primary">
                {HELP_MENU_ITEMS.map((item) => (
                  <li key={item.text}>
                    <Link
                      to={item.to}
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                    >
                      {item.icon}
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ul>
        <div className="lg:hidden">
          <button type="button" onClick={toggleMenu}>
            {mobileMenuOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>
      </nav>
      <BetaWarning />
    </header>
  );
}

function BetaWarning() {
  const [betaWarningClosed, setBetaWarningClosed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("beta-warning-closed") === "1") {
      setBetaWarningClosed(true);
    }
  }, []);

  if (betaWarningClosed) {
    return null;
  }

  const closeWarning = () => {
    window.localStorage.setItem("beta-warning-closed", "1");
    setBetaWarningClosed(true);
  };

  return (
    <div className="bg-warning-light text-warning-primary text-[14px] text-center py-[10px] px-[30px] font-medium border-b-[2px] border-t-[2px] border-warning-primary relative">
      <div>Note that this is a Beta version and can still be unstable</div>
      <div className="font-bold text-[14px] absolute top-0 right-[20px] w-[10px] h-full flex items-center">
        <span className="cursor-pointer" onClick={closeWarning}>
          x
        </span>
      </div>
    </div>
  );
}

function MobileMenu() {
  return (
    <div className="bg-white text-black fixed left-0 right-0 bottom-0 top-[64px] w-full block z-[100] overflow-y-auto">
      <div className="px-[24px] py-[48px]">
        <div className="text-[24px] font-semibold mb-[32px]">Explore</div>
        <ul className="space-y-[24px]">
          {MAIN_MENU_ITEMS.map((item) => (
            <li key={item.text}>
              {item.children ? (
                <div>
                  <span>{item.text}</span>
                  <ul className="z-[1] w-[248px] [&_svg]:text-purple-primary font-normal !left-0">
                    {item.children.map((child) => (
                      <li key={child.text} className="flex space-x-2 items-center px-[24px] py-[16px]">
                        <Link to={child.to} className="flex items-center space-x-2">
                          {child.icon} <span className="hover:font-semibold whitespace-nowrap">{child.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link to={item.to} className="hover:font-semibold">
                  {item.text}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t border-b border-t-black-medium border-b-black-medium py-[24px] my-[24px]">
          <ConnectWallet isMobile={true} />
        </div>
        <div className="mb-6">
          <div className="mb-2">Email Notifications</div>
          <AccountSettings isMobile />
        </div>
        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="flex items-center gap-2 hover:font-semibold">
            <QuestionIcon fill="#9747FF" /> Help
          </button>
          <ul className="dropdown-content z-[1] w-[248px] [&_svg]:text-purple-primary !left-0">
            {HELP_MENU_ITEMS.map((item) => (
              <li key={item.text}>
                <Link
                  to={item.to}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                >
                  {item.icon}
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
