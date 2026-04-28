use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::{Market, Outcome};

#[derive(Accounts)]
pub struct SellShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, has_one = vault, has_one = yes_mint, has_one = no_mint)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub yes_mint: Account<'info, Mint>,
    #[account(mut)]
    pub no_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_outcome_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(_ctx: Context<SellShares>, _outcome: Outcome, _shares: u64) -> Result<()> {
    // TODO: burn shares from user, transfer collateral back from vault using
    // the pricing curve. Mirror of buy_shares with reversed CPIs.
    Ok(())
}
