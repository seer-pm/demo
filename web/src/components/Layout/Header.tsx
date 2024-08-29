import ConnectWallet from "@/components/ConnectWallet";
import {
  BookIcon,
  BugIcon,
  DownArrow,
  EthIcon,
  PolicyIcon,
  QuestionIcon,
  SettingsIcon,
  TelegramIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isUndefined } from "@/lib/utils";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address } = useAccount();

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

  return (
    <header>
      <nav className="navbar justify-between bg-purple-dark px-[24px] text-white">
        <div className="w-1/3">
          <Link className="text-white" to="/">
            Seer
          </Link>
        </div>

        <div className="sm:hidden">
          <button type="button" onClick={toggleMenu}>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {mobileMenuOpen && <MobileMenu />}

        <ul className="hidden sm:menu-horizontal gap-2 text-[16px] font-semibold space-x-[32px] justify-center w-1/3">
          <li>
            <Link to={"/"}>Markets</Link>
          </li>
          <li>
            <Link to={"/create-market"}>Create Market</Link>
          </li>
          <li>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="flex items-center space-x-2">
                <span>Policies</span> <DownArrow />
              </div>
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
            <Link to={"/portfolio"}>Portfolio</Link>
          </li>
        </ul>

        <ul className="hidden sm:menu-horizontal gap-[16px] justify-end w-1/3">
          <li>
            <ConnectWallet />
          </li>
          {!isUndefined(address) && (
            <li>
              <Link to={paths.profile()}>
                <SettingsIcon />
              </Link>
            </li>
          )}
          <li className="flex items-center">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button">
                <QuestionIcon />
              </div>
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
          </li>
        </ul>
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
    <div className="bg-white text-black fixed left-0 right-0 bottom-0 top-[64px] w-full block z-[100] sm:hidden">
      <div className="px-[24px] py-[48px]">
        <div className="text-[24px] font-semibold mb-[32px]">Explore</div>
        <ul className="space-y-[24px]">
          <li>
            <Link to={"/"}>Markets</Link>
          </li>
          <li>
            <Link to={"/create-market"}>Create Market</Link>
          </li>
        </ul>

        <div className="border-t border-b border-t-black-medium border-b-black-medium py-[24px] my-[24px]">
          <ConnectWallet />
        </div>
      </div>
    </div>
  );
}
