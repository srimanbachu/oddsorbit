#!/usr/bin/env bash
# Orchestrates the full local dev environment:
#   1. solana-test-validator (background, --reset)
#   2. anchor deploy --provider.cluster localnet
#   3. mock wBTC mint + .env.local generation
#   4. frontend dev server (foreground)
#
# Ctrl-C cleans up the validator.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LEDGER_DIR="${ROOT}/.test-ledger"
VALIDATOR_LOG="${ROOT}/.test-ledger.log"

cleanup() {
  if [[ -n "${VALIDATOR_PID:-}" ]] && kill -0 "$VALIDATOR_PID" 2>/dev/null; then
    echo "→ Stopping validator (pid $VALIDATOR_PID)…"
    kill "$VALIDATOR_PID" 2>/dev/null || true
    wait "$VALIDATOR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "→ Starting solana-test-validator (logs: $VALIDATOR_LOG)…"
solana-test-validator --reset --ledger "$LEDGER_DIR" --quiet > "$VALIDATOR_LOG" 2>&1 &
VALIDATOR_PID=$!

echo "→ Waiting for RPC to come up…"
for _ in $(seq 1 30); do
  if solana cluster-version --url http://127.0.0.1:8899 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
solana cluster-version --url http://127.0.0.1:8899 >/dev/null

echo "→ Configuring Solana CLI for localnet…"
solana config set --url http://127.0.0.1:8899 >/dev/null

echo "→ Funding deployer keypair…"
solana airdrop 100 >/dev/null

echo "→ Building program…"
anchor build

echo "→ Deploying program to localnet…"
anchor deploy --provider.cluster localnet

echo "→ Refreshing SDK IDL…"
bun run sdk:generate

echo "→ Creating mock wBTC mint + writing apps/web/.env.local…"
bun run scripts/setup-localnet.ts

echo
echo "✓ Localnet ready. Starting frontend at http://localhost:5173 …"
echo
bun run --cwd apps/web dev
