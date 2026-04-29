import { useWallet } from "@solana/wallet-adapter-react";
import { usePositions, type Position } from "../hooks/usePositions";
import { PositionCard } from "../components/market/PositionCard";

export function PortfolioPage() {
  const { publicKey } = useWallet();
  const { data, isLoading, error } = usePositions();

  if (!publicKey) {
    return (
      <section className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Portfolio</h1>
        <p className="text-neutral-400">Connect your wallet to see your positions.</p>
      </section>
    );
  }

  if (isLoading) {
    return <p className="p-6 text-neutral-400">Loading positions…</p>;
  }
  if (error) {
    return <p className="p-6 text-red-400">Failed to load positions.</p>;
  }
  if (!data || data.length === 0) {
    return (
      <section className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Portfolio</h1>
        <p className="text-neutral-400">No positions yet. Buy YES or NO on a market to get started.</p>
      </section>
    );
  }

  const active = data.filter((p) => p.outcome === "Unresolved");
  const resolved = data.filter((p) => p.outcome !== "Unresolved");

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Portfolio</h1>

      <PositionGroup title="Active" positions={active} emptyText="No active positions." />
      <PositionGroup title="Resolved" positions={resolved} emptyText="No resolved positions." />
    </section>
  );
}

function PositionGroup({
  title,
  positions,
  emptyText,
}: {
  title: string;
  positions: Position[];
  emptyText: string;
}) {
  return (
    <div>
      <h2 className="text-sm uppercase tracking-wider text-neutral-400 mb-3">
        {title} ({positions.length})
      </h2>
      {positions.length === 0 ? (
        <p className="text-neutral-500 text-sm">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {positions.map((p) => (
            <PositionCard key={p.market.toBase58()} position={p} />
          ))}
        </div>
      )}
    </div>
  );
}
