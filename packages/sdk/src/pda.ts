import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@oddsorbit/shared";

const enc = (s: string) => new TextEncoder().encode(s);

export function findMarketPda(creator: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBuf = new Uint8Array(8);
  new DataView(nonceBuf.buffer).setBigUint64(0, nonce, true);
  return PublicKey.findProgramAddressSync(
    [enc("market"), creator.toBuffer(), nonceBuf],
    PROGRAM_ID,
  );
}

export function findVaultPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([enc("vault"), market.toBuffer()], PROGRAM_ID);
}

export function findYesMintPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([enc("yes"), market.toBuffer()], PROGRAM_ID);
}

export function findNoMintPda(market: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([enc("no"), market.toBuffer()], PROGRAM_ID);
}
