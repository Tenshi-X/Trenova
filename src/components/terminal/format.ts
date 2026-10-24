export const formatPrice = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 8 });
export const formatQty = (value: number) => value >= 1000 ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  : value.toLocaleString('en-US', { maximumSignificantDigits: 4 });
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
export const formatClock = (millis: number) => new Date(millis).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
