export function toBaseUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

export function fromBaseUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export function formatBtc(amount: bigint, decimals = 8): string {
  return fromBaseUnits(amount, decimals).toFixed(6);
}
