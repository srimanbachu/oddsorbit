use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::Market;

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, has_one = vault)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_ata: Account<'info, TokenAccount>,

    /// The winning outcome mint, matched against market.outcome at runtime.
    #[account(mut)]
    pub winning_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_winning_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(_ctx: Context<ClaimWinnings>) -> Result<()> {
    // TODO: require market.outcome resolved; burn user's winning shares;
    // transfer pro-rata vault collateral to user.
    Ok(())
}
