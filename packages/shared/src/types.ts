import type { PublicKey } from "@solana/web3.js";

export type Outcome = "Unresolved" | "Yes" | "No" | "Invalid";

export interface Market {
  address: PublicKey;
  creator: PublicKey;
  question: string;
  endTs: number;
  outcome: Outcome;
  totalCollateral: bigint;
  yesMint: PublicKey;
  noMint: PublicKey;
  vault: PublicKey;
  collateralMint: PublicKey;
}

export interface Position {
  market: PublicKey;
  yesShares: bigint;
  noShares: bigint;
}
