import { Link } from "react-router-dom";
import type { PublicKey } from "@solana/web3.js";

interface Props {
  address: PublicKey;
  question: string;
  endTs: number;
  totalCollateral: bigint;
}

export function MarketCard({ address, question, endTs, totalCollateral }: Props) {
  const ends = new Date(endTs * 1000).toLocaleDateString();
  return (
    <Link
      to={`/markets/${address.toBase58()}`}
      className="block rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-indigo-500 transition"
    >
      <h3 className="font-medium text-base mb-2 line-clamp-2">{question}</h3>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>Ends {ends}</span>
        <span>{(Number(totalCollateral) / 1e8).toFixed(4)} wBTC</span>
      </div>
    </Link>
  );
}
