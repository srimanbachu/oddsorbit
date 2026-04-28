use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use state::Outcome;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod prediction_market {
    use super::*;

    /// Create a new prediction market backed by wBTC collateral.
    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        end_ts: i64,
        nonce: u64,
    ) -> Result<()> {
        instructions::create_market::handler(ctx, question, end_ts, nonce)
    }

    /// Buy YES or NO shares by depositing wBTC into the market vault.
    pub fn buy_shares(ctx: Context<BuyShares>, outcome: Outcome, amount: u64) -> Result<()> {
        instructions::buy_shares::handler(ctx, outcome, amount)
    }

    /// Sell YES or NO shares back to the market for wBTC.
    pub fn sell_shares(ctx: Context<SellShares>, outcome: Outcome, shares: u64) -> Result<()> {
        instructions::sell_shares::handler(ctx, outcome, shares)
    }

    /// Resolve a market with a final outcome (admin/oracle only).
    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: Outcome) -> Result<()> {
        instructions::resolve_market::handler(ctx, outcome)
    }

    /// Burn winning shares and redeem the user's pro-rata share of the vault.
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }
}
