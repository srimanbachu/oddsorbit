# OddsOrbit

Solana prediction-market dApp collateralized in wBTC.

## Stack
- **Program**: Anchor 0.30 (Rust) — `programs/prediction-market`
- **SDK**: TS client wrapping Anchor IDL — `packages/sdk`
- **Web**: React + Vite + Tailwind + wallet-adapter — `apps/web`
- **Shared**: types + constants — `packages/shared`

## Setup

```bash
bun install
anchor build
bun run sdk:generate          # populate packages/sdk/src/idl
bun run --cwd apps/web dev
```

Configure `apps/web/.env` from `.env.example`.

## MVP Scope
- Create market, buy YES/NO at 1:1 (pricing curve TODO)
- Wallet connect (Phantom, Solflare)
- Markets list + detail page with trade panel

## Next
- Implement LMSR/CPMM pricing in `buy_shares` / `sell_shares`
- Implement `claim_winnings` pro-rata payout
- Portfolio page reading user YES/NO ATAs
- Indexer (deferred)
