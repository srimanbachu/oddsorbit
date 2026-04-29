use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::errors::MarketError;
use crate::events::SharesSold;
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

    /// The user's ATA for the side they are selling.
    #[account(mut)]
    pub user_outcome_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<SellShares>, outcome: Outcome, shares: u64) -> Result<()> {
    require!(shares > 0, MarketError::ZeroAmount);
    require!(
        matches!(outcome, Outcome::Yes | Outcome::No),
        MarketError::InvalidOutcome
    );

    {
        let market = &ctx.accounts.market;
        require!(
            market.outcome == Outcome::Unresolved,
            MarketError::AlreadyResolved
        );
    }

    // Validate the user's outcome ATA belongs to the requested side and has
    // enough balance.
    let expected_mint = match outcome {
        Outcome::Yes => ctx.accounts.market.yes_mint,
        Outcome::No => ctx.accounts.market.no_mint,
        _ => return err!(MarketError::InvalidOutcome),
    };
    require_keys_eq!(
        ctx.accounts.user_outcome_ata.mint,
        expected_mint,
        MarketError::InvalidOutcome
    );
    require!(
        ctx.accounts.user_outcome_ata.amount >= shares,
        MarketError::InsufficientShares
    );

    // 1:1 pricing — payout equals shares. Vault must cover it.
    let payout = shares;
    require!(
        ctx.accounts.vault.amount >= payout,
        MarketError::InsufficientLiquidity
    );

    // 1. Burn user's outcome tokens.
    let mint_to_burn = match outcome {
        Outcome::Yes => ctx.accounts.yes_mint.to_account_info(),
        Outcome::No => ctx.accounts.no_mint.to_account_info(),
        _ => return err!(MarketError::InvalidOutcome),
    };
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: mint_to_burn,
                from: ctx.accounts.user_outcome_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        shares,
    )?;

    // 2. Transfer wBTC out of vault to user, signed by market PDA.
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

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_collateral_ata.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        ),
        payout,
    )?;

    // 3. Decrement accounting.
    let market = &mut ctx.accounts.market;
    market.total_collateral = market
        .total_collateral
        .checked_sub(payout)
        .ok_or(MarketError::MathOverflow)?;

    emit!(SharesSold {
        market: market.key(),
        user: ctx.accounts.user.key(),
        outcome,
        shares_in: shares,
        amount_out: payout,
    });
    Ok(())
}
