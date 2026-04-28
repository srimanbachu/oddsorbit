export const env = {
  rpcUrl: import.meta.env.VITE_RPC_URL ?? "https://api.devnet.solana.com",
  cluster: (import.meta.env.VITE_CLUSTER ?? "devnet") as
    | "devnet"
    | "mainnet-beta"
    | "localnet",
};
