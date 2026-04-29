import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useClient } from "../lib/solana";

export type PortfolioOutcome = "Unresolved" | "Yes" | "No" | "Invalid";

function decodeOutcome(raw: any): PortfolioOutcome {
  if (!raw) return "Unresolved";
  if ("yes" in raw) return "Yes";
  if ("no" in raw) return "No";
  if ("invalid" in raw) return "Invalid";
  return "Unresolved";
}

function readSplAmount(data: Buffer): bigint {
  // SPL Token account layout: amount is at offset 64, u64 little-endian.
  return data.readBigUInt64LE(64);
}

export interface Position {
  market: PublicKey;
  question: string;
  endTs: number;
  outcome: PortfolioOutcome;
  yesBalance: bigint;
  noBalance: bigint;
}

export function usePositions() {
  const client = useClient();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery<Position[]>({
    queryKey: ["positions", publicKey?.toBase58() ?? null],
    enabled: !!client && !!publicKey,
    queryFn: async () => {
      if (!client || !publicKey) return [];
      const markets = await client.fetchAllMarkets();
      if (markets.length === 0) return [];

      const atas: PublicKey[] = [];
      for (const m of markets) {
        atas.push(getAssociatedTokenAddressSync(m.account.yesMint, publicKey));
        atas.push(getAssociatedTokenAddressSync(m.account.noMint, publicKey));
      }

      // Batch all ATA reads (chunked at 100 — RPC limit).
      const chunks: PublicKey[][] = [];
      for (let i = 0; i < atas.length; i += 100) chunks.push(atas.slice(i, i + 100));
      const infos = (
        await Promise.all(chunks.map((c) => connection.getMultipleAccountsInfo(c)))
      ).flat();

      return markets
        .map((m, i): Position => {
          const yesInfo = infos[i * 2];
          const noInfo = infos[i * 2 + 1];
          const yesBalance = yesInfo ? readSplAmount(yesInfo.data as Buffer) : 0n;
          const noBalance = noInfo ? readSplAmount(noInfo.data as Buffer) : 0n;
          return {
            market: m.publicKey,
            question: m.account.question,
            endTs: Number(m.account.endTs),
            outcome: decodeOutcome(m.account.outcome),
            yesBalance,
            noBalance,
          };
        })
        .filter((p) => p.yesBalance > 0n || p.noBalance > 0n);
    },
  });
}
