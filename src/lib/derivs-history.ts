// Parsers for futures history series (funding, open interest, long/short ratio, taker flow). Fail-soft: bad rows are dropped.

export type SeriesPoint = { time: number; value: number };
export type LongShortPoint = { time: number; ratio: number; long: number; short: number };

const num = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
};
const rowsOf = (raw: unknown): Record<string, unknown>[] => Array.isArray(raw)
  ? raw.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row)) : [];
const byTime = <T extends { time: number }>(points: T[]) => points.sort((a, b) => a.time - b.time);

/** Funding rate per settlement as a PERCENT (0.01 = 0.01%). Binance: fundingRate/fundingTime. OKX uses the same names. */
export function parseFundingHistory(raw: unknown): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const row of rowsOf(raw)) {
    const rate = num(row.fundingRate); const time = num(row.fundingTime);
    if (rate !== null && time !== null && time > 0) points.push({ time, value: rate * 100 });
  }
  return byTime(points);
}

/** Open interest in USD (sumOpenInterestValue). */
export function parseOpenInterestHistory(raw: unknown): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const row of rowsOf(raw)) {
    const value = num(row.sumOpenInterestValue); const time = num(row.timestamp);
    if (value !== null && value > 0 && time !== null && time > 0) points.push({ time, value });
  }
  return byTime(points);
}

/** Share of accounts net long vs short. */
export function parseLongShort(raw: unknown): LongShortPoint[] {
  const points: LongShortPoint[] = [];
  for (const row of rowsOf(raw)) {
    const ratio = num(row.longShortRatio); const long = num(row.longAccount); const short = num(row.shortAccount); const time = num(row.timestamp);
    if (ratio !== null && ratio > 0 && long !== null && short !== null && time !== null && time > 0) points.push({ time, ratio, long, short });
  }
  return byTime(points);
}

/** Taker buy volume / taker sell volume: above 1 means aggressive buyers dominate. */
export function parseTakerRatio(raw: unknown): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const row of rowsOf(raw)) {
    const ratio = num(row.buySellRatio); const time = num(row.timestamp);
    if (ratio !== null && ratio > 0 && time !== null && time > 0) points.push({ time, value: ratio });
  }
  return byTime(points);
}

export const DERIV_PERIODS = ['5m', '15m', '30m', '1h', '4h', '1d'] as const;
export type DerivPeriod = (typeof DERIV_PERIODS)[number];
