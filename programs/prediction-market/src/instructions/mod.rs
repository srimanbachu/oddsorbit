pub mod buy_shares;
pub mod claim_winnings;
pub mod create_market;
pub mod resolve_market;
pub mod sell_shares;

// Glob re-exports are required so `#[derive(Accounts)]`-generated helper
// modules (e.g. `__cpi_client_accounts_*`) are reachable from the program
// dispatcher. The duplicate `handler` symbol from each module is intentional —
// callers always use the fully-qualified path `instructions::<ix>::handler`.
#[allow(ambiguous_glob_reexports)]
pub use buy_shares::*;
#[allow(ambiguous_glob_reexports)]
pub use claim_winnings::*;
#[allow(ambiguous_glob_reexports)]
pub use create_market::*;
#[allow(ambiguous_glob_reexports)]
pub use resolve_market::*;
#[allow(ambiguous_glob_reexports)]
pub use sell_shares::*;
