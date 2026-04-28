use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::errors::MarketError;
use crate::events::SharesBought;
use crate::state::{Market, Outcome};

#[derive(Accounts)]
pub struct BuyShares<'info> {
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

    /// User ATA for the outcome token they're buying (YES or NO).
    #[account(mut)]
    pub user_outcome_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BuyShares>, outcome: Outcome, amount: u64) -> Result<()> {
    require!(matches!(outcome, Outcome::Yes | Outcome::No), MarketError::InvalidOutcome);
    {
        let market = &ctx.accounts.market;
        require!(market.outcome == Outcome::Unresolved, MarketError::AlreadyResolved);
        require!(
            Clock::get()?.unix_timestamp < market.end_ts,
            MarketError::MarketEnded
        );
    }

    // 1. Pull collateral from user → vault.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_collateral_ata.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. TODO: pricing curve. MVP = 1:1 mint of selected outcome.
    let shares_out = amount;

    // Copy data needed for signer seeds before re-borrowing accounts.
    let creator_key = ctx.accounts.market.creator;
    let nonce_bytes = ctx.accounts.market.nonce.to_le_bytes();
    let bump = ctx.accounts.market.bump;

    let seeds: &[&[u8]] = &[
        b"market",
        creator_key.as_ref(),
        nonce_bytes.as_ref(),
        std::slice::from_ref(&bump),
    ];
    let signer_seeds: &[&[&[u8]]] = &[seeds];

    let mint_to_account = match outcome {
        Outcome::Yes => ctx.accounts.yes_mint.to_account_info(),
        Outcome::No => ctx.accounts.no_mint.to_account_info(),
        _ => return err!(MarketError::InvalidOutcome),
    };

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: mint_to_account,
                to: ctx.accounts.user_outcome_ata.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        ),
        shares_out,
    )?;

    let market = &mut ctx.accounts.market;
    market.total_collateral = market
        .total_collateral
        .checked_add(amount)
        .ok_or(MarketError::MathOverflow)?;

    emit!(SharesBought {
        market: market.key(),
        user: ctx.accounts.user.key(),
        outcome,
        amount_in: amount,
        shares_out,
    });
    Ok(())
}
