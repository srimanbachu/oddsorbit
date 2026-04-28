import { AnchorProvider, Program, BN, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { WBTC_MINT, type Outcome } from "@oddsorbit/shared";
import { findMarketPda, findVaultPda, findYesMintPda, findNoMintPda } from "./pda";

import idlJson from "./idl/prediction_market.json";

export interface WalletLike {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction>(txs: T[]) => Promise<T[]>;
}

export class PredictionMarketClient {
  // Typed loosely until the IDL is generated via `bun run sdk:generate`.
  readonly program: Program<Idl>;
  readonly provider: AnchorProvider;

  constructor(connection: Connection, wallet: WalletLike) {
    this.provider = new AnchorProvider(connection, wallet as never, {
      commitment: "confirmed",
    });
    this.program = new Program(idlJson as Idl, this.provider);
  }

  async createMarket(params: {
    question: string;
    endTs: number;
    nonce: bigint;
    collateralMint?: PublicKey;
  }): Promise<string> {
    const creator = this.provider.publicKey!;
    const collateralMint = params.collateralMint ?? WBTC_MINT;
    const [market] = findMarketPda(creator, params.nonce);
    const [vault] = findVaultPda(market);
    const [yesMint] = findYesMintPda(market);
    const [noMint] = findNoMintPda(market);

    const methods = (this.program.methods as any).createMarket;
    return methods(
      params.question,
      new BN(params.endTs),
      new BN(params.nonce.toString()),
    )
      .accounts({
        creator,
        market,
        collateralMint,
        vault,
        yesMint,
        noMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }

  async buyShares(params: {
    market: PublicKey;
    outcome: Outcome;
    amount: bigint;
    collateralMint?: PublicKey;
  }): Promise<string> {
    const user = this.provider.publicKey!;
    const collateralMint = params.collateralMint ?? WBTC_MINT;
    const [vault] = findVaultPda(params.market);
    const [yesMint] = findYesMintPda(params.market);
    const [noMint] = findNoMintPda(params.market);
    const outcomeMint = params.outcome === "Yes" ? yesMint : noMint;

    const userCollateralAta = getAssociatedTokenAddressSync(collateralMint, user);
    const userOutcomeAta = getAssociatedTokenAddressSync(outcomeMint, user);

    const pre: TransactionInstruction[] = [
      createAssociatedTokenAccountIdempotentInstruction(user, userOutcomeAta, user, outcomeMint),
    ];

    const outcomeArg = { [params.outcome.toLowerCase()]: {} };
    const methods = (this.program.methods as any).buyShares;
    return methods(outcomeArg, new BN(params.amount.toString()))
      .accounts({
        user,
        market: params.market,
        vault,
        userCollateralAta,
        yesMint,
        noMint,
        userOutcomeAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(pre)
      .rpc();
  }

  async fetchAllMarkets(): Promise<Array<{ publicKey: PublicKey; account: any }>> {
    const ns = (this.program.account as any).market;
    if (!ns) return [];
    return ns.all();
  }

  async fetchMarket(address: PublicKey): Promise<any> {
    const ns = (this.program.account as any).market;
    if (!ns) return null;
    return ns.fetch(address);
  }
}
