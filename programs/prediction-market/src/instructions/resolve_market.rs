use anchor_lang::prelude::*;

use crate::errors::MarketError;
use crate::events::MarketResolved;
use crate::state::{Market, Outcome};

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    pub authority: Signer<'info>,

    #[account(mut, has_one = creator)]
    pub market: Account<'info, Market>,

    /// CHECK: matched against market.creator via has_one.
    pub creator: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<ResolveMarket>, outcome: Outcome) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require_keys_eq!(
        ctx.accounts.authority.key(),
        market.creator,
        MarketError::Unauthorized
    );
    require!(market.outcome == Outcome::Unresolved, MarketError::AlreadyResolved);
    require!(
        Clock::get()?.unix_timestamp >= market.end_ts,
        MarketError::MarketNotEnded
    );
    require!(
        matches!(outcome, Outcome::Yes | Outcome::No | Outcome::Invalid),
        MarketError::InvalidOutcome
    );

    market.outcome = outcome;
    emit!(MarketResolved { market: market.key(), outcome });
    Ok(())
}
