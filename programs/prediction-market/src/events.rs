use anchor_lang::prelude::*;
use crate::state::Outcome;

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub creator: Pubkey,
    pub end_ts: i64,
}

#[event]
pub struct SharesBought {
    pub market: Pubkey,
    pub user: Pubkey,
    pub outcome: Outcome,
    pub amount_in: u64,
    pub shares_out: u64,
}

#[event]
pub struct SharesSold {
    pub market: Pubkey,
    pub user: Pubkey,
    pub outcome: Outcome,
    pub shares_in: u64,
    pub amount_out: u64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub outcome: Outcome,
}

#[event]
pub struct WinningsClaimed {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}
