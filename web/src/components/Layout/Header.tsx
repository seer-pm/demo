import ConnectWallet from "@/components/ConnectWallet";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <nav className="navbar justify-between bg-blue-primary text-neutral-content">
        <a className="btn btn-neutral text-lg" href="/">
          Seer
        </a>

        <div className="dropdown dropdown-end sm:hidden">
          <button className="btn btn-ghost" type="button">
            <Bars3Icon className="h-6 w-6 text-neutral-content" />
          </button>

          <ul className="dropdown-content z-[1] bg-neutral p-6 rounded-box shadow w-56 gap-2">
            <li>
              <Link to={"/create-market"}>Create Market</Link>
            </li>
          </ul>
        </div>

        <ul className="hidden sm:menu-horizontal gap-2">
          <li>
            <Link to={"/create-market"}>Create Market</Link>
          </li>
          <li>
            <ConnectWallet />
          </li>
        </ul>
      </nav>
    </header>
  );
}
