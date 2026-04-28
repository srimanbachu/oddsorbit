import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useClient } from "../../lib/solana";
import { toBaseUnits, WBTC_DECIMALS, type Outcome } from "@oddsorbit/shared";

interface Props {
  market: PublicKey;
}

export function TradePanel({ market }: Props) {
  const client = useClient();
  const [outcome, setOutcome] = useState<Outcome>("Yes");
  const [amount, setAmount] = useState("0.001");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!client) return;
    setSubmitting(true);
    setError(null);
    try {
      await client.buyShares({
        market,
        outcome,
        amount: toBaseUnits(parseFloat(amount), WBTC_DECIMALS),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 w-full max-w-sm">
      <h3 className="font-medium mb-4">Place a trade</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["Yes", "No"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOutcome(o)}
            className={`py-2 rounded-md text-sm font-medium transition ${
              outcome === o
                ? o === "Yes"
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      <label className="block text-xs text-neutral-400 mb-1">Amount (wBTC)</label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500"
      />

      <button
        disabled={!client || submitting}
        onClick={submit}
        className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {!client ? "Connect wallet" : submitting ? "Submitting…" : `Buy ${outcome}`}
      </button>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </div>
  );
}
