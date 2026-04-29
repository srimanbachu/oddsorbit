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
  readonly program: Program<Idl>;
  readonly provider: AnchorProvider;

  constructor(connection: Connection, wallet: WalletLike) {
    this.provider = new AnchorProvider(connection, wallet as never, {
      commitment: "confirmed",
    });
    this.program = new Program(idlJson as Idl, this.provider);

    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[oddsorbit] program.methods:", Object.keys(this.program.methods ?? {}));
      // eslint-disable-next-line no-console
      console.log("[oddsorbit] programId:", this.program.programId.toBase58());
    }
  }

  // Anchor builds the methods namespace as a Proxy where each call returns a
  // new MethodsBuilder. We must call `this.program.methods.<name>(...)`
  // directly — destructuring or storing the method in a local breaks the
  // proxy's `this` binding and yields "method is not a function".
  private get m(): any {
    return this.program.methods;
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

    return this.m
      .createMarket(params.question, new BN(params.endTs), new BN(params.nonce.toString()))
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
    return this.m
      .buyShares(outcomeArg, new BN(params.amount.toString()))
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

  async sellShares(params: {
    market: PublicKey;
    outcome: Extract<Outcome, "Yes" | "No">;
    shares: bigint;
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
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        userCollateralAta,
        user,
        collateralMint,
      ),
    ];

    const outcomeArg = { [params.outcome.toLowerCase()]: {} };
    return this.m
      .sellShares(outcomeArg, new BN(params.shares.toString()))
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

  async claimWinnings(params: {
    market: PublicKey;
    winningOutcome: Extract<Outcome, "Yes" | "No">;
    collateralMint?: PublicKey;
  }): Promise<string> {
    const user = this.provider.publicKey!;
    const collateralMint = params.collateralMint ?? WBTC_MINT;
    const [vault] = findVaultPda(params.market);
    const [yesMint] = findYesMintPda(params.market);
    const [noMint] = findNoMintPda(params.market);
    const winningMint = params.winningOutcome === "Yes" ? yesMint : noMint;

    const userCollateralAta = getAssociatedTokenAddressSync(collateralMint, user);
    const userWinningAta = getAssociatedTokenAddressSync(winningMint, user);

    const pre: TransactionInstruction[] = [
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        userCollateralAta,
        user,
        collateralMint,
      ),
    ];

    return this.m
      .claimWinnings()
      .accounts({
        user,
        market: params.market,
        vault,
        userCollateralAta,
        winningMint,
        userWinningAta,
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
