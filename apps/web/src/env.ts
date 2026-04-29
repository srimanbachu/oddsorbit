import { PublicKey } from "@solana/web3.js";
import { WBTC_MINT as DEFAULT_WBTC_MINT } from "@oddsorbit/shared";

const wbtcMintEnv = import.meta.env.VITE_WBTC_MINT as string | undefined;

export const env = {
  rpcUrl: (import.meta.env.VITE_RPC_URL as string | undefined) ?? "https://api.devnet.solana.com",
  cluster: ((import.meta.env.VITE_CLUSTER as string | undefined) ?? "devnet") as
    | "devnet"
    | "mainnet-beta"
    | "localnet",
  devMode: import.meta.env.VITE_DEV_MODE === "true",
  /** Hex-encoded 64-byte secret key of the localnet mock-wBTC mint authority. */
  devFaucetSecretHex: import.meta.env.VITE_DEV_FAUCET_SECRET as string | undefined,
  /** wBTC (or mock) mint to use as collateral. Falls back to mainnet wBTC. */
  wbtcMint: wbtcMintEnv ? new PublicKey(wbtcMintEnv) : DEFAULT_WBTC_MINT,
};
