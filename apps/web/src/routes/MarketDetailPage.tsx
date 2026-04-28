import { useParams } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { TradePanel } from "../components/market/TradePanel";

export function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <p className="p-6">Market not found.</p>;
  const market = new PublicKey(id);

  return (
    <section className="p-6 grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-4">Market {id.slice(0, 8)}…</h1>
        <p className="text-neutral-400 text-sm">
          Detailed market view: question, current YES/NO prices, position, and history go here.
        </p>
      </div>
      <TradePanel market={market} />
    </section>
  );
}
