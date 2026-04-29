import { Link } from "react-router-dom";
import { ConnectButton } from "../wallet/ConnectButton";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
      <Link to="/" className="text-xl font-semibold tracking-tight">
        OddsOrbit
      </Link>
      <nav className="flex items-center gap-6 text-sm text-neutral-300">
        <Link to="/" className="hover:text-white">Markets</Link>
        <Link to="/portfolio" className="hover:text-white">Portfolio</Link>
        <Link
          to="/create"
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          Create Market
        </Link>
        <ConnectButton />
      </nav>
    </header>
  );
}
