import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClient } from "../lib/solana";
import { findMarketPda } from "@oddsorbit/sdk";
import { env } from "../env";

const FIVE_MINUTES_SECONDS = 5 * 60;

function randomNonce(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; signature: string };

export function CreateMarketPage() {
  const client = useClient();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    const trimmed = question.trim();
    if (trimmed.length < 8) {
      setStatus({ kind: "error", message: "Question must be at least 8 characters." });
      return;
    }
    if (trimmed.length > 200) {
      setStatus({ kind: "error", message: "Question must be at most 200 characters." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const endTs = Math.floor(Date.now() / 1000) + FIVE_MINUTES_SECONDS;
      const nonce = randomNonce();
      const creator = client.provider.publicKey!;
      const [marketPda] = findMarketPda(creator, nonce);

      const signature = await client.createMarket({
        question: trimmed,
        endTs,
        nonce,
        collateralMint: env.wbtcMint,
      });

      setStatus({ kind: "success", signature });
      navigate(`/markets/${marketPda.toBase58()}`);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to create market.",
      });
    }
  };

  const submitting = status.kind === "submitting";

  return (
    <section className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Create Market</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Markets resolve 5 minutes after creation for testing.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm text-neutral-300 mb-1">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Will BTC close above $100k by EOD?"'
            disabled={submitting}
            maxLength={200}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <p className="text-xs text-neutral-500 mt-1">{question.length}/200</p>
        </div>

        <div className="rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-400">
          End time: <span className="text-neutral-200">5 minutes from creation</span>
        </div>

        <button
          type="submit"
          disabled={!client || submitting}
          className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {!client ? "Connect wallet" : submitting ? "Creating market…" : "Create Market"}
        </button>

        {status.kind === "error" && (
          <p className="text-sm text-red-400">{status.message}</p>
        )}
        {status.kind === "success" && (
          <p className="text-sm text-emerald-400">
            Market created. Redirecting…
          </p>
        )}
      </form>
    </section>
  );
}
