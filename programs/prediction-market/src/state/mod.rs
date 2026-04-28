pub mod market;

pub use market::*;

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Outcome {
    Unresolved,
    Yes,
    No,
    Invalid,
}
