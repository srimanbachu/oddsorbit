import { useMarkets } from "../hooks/useMarkets";
import { MarketCard } from "../components/market/MarketCard";

export function MarketsPage() {
  const { data, isLoading, error } = useMarkets();

  if (isLoading) return <p className="p-6 text-neutral-400">Loading markets…</p>;
  if (error) return <p className="p-6 text-red-400">Failed to load markets.</p>;
  if (!data || data.length === 0) {
    return <p className="p-6 text-neutral-400">No active markets yet.</p>;
  }

  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Active Markets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((m: any) => (
          <MarketCard
            key={m.publicKey.toBase58()}
            address={m.publicKey}
            question={m.account.question}
            endTs={Number(m.account.endTs)}
            totalCollateral={BigInt(m.account.totalCollateral.toString())}
          />
        ))}
      </div>
    </section>
  );
}
