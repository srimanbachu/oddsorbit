use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::errors::MarketError;
use crate::events::WinningsClaimed;
use crate::state::{Market, Outcome};

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, has_one = vault)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    /// User's wBTC ATA — receives the payout.
    #[account(mut)]
    pub user_collateral_ata: Account<'info, TokenAccount>,

    /// The winning outcome mint. Verified in the handler against `market.outcome`.
    #[account(mut)]
    pub winning_mint: Account<'info, Mint>,

    /// User's ATA holding the winning outcome tokens (will be burned).
    #[account(mut)]
    pub user_winning_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let market = &ctx.accounts.market;

    // Must be resolved with a payable outcome (Yes/No only — Invalid is not claimable in MVP).
    let expected_winning_mint = match market.outcome {
        Outcome::Yes => market.yes_mint,
        Outcome::No => market.no_mint,
        Outcome::Unresolved => return err!(MarketError::NotResolved),
        Outcome::Invalid => return err!(MarketError::NotClaimable),
    };

    // The mint passed in must be the actual winning side.
    require_keys_eq!(
        ctx.accounts.winning_mint.key(),
        expected_winning_mint,
        MarketError::WrongWinningMint
    );

    // The user's winning ATA must be for that mint (also enforced by SPL on burn,
    // but checked explicitly for a clear error).
    require_keys_eq!(
        ctx.accounts.user_winning_ata.mint,
        expected_winning_mint,
        MarketError::WrongWinningMint
    );

    let user_shares = ctx.accounts.user_winning_ata.amount;
    require!(user_shares > 0, MarketError::NothingToClaim);

    let total_winning_supply = ctx.accounts.winning_mint.supply;
    require!(total_winning_supply > 0, MarketError::NothingToClaim);

    let vault_balance = ctx.accounts.vault.amount;
    require!(vault_balance > 0, MarketError::InsufficientLiquidity);

    // payout = vault_balance * user_shares / total_winning_supply  (checked, u128 intermediate)
    let payout_u128 = (vault_balance as u128)
        .checked_mul(user_shares as u128)
        .ok_or(MarketError::MathOverflow)?
        .checked_div(total_winning_supply as u128)
        .ok_or(MarketError::MathOverflow)?;
    let payout: u64 = payout_u128
        .try_into()
        .map_err(|_| MarketError::MathOverflow)?;
    require!(payout > 0, MarketError::NothingToClaim);

    // 1. Burn the user's winning shares first — prevents double-claiming even if
    //    the same instruction is replayed within a tx because the ATA is now zero.
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.winning_mint.to_account_info(),
                from: ctx.accounts.user_winning_ata.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        user_shares,
    )?;

    // 2. Transfer pro-rata wBTC from vault, signed by the market PDA.
    let creator_key = market.creator;
    let nonce_bytes = market.nonce.to_le_bytes();
    let bump = market.bump;
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

    // 3. Decrement market accounting (checked).
    let market_mut = &mut ctx.accounts.market;
    market_mut.total_collateral = market_mut
        .total_collateral
        .checked_sub(payout)
        .ok_or(MarketError::MathOverflow)?;

    emit!(WinningsClaimed {
        market: market_mut.key(),
        user: ctx.accounts.user.key(),
        amount: payout,
    });
    Ok(())
}
