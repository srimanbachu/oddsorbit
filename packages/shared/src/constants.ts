import { PublicKey } from "@solana/web3.js";

// Placeholder — replace with actual deployed program ID via `anchor keys sync`.
export const PROGRAM_ID = new PublicKey(
  "11111111111111111111111111111111",
);

// wBTC on Solana (Wormhole-wrapped). Override via env in production.
export const WBTC_MINT = new PublicKey(
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDPcaBim",
);

export const WBTC_DECIMALS = 8;
