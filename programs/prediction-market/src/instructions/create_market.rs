use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::MarketError;
use crate::events::MarketCreated;
use crate::state::{Market, Outcome, MAX_QUESTION_LEN};

#[derive(Accounts)]
#[instruction(question: String, end_ts: i64, nonce: u64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = Market::SPACE,
        seeds = [b"market", creator.key().as_ref(), &nonce.to_le_bytes()],
        bump,
    )]
    pub market: Account<'info, Market>,

    pub collateral_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = market,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        seeds = [b"yes", market.key().as_ref()],
        bump,
        mint::decimals = collateral_mint.decimals,
        mint::authority = market,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [b"no", market.key().as_ref()],
        bump,
        mint::decimals = collateral_mint.decimals,
        mint::authority = market,
    )]
    pub no_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateMarket>,
    question: String,
    end_ts: i64,
    nonce: u64,
) -> Result<()> {
    require!(question.len() <= MAX_QUESTION_LEN, MarketError::QuestionTooLong);
    require!(end_ts > Clock::get()?.unix_timestamp, MarketError::MarketEnded);

    let m = &mut ctx.accounts.market;
    m.version = 1;
    m.bump = ctx.bumps.market;
    m.vault_bump = ctx.bumps.vault;
    m.creator = ctx.accounts.creator.key();
    m.collateral_mint = ctx.accounts.collateral_mint.key();
    m.vault = ctx.accounts.vault.key();
    m.yes_mint = ctx.accounts.yes_mint.key();
    m.no_mint = ctx.accounts.no_mint.key();
    m.end_ts = end_ts;
    m.outcome = Outcome::Unresolved;
    m.total_collateral = 0;
    m.nonce = nonce;
    m.question = question;

    emit!(MarketCreated {
        market: m.key(),
        creator: m.creator,
        end_ts,
    });
    Ok(())
}
