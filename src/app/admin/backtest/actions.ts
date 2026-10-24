'use server';

import { getAdminContext } from '@/lib/authz';
import { TIMEFRAMES, TIMEFRAME_MILLIS, isStablecoin, type AnalysisInput, type Timeframe } from '@/lib/analysis/core';
import { groupSummary, riskProfile, runBacktest, splitHalves, summarize, type Bucket, type BacktestTrade } from '@/lib/analysis/backtest';
import { fetchCandlesSince } from '@/lib/analysis/tracking-service';

export type BacktestReport = {
  success: boolean; error?: string; timeframe?: Timeframe; symbols?: string[]; skipped?: string[]; candlesPerSymbol?: number;
  overall?: Bucket; firstHalf?: Bucket; secondHalf?: Bucket; byDirection?: Record<string, Bucket>; byGrade?: Record<string, Bucket>;
  byEntryType?: Record<string, Bucket>; risk?: ReturnType<typeof riskProfile>; from?: string; to?: string;
};

const MAX_SYMBOLS = 3;
const CANDLES = 1000;

/** Runs the rule-engine backtest on live exchange candles (admin only, one to three coins per run). */
export async function runAdminBacktest(rawSymbols: string, timeframe: string): Promise<BacktestReport> {
  const admin = await getAdminContext();
  if (!admin) return { success: false, error: 'Akses ditolak.' };
  if (!(TIMEFRAMES as readonly string[]).includes(timeframe)) return { success: false, error: 'Timeframe tidak valid.' };
  const tf = timeframe as Timeframe;
  const symbols = [...new Set(String(rawSymbols ?? '').toUpperCase().split(/[\s,]+/).map(item => item.replace(/USDT$/, '')).filter(Boolean))];
  if (!symbols.length) return { success: false, error: 'Isi minimal satu simbol.' };
  if (symbols.length > MAX_SYMBOLS) return { success: false, error: `Maksimal ${MAX_SYMBOLS} koin per proses agar tidak melewati batas waktu server.` };
  if (symbols.some(symbol => !/^[A-Z0-9]{2,15}$/.test(symbol))) return { success: false, error: 'Simbol hanya boleh huruf dan angka.' };
  const now = Date.now();
  const tfMs = TIMEFRAME_MILLIS[tf];
  const input: AnalysisInput = { requestKey: 'backtest', symbol: '', coinName: '', language: 'id', tradingStyle: 'intraday', timeframe: tf,
    riskTolerance: 'Medium Risk', strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2', marketType: 'futures',
    directionPreference: 'auto', higherTimeframeConfirmation: false, context: '' };
  const btc = await fetchCandlesSince('BTC', tf, now - (CANDLES + 20) * tfMs);
  const trades: BacktestTrade[] = []; const skipped: string[] = []; let used = 0;
  for (const symbol of symbols) {
    if (isStablecoin(symbol)) { skipped.push(`${symbol} (stablecoin)`); continue; }
    const [candles, dailyCandles, weeklyCandles] = await Promise.all([
      fetchCandlesSince(symbol, tf, now - (CANDLES + 20) * tfMs),
      fetchCandlesSince(symbol, '1d', now - 400 * 86_400_000),
      fetchCandlesSince(symbol, '1w', now - 130 * 604_800_000)]);
    if (!candles || candles.length < 120 || !dailyCandles || !weeklyCandles) { skipped.push(`${symbol} (data tidak cukup)`); continue; }
    used = Math.max(used, candles.length);
    trades.push(...runBacktest({ symbol, timeframe: tf, candles, daily: dailyCandles, weekly: weeklyCandles, btc: btc ?? undefined }, { ...input, symbol }));
  }
  if (!trades.length) return { success: false, error: skipped.length ? `Tidak ada data yang bisa diuji: ${skipped.join(', ')}.` : 'Tidak ada sinyal pada data ini.' };
  const halves = splitHalves(trades);
  const times = trades.map(trade => trade.at).sort();
  return { success: true, timeframe: tf, symbols: symbols.filter(symbol => !skipped.some(item => item.startsWith(symbol + ' '))), skipped, candlesPerSymbol: used,
    overall: summarize(trades), firstHalf: summarize(halves.first), secondHalf: summarize(halves.second),
    byDirection: groupSummary(trades, trade => trade.direction), byGrade: groupSummary(trades, trade => trade.grade),
    byEntryType: groupSummary(trades, trade => trade.entryType), risk: riskProfile(trades), from: times[0], to: times[times.length - 1] };
}
