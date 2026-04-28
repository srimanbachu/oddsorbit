use anchor_lang::prelude::*;
use super::Outcome;

pub const MAX_QUESTION_LEN: usize = 200;

#[account]
pub struct Market {
    pub version: u8,
    pub bump: u8,
    pub vault_bump: u8,
    pub creator: Pubkey,
    pub collateral_mint: Pubkey,   // wBTC mint
    pub vault: Pubkey,             // PDA token account holding wBTC
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub end_ts: i64,
    pub outcome: Outcome,
    pub total_collateral: u64,
    pub nonce: u64,
    pub question: String,
}

impl Market {
    /// Discriminator + fixed fields + 4-byte string prefix + max question bytes.
    pub const SPACE: usize = 8
        + 1 + 1 + 1
        + 32 * 5
        + 8 + 1 + 8 + 8
        + 4 + MAX_QUESTION_LEN;
}
