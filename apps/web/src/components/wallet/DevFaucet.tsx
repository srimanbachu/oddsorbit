import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { env } from "../../env";
import { WBTC_DECIMALS } from "@oddsorbit/shared";

const DRIP_AMOUNT = 1n * 10n ** BigInt(WBTC_DECIMALS); // 1 mock wBTC

function loadFaucet(): Keypair | null {
  if (!env.devFaucetSecretHex) return null;
  try {
    const bytes = Uint8Array.from(Buffer.from(env.devFaucetSecretHex, "hex"));
    return Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

async function drip(opts: {
  connection: ReturnType<typeof useConnection>["connection"];
  faucet: Keypair;
  recipient: import("@solana/web3.js").PublicKey;
}) {
  const ata = getAssociatedTokenAddressSync(env.wbtcMint, opts.recipient);
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      opts.faucet.publicKey,
      ata,
      opts.recipient,
      env.wbtcMint,
    ),
    createMintToInstruction(env.wbtcMint, ata, opts.faucet.publicKey, DRIP_AMOUNT),
  );
  tx.feePayer = opts.faucet.publicKey;
  const { blockhash } = await opts.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(opts.faucet);
  const sig = await opts.connection.sendRawTransaction(tx.serialize());
  await opts.connection.confirmTransaction(sig, "confirmed");
}

export function DevFaucet() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoMinted = useRef(false);

  if (!env.devMode || !env.devFaucetSecretHex) return null;

  // Auto-mint once per connected wallet if their wBTC ATA is empty.
  useEffect(() => {
    if (!publicKey || autoMinted.current) return;
    autoMinted.current = true;
    (async () => {
      try {
        const ata = getAssociatedTokenAddressSync(env.wbtcMint, publicKey);
        try {
          const acc = await getAccount(connection, ata);
          if (acc.amount > 0n) return;
        } catch {
          // ATA doesn't exist yet — drip will create it.
        }
        const faucet = loadFaucet();
        if (!faucet) return;
        await drip({ connection, faucet, recipient: publicKey });
      } catch (e) {
        // Silent — user can still click the button manually.
        console.warn("[dev-faucet] auto-mint failed:", e);
      }
    })();
  }, [publicKey, connection]);

  const handleClick = async () => {
    if (!publicKey) return;
    const faucet = loadFaucet();
    if (!faucet) {
      setError("Invalid VITE_DEV_FAUCET_SECRET");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await drip({ connection, faucet, recipient: publicKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drip failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={!publicKey || pending}
        className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
        title="Mint 1 mock wBTC to the connected wallet (localnet only)"
      >
        {pending ? "Minting…" : "Drip 1 wBTC"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
