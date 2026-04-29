import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatBtc, WBTC_DECIMALS } from "@oddsorbit/shared";
import { useClient } from "../../lib/solana";
import type { Position } from "../../hooks/usePositions";

interface Props {
  position: Position;
}

export function PositionCard({ position }: Props) {
  const client = useClient();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const isResolved = position.outcome === "Yes" || position.outcome === "No";
  const winningSide = position.outcome as "Yes" | "No";
  const winningShares =
    position.outcome === "Yes"
      ? position.yesBalance
      : position.outcome === "No"
        ? position.noBalance
        : 0n;
  const canClaim = isResolved && winningShares > 0n;

  const claim = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Wallet not connected");
      return client.claimWinnings({
        market: position.market,
        winningOutcome: winningSide,
      });
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Claim failed");
    },
  });

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <Link
          to={`/markets/${position.market.toBase58()}`}
          className="font-medium hover:text-indigo-400 line-clamp-2"
        >
          {position.question}
        </Link>
        <StatusBadge outcome={position.outcome} endTs={position.endTs} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <BalanceRow label="YES" amount={position.yesBalance} accent="emerald" />
        <BalanceRow label="NO" amount={position.noBalance} accent="rose" />
      </div>

      {isResolved && (
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {canClaim
              ? `${formatBtc(winningShares, WBTC_DECIMALS)} winning shares`
              : "No winnings to claim"}
          </span>
          <button
            onClick={() => claim.mutate()}
            disabled={!canClaim || !client || claim.isPending}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
          >
            {claim.isPending ? "Claiming…" : "Claim"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

function BalanceRow({
  label,
  amount,
  accent,
}: {
  label: string;
  amount: bigint;
  accent: "emerald" | "rose";
}) {
  const color = accent === "emerald" ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="bg-neutral-950 rounded-md px-3 py-2 flex items-center justify-between">
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      <span className="text-neutral-200">{formatBtc(amount, WBTC_DECIMALS)}</span>
    </div>
  );
}

function StatusBadge({
  outcome,
  endTs,
}: {
  outcome: Position["outcome"];
  endTs: number;
}) {
  if (outcome === "Yes") {
    return <Badge className="bg-emerald-600/20 text-emerald-400">Resolved · YES</Badge>;
  }
  if (outcome === "No") {
    return <Badge className="bg-rose-600/20 text-rose-400">Resolved · NO</Badge>;
  }
  if (outcome === "Invalid") {
    return <Badge className="bg-neutral-700/40 text-neutral-300">Invalid</Badge>;
  }
  const ended = Date.now() / 1000 >= endTs;
  return ended ? (
    <Badge className="bg-amber-600/20 text-amber-400">Awaiting resolve</Badge>
  ) : (
    <Badge className="bg-indigo-600/20 text-indigo-300">Active</Badge>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
