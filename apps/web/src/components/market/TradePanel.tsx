import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useClient } from "../../lib/solana";
import { toBaseUnits, WBTC_DECIMALS, type Outcome } from "@oddsorbit/shared";
import { env } from "../../env";

type Side = Extract<Outcome, "Yes" | "No">;
type Mode = "Buy" | "Sell";

interface Props {
  market: PublicKey;
}

export function TradePanel({ market }: Props) {
  const client = useClient();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("Buy");
  const [outcome, setOutcome] = useState<Side>("Yes");
  const [amount, setAmount] = useState("0.001");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    if (!client) return;
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const baseUnits = toBaseUnits(parsed, WBTC_DECIMALS);
      if (mode === "Buy") {
        await client.buyShares({
          market,
          outcome,
          amount: baseUnits,
          collateralMint: env.wbtcMint,
        });
        setSuccess(`Bought ${parsed} ${outcome} shares.`);
      } else {
        await client.sellShares({
          market,
          outcome,
          shares: baseUnits,
          collateralMint: env.wbtcMint,
        });
        setSuccess(`Sold ${parsed} ${outcome} shares.`);
      }
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  const cta = !client
    ? "Connect wallet"
    : submitting
      ? "Submitting…"
      : `${mode} ${outcome}`;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 w-full max-w-sm">
      <div className="grid grid-cols-2 gap-1 mb-4 bg-neutral-950 rounded-md p-1">
        {(["Buy", "Sell"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
              setSuccess(null);
            }}
            className={`py-1.5 rounded-md text-sm font-medium transition ${
              mode === m
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

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

      <label className="block text-xs text-neutral-400 mb-1">
        {mode === "Buy" ? "Amount (wBTC)" : "Shares to sell"}
      </label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={submitting}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      />

      <button
        disabled={!client || submitting}
        onClick={submit}
        className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {cta}
      </button>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      {success && <p className="text-xs text-emerald-400 mt-3">{success}</p>}
    </div>
  );
}
