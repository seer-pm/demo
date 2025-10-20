import ConnectWallet from "@/components/ConnectWallet";
import { Link } from "@/components/Link";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useVerifiedMarketPolicy } from "@/hooks/useVerifiedMarketPolicy";
import { SupportedChain, filterChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import {
  BookIcon,
  BugIcon,
  CloseCircleOutlineIcon,
  CloseIcon,
  DiscordIcon,
  DownArrow,
  EthIcon,
  GlobeIcon,
  Menu,
  NotificationIcon,
  PersonAdd,
  PolicyIcon,
  QuestionIcon,
  SeerLogo,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";
import DepositGuide from "../DepositGuide";
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
  const { isConnected, chainId: _chainId, address } = useAccount();
  const chainId = filterChain(_chainId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topOffset, setTopOffset] = useState<number>(0);
  const { data: balance = BigInt(0), isFetching } = useTokenBalance(
    address,
    COLLATERAL_TOKENS?.[chainId].secondary?.address,
    chainId as SupportedChain,
  );
  const containerRef = useRef<HTMLDivElement>(null);

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
    const updateTop = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
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
      setMobileMenuOpen(false);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const { Modal, openModal, closeModal } = useModal("deposit-modal", true);
  return (
    <header id="header">
      <Modal
        title="Deposit"
        className="w-[500px]"
        content={<DepositGuide closeModal={closeModal} chainId={chainId as SupportedChain} balance={balance} />}
      />
      <BetaWarning />
      <GroupNotice />

      <nav
        ref={containerRef}
        className="navbar bg-purple-dark px-[24px] text-white gap-4 flex items-center justify-start [@media(min-width:1200px)]:justify-center relative"
      >
        <div className="absolute left-[24px] lg:left-[64px]">
          <Link className="text-white hover:opacity-85" to="/">
            <SeerLogo width={`${141.73 * 0.7}px`} height={`${65.76 * 0.7}px`} />
          </Link>
        </div>

        {mobileMenuOpen && <MobileMenu topOffset={topOffset} />}

        <ul className="hidden [@media(min-width:900px)]:menu-horizontal ml-[16%] [@media(min-width:1000px)]:ml-[25%] [@media(min-width:1200px)]:!ml-[0] text-[16px] space-x-[24px]">
          <li>
            <Link to={"/"} className="hover:opacity-85 py-3">
              Markets
            </Link>
          </li>
          <li>
            <Link to={"/create-market"} className="whitespace-nowrap hover:opacity-85 py-3">
              Create Market
            </Link>
          </li>
          <li>
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85 py-3">
                <span>Policies</span> <DownArrow />
              </button>
              <ul className="dropdown-content z-20 w-[248px] [&_svg]:text-purple-primary font-normal ">
                <li>
                  <Link
                    to={"/policy/verified"}
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <PolicyIcon /> <span> Verified Market Policy </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/policy/rules"}
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <PolicyIcon /> <span>Market Rules Policy</span>
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          <li>
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85 py-3">
                <span>App</span> <DownArrow />
              </button>
              <ul className="dropdown-content z-20 w-[248px] [&_svg]:text-purple-primary font-normal ">
                <li>
                  <Link
                    to={paths.futarchy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <GlobeIcon /> <span>Futarchi.fi</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to={paths.deepfund()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <GlobeIcon /> <span>DeepFunding Round 1</span>
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          {/* <li>
            <Link to={"/airdrop"} className="hover:opacity-85 py-3">
              Airdrop
            </Link>
          </li> */}
        </ul>

        <ul className="hidden [@media(min-width:900px)]:menu-horizontal gap-2 absolute right-[64px]">
          <li>
            <ConnectWallet />
          </li>
          {isConnected && (
            <div className="dropdown dropdown-end mt-[5px]">
              <button type="button" tabIndex={0} className="flex flex-col items-center hover:opacity-85">
                <PersonAdd />
                {!isFetching && (
                  <p className="text-[10px]">
                    {displayBalance(balance, 18, true)} {COLLATERAL_TOKENS[chainId].secondary?.symbol}
                  </p>
                )}
              </button>
              <ul className="dropdown-content z-[20] [&_svg]:text-purple-primary">
                <li>
                  <button
                    type="button"
                    onClick={openModal}
                    className="w-full flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    Deposit
                  </button>
                </li>
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
              <ul className="dropdown-content z-[20] [&_svg]:text-purple-primary">
                <li>
                  <AccountSettings />
                </li>
              </ul>
            </div>
            <div className="dropdown dropdown-end mt-[3px]">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <QuestionIcon />
              </button>
              <ul className="dropdown-content z-[20] w-[248px] [&_svg]:text-purple-primary">
                <li>
                  <Link
                    to={paths.getHelp()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
                  >
                    <DiscordIcon />
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
        <div className="[@media(min-width:900px)]:hidden ml-auto">
          <button type="button" onClick={toggleMenu}>
            {mobileMenuOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>
      </nav>
    </header>
  );
}

function BetaWarning() {
  const [isReady, setIsReady] = useState(false);
  const [betaWarningClosed, setBetaWarningClosed] = useState(false);

  useEffect(() => {
    const isClosed = window.localStorage.getItem("beta-warning-closed") === "1";
    setBetaWarningClosed(isClosed);
    setIsReady(true);
  }, []);

  if (!isReady || betaWarningClosed) {
    return null;
  }

  const closeWarning = () => {
    window.localStorage.setItem("beta-warning-closed", "1");
    setBetaWarningClosed(true);
  };

  return (
    <div className="bg-[#40055B] text-white text-[12px] py-[8px] px-[30px] flex items-center justify-center gap-2">
      <div>Note that this is a Beta version and can still be unstable</div>
      <button type="button" className="hover:opacity-80" onClick={closeWarning}>
        <CloseCircleOutlineIcon width={12} height={12} fill="white" />
      </button>
    </div>
  );
}

function GroupNotice() {
  const [isReady, setIsReady] = useState(false);
  const [groupNoticeClosed, setGroupNoticeClosed] = useState(false);

  useEffect(() => {
    const isClosed = window.localStorage.getItem("group-notice-closed") === "1";
    setGroupNoticeClosed(isClosed);
    setIsReady(true);
  }, []);

  if (!isReady || groupNoticeClosed) {
    return null;
  }

  const closeNotice = () => {
    window.localStorage.setItem("group-notice-closed", "1");
    setGroupNoticeClosed(true);
  };

  return (
    <div className="bg-[#40055B] text-white text-[12px] py-[8px] px-[30px] flex items-center justify-center gap-2">
      <div>
        Our telegram account is banned, community is moving to discord. Join the{" "}
        <a
          href={paths.discord()}
          target="_blank"
          rel="noopener noreferrer"
          className="italic underline  hover:opacity-80"
        >
          Discord
        </a>
      </div>
      <button type="button" className="hover:opacity-80" onClick={closeNotice}>
        <CloseCircleOutlineIcon width={12} height={12} fill="white" />
      </button>
    </div>
  );
}

function MobileMenu({ topOffset }: { topOffset: number }) {
  const { chainId: _chainId, address, isConnected } = useAccount();
  const chainId = filterChain(_chainId);
  const { data: balance = BigInt(0), isFetching } = useTokenBalance(
    address,
    COLLATERAL_TOKENS[chainId].secondary?.address,
    chainId as SupportedChain,
  );
  const { data: verifiedMarketPolicy } = useVerifiedMarketPolicy(chainId as SupportedChain);
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);
  const { Modal, openModal, closeModal } = useModal("deposit-modal", true);
  return (
    <div
      style={{ top: `${topOffset}px` }}
      className="bg-white text-black fixed left-0 right-0 bottom-0 w-full block z-[100] overflow-y-auto"
    >
      <Modal
        title="Deposit"
        className="w-[400px]"
        content={<DepositGuide closeModal={closeModal} chainId={chainId as SupportedChain} balance={balance} />}
      />
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
            <div>
              <span>App</span>
              <ul className="z-[1] w-[248px] [&_svg]:text-purple-primary font-normal !left-0">
                <li className="flex space-x-2 items-center px-[24px] py-[16px]">
                  <a
                    href={paths.futarchy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <GlobeIcon /> <span className="hover:font-semibold whitespace-nowrap">Futarchi.fi</span>
                  </a>
                </li>
                <li className="flex space-x-2 items-center  px-[24px] py-[16px]">
                  <a
                    href={paths.deepfund()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 whitespace-nowrap"
                  >
                    <GlobeIcon /> <span className="hover:font-semibold">DeepFunding Round 1</span>
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

        <div className="border-t border-b border-t-black-medium border-b-black-medium py-[24px] my-[24px] space-y-2">
          <ConnectWallet isMobile={true} />
          {isConnected && (
            <>
              {!isFetching && (
                <p className="text-[14px]">
                  Current balance:{" "}
                  <span className="text-purple-primary font-semibold">{displayBalance(balance, 18, true)}</span>{" "}
                  {COLLATERAL_TOKENS[chainId].secondary?.symbol}
                </p>
              )}
              <Button type="button" text="Deposit" onClick={openModal} />
            </>
          )}
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
                <DiscordIcon />
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
