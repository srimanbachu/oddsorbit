use anchor_lang::prelude::*;

#[error_code]
pub enum MarketError {
    #[msg("Market has already ended")]
    MarketEnded,
    #[msg("Market has not yet ended")]
    MarketNotEnded,
    #[msg("Market is already resolved")]
    AlreadyResolved,
    #[msg("Market is not yet resolved")]
    NotResolved,
    #[msg("Question string exceeds max length")]
    QuestionTooLong,
    #[msg("Insufficient liquidity in vault")]
    InsufficientLiquidity,
    #[msg("Invalid outcome for this operation")]
    InvalidOutcome,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
}
