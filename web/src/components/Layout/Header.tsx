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
      <nav className="navbar justify-between bg-blue-primary px-[24px] text-white">
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
              <ul className="dropdown-content z-[1] px-[16px] py-[23px] w-[248px] space-y-[23px] [&_svg]:text-purple-primary font-normal">
                <li className="flex space-x-2 items-center">
                  <a
                    href={paths.verifiedMarketPolicy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <PolicyIcon /> <span>Verified Market Policy</span>
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
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
              <ul className="dropdown-content z-[1] px-[16px] py-[23px] w-[248px] space-y-[23px] [&_svg]:text-purple-primary">
                <li className="flex space-x-2 items-center">
                  <TelegramIcon />{" "}
                  <a href={paths.getHelp()} target="_blank" rel="noopener noreferrer">
                    Get Help
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <BugIcon />{" "}
                  <a href={paths.bugReport()} target="_blank" rel="noopener noreferrer">
                    Report a Bug
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <BookIcon />{" "}
                  <a href={paths.dappGuide()} target="_blank" rel="noopener noreferrer">
                    DApp Guide
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <EthIcon />{" "}
                  <a href={paths.beginnerGuide()} target="_blank" rel="noopener noreferrer">
                    Crypto Beginner's Guide
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <QuestionIcon />{" "}
                  <a href={paths.faq()} target="_blank" rel="noopener noreferrer">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </header>
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
