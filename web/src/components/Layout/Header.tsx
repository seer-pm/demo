import ConnectWallet from "@/components/ConnectWallet";
import {
  BookIcon,
  BugIcon,
  CloseIcon,
  DownArrow,
  EthIcon,
  Menu,
  PolicyIcon,
  QuestionIcon,
  SeerLogo,
  TelegramIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
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
  }, [location]);

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
        <div className="w-1/3">
          <Link className="text-white hover:opacity-85" to="/">
            <SeerLogo width={`${141.73 * 0.7}px`} height={`${65.76 * 0.7}px`} />
          </Link>
        </div>

        {mobileMenuOpen && <MobileMenu />}

        <ul className="hidden lg:menu-horizontal gap-2 text-[16px] font-semibold space-x-[32px] justify-center w-1/3">
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
          <li>
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="flex items-center space-x-2 hover:opacity-85">
                <span>Policies</span> <DownArrow />
              </button>
              <ul className="dropdown-content z-[1] w-[248px] [&_svg]:text-purple-primary font-normal">
                <li className="flex space-x-2 items-center px-[24px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary">
                  <a
                    href={paths.verifiedMarketPolicy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span>Verified Market Policy</span>
                  </a>
                </li>
                <li className="flex space-x-2 items-center  px-[24px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary">
                  <a
                    href={paths.marketRulesPolicy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span>Market Rules Policy</span>
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li>
            <Link to={paths.farmingProgram()} className="hover:opacity-85" target="_blank" rel="noopener noreferrer">
              Airdrop
            </Link>
          </li>
          <li>
            <Link to={"/portfolio"} className="hover:opacity-85">
              Portfolio
            </Link>
          </li>
        </ul>

        <ul className="hidden lg:menu-horizontal gap-[16px] justify-end w-1/3">
          <li>
            <ConnectWallet />
          </li>

          <li className="flex items-center">
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="hover:opacity-85">
                <QuestionIcon />
              </button>
              <ul className="dropdown-content z-[1] w-[248px] [&_svg]:text-purple-primary">
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
    <div className="bg-white text-black fixed left-0 right-0 bottom-0 top-[64px] w-full block z-[100]">
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
                    href={paths.verifiedMarketPolicy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span className="hover:font-semibold whitespace-nowrap">Verified Market Policy</span>
                  </a>
                </li>
                <li className="flex space-x-2 items-center  px-[24px] py-[16px]">
                  <a
                    href={paths.marketRulesPolicy()}
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
        </ul>

        <div className="border-t border-b border-t-black-medium border-b-black-medium py-[24px] my-[24px]">
          <ConnectWallet isMobile />
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
            <li>
              <Link
                to={paths.faq()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-[16px] py-[16px] border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary"
              >
                <QuestionIcon />
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
