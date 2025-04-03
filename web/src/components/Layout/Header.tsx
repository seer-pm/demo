import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { useSignIn } from "@/hooks/useSignIn";
import { useVerifiedMarketPolicy } from "@/hooks/useVerifiedMarketPolicy";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import {
  AccountCircleIcon,
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
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";
import Button from "../Form/Button";
import { NotificationsForm } from "../Market/Header/NotificationsForm";

function AccountSettings({ isMobile }: { isMobile?: boolean }) {
  const { isConnected, address, chainId } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const isAuthValid = !isAccessTokenExpired(accessToken);
  const [email, setEmail] = useState("");

  const isAccountConnected = isConnected;

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
  const { chainId = DEFAULT_CHAIN, isConnected } = useAccount();
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
      <nav className="navbar bg-purple-dark px-[24px] text-white gap-4">
        <div>
          <Link className="text-white hover:opacity-85" to="/">
            <SeerLogo width={`${141.73 * 0.7}px`} height={`${65.76 * 0.7}px`} />
          </Link>
        </div>

        {mobileMenuOpen && <MobileMenu />}

        <ul className="ml-10 hidden lg:menu-horizontal gap-2 text-[16px] font-semibold space-x-[32px] justify-center">
          <li>
            <Link to={"/"} className="hover:opacity-85">
              Markets
            </Link>
          </li>
          <li>
            <Link to={"/create-market"} className="whitespace-nowrap hover:opacity-85">
              Create Market
            </Link>
          </li>
          {chainId === gnosis.id && (
            <li>
              <Link to={"/futarchy"} className="whitespace-nowrap hover:opacity-85">
                Futarchy
              </Link>
            </li>
          )}
          <li>
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85">
                <span>Policies</span> <DownArrow />
              </button>
              <ul className="dropdown-content z-[2] w-[248px] [&_svg]:text-purple-primary font-normal ">
                <li className="flex space-x-2 items-center px-[24px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary">
                  <Link to={"/policy/verified"} className="flex items-center space-x-2">
                    <PolicyIcon /> <span> Verified Market Policy </span>
                  </Link>
                </li>
                <li className="flex space-x-2 items-center  px-[24px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary">
                  <Link to={"/policy/rules"} className="flex items-center space-x-2">
                    <PolicyIcon /> <span>Market Rules Policy</span>
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          <li>
            {/* <Link to={paths.farmingProgram()} className="hover:opacity-85" target="_blank" rel="noopener noreferrer">
              Airdrop
            </Link> */}
            <Link to={"/airdrop"} className="hover:opacity-85">
              Airdrop
            </Link>
          </li>
        </ul>

        <ul className="hidden lg:menu-horizontal gap-[16px] justify-end w-1/3 ml-auto">
          <li>
            <ConnectWallet />
          </li>
          {isConnected && (
            <div className="dropdown dropdown-end mt-[5px]">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <AccountCircleIcon />
              </button>
              <ul className="dropdown-content z-[1] [&_svg]:text-purple-primary">
                <li>
                  <Link
                    to={"/portfolio"}
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/collections/default"}
                    className="whitespace-nowrap flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    Market Collections
                  </Link>
                </li>
              </ul>
            </div>
          )}
          <li className="flex items-center space-x-2">
            <div className="dropdown dropdown-end mt-[5px]">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <NotificationIcon />
              </button>
              <ul className="dropdown-content z-[1] [&_svg]:text-purple-primary">
                <li>
                  <AccountSettings />
                </li>
              </ul>
            </div>
            <div className="dropdown dropdown-end mt-[3px]">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <QuestionIcon />
              </button>
              <ul className="dropdown-content z-[2] w-[248px] [&_svg]:text-purple-primary">
                <li>
                  <Link
                    to={paths.getHelp()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <TelegramIcon />
                    Get Help
                  </Link>
                </li>
                <li>
                  <Link
                    to={paths.bugReport()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <BugIcon />
                    Report a Bug
                  </Link>
                </li>
                <li>
                  <Link
                    to={paths.dappGuide()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <BookIcon />
                    DApp Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to={paths.beginnerGuide()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <EthIcon />
                    Crypto Beginner's Guide
                  </Link>
                </li>
                {/* <li>
                  <Link
                    to={paths.faq()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <QuestionIcon />
                    FAQ
                  </Link>
                </li> */}
              </ul>
            </div>
          </li>
        </ul>
        <div className="lg:hidden ml-auto">
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
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: verifiedMarketPolicy } = useVerifiedMarketPolicy(chainId as SupportedChain);
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);

  return (
    <div className="bg-white text-black fixed left-0 right-0 bottom-0 top-[64px] w-full block z-[100] overflow-y-auto">
      <div className="px-[24px] py-[48px]">
        <div className="text-[24px] font-semibold mb-[32px]">Explore</div>
        <ul className="space-y-[24px]">
          <li>
            <Link to={"/"} className="hover:font-semibold">
              Markets
            </Link>
          </li>
          <li>
            <Link to={"/create-market"} className="hover:font-semibold">
              Create Market
            </Link>
          </li>
          {chainId === gnosis.id && (
            <li>
              <Link to={"/futarchy"} className="hover:font-semibold">
                Futarchy
              </Link>
            </li>
          )}
          <li>
            <div>
              <span>Policies</span>
              <ul className="z-[1] w-[248px] [&_svg]:text-purple-primary font-normal !left-0">
                <li className="flex space-x-2 items-center px-[24px] py-[16px]">
                  <a
                    href={verifiedMarketPolicy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span className="hover:font-semibold whitespace-nowrap">Verified Market Policy</span>
                  </a>
                </li>
                <li className="flex space-x-2 items-center  px-[24px] py-[16px]">
                  <a
                    href={marketRulesPolicy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span className="hover:font-semibold">Market Rules Policy</span>
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li>
            <Link to={paths.farmingProgram()} className="hover:font-semibold" target="_blank" rel="noopener noreferrer">
              Airdrop
            </Link>
          </li>
          <li>
            <Link to={"/portfolio"} className="hover:font-semibold">
              Portfolio
            </Link>
          </li>
          <li>
            <Link to={"/collections/default"} className="hover:font-semibold">
              Market Collections
            </Link>
          </li>
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
            <li>
              <Link
                to={paths.getHelp()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
              >
                <TelegramIcon />
                Get Help
              </Link>
            </li>
            <li>
              <Link
                to={paths.bugReport()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
              >
                <BugIcon />
                Report a Bug
              </Link>
            </li>
            <li>
              <Link
                to={paths.dappGuide()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
              >
                <BookIcon />
                DApp Guide
              </Link>
            </li>
            <li>
              <Link
                to={paths.beginnerGuide()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
              >
                <EthIcon />
                Crypto Beginner's Guide
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
