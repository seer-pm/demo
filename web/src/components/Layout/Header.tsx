import ConnectWallet from "@/components/ConnectWallet";
import { BookIcon, BugIcon, EthIcon, QuestionIcon, TelegramIcon } from "@/lib/icons";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <nav className="navbar justify-between bg-blue-primary px-[24px] text-white">
        <div className="w-1/3">
          <Link className="text-white" to="/">
            Seer
          </Link>
        </div>

        <div className="dropdown dropdown-end sm:hidden">
          <button className="btn btn-ghost" type="button">
            <Bars3Icon className="h-6 w-6" />
          </button>

          <ul className="dropdown-content z-[1] bg-neutral p-6 rounded-box shadow w-56 gap-2">
            <li>
              <Link to={"/"}>Markets</Link>
            </li>
            <li>
              <Link to={"/create-market"}>Create Market</Link>
            </li>
          </ul>
        </div>

        <ul className="hidden sm:menu-horizontal gap-2 text-[16px] font-semibold space-x-[32px] justify-center w-1/3">
          <li>
            <Link to={"/"}>Markets</Link>
          </li>
          <li>
            <Link to={"/create-market"}>Create Market</Link>
          </li>
        </ul>

        <ul className="hidden sm:menu-horizontal gap-[16px] justify-end w-1/3">
          <li>
            <ConnectWallet />
          </li>
          <li className="flex items-center">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button">
                <QuestionIcon />
              </div>
              <ul className="dropdown-content z-[1] px-[16px] py-[23px] shadow bg-base-100 rounded-[3px] w-[248px] text-black text-[16px] space-y-[23px] [&_svg]:text-purple-primary">
                <li className="flex space-x-2 items-center">
                  <TelegramIcon />{" "}
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Get Help
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <BugIcon />{" "}
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Report a Bug
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <BookIcon />{" "}
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    DApp Guide
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <EthIcon />{" "}
                  <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer">
                    Crypto Beginner's Guide
                  </a>
                </li>
                <li className="flex space-x-2 items-center">
                  <QuestionIcon />{" "}
                  <a href="#" target="_blank" rel="noopener noreferrer">
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
