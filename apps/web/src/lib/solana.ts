import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PredictionMarketClient, type WalletLike } from "@oddsorbit/sdk";

export function useClient(): PredictionMarketClient | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    const walletLike = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
    } as unknown as WalletLike;
    return new PredictionMarketClient(connection, walletLike);
  }, [connection, wallet]);
}
