import { Link } from "react-router-dom";
import { ConnectButton } from "../wallet/ConnectButton";
import { DevFaucet } from "../wallet/DevFaucet";
import { env } from "../../env";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          OddsOrbit
        </Link>
        {env.devMode && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            DEV MODE · Localnet
          </span>
        )}
      </div>
      <nav className="flex items-center gap-4 text-sm text-neutral-300">
        <Link to="/" className="hover:text-white">Markets</Link>
        <Link to="/portfolio" className="hover:text-white">Portfolio</Link>
        <Link
          to="/create"
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          Create Market
        </Link>
        <DevFaucet />
        <ConnectButton />
      </nav>
    </header>
  );
}
