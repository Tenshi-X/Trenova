import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/authz';
import { parseAnalysisInput, parseCandle, RISKS, STRATEGIES, STYLES, TARGET_RRS, TIMEFRAMES,
  type Candle, type Timeframe } from '@/lib/analysis/core';
import { groupSummary, runBacktest, splitHalves, summarize, type BacktestTrade, type SymbolSeries } from '@/lib/analysis/backtest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com', 'https://api-gcp.binance.com'];
const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT',
  'LTC', 'TRX', 'NEAR', 'ATOM', 'UNI', 'AAVE', 'ARB', 'OP', 'SUI', 'INJ'];

async function klinePage(symbol: string, interval: string, limit: number, endTime?: number): Promise<Candle[] | null> {
  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}${endTime ? `&endTime=${endTime}` : ''}`,
        { cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!response.ok) continue;
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) continue;
      return raw.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now());
    } catch { /* try the next host */ }
  }
  return null;
}

// Binance returns at most 1000 candles per call; older history is fetched page by page, newest first.
async function klines(symbol: string, interval: string, limit: number): Promise<Candle[] | null> {
  let all: Candle[] = [];
  let endTime: number | undefined;
  while (all.length < limit) {
    const page = await klinePage(symbol, interval, Math.min(1000, limit - all.length), endTime);
    if (!page) return all.length ? all : null;
    if (!page.length) break;
    all = [...page, ...all];
    if (page.length < 1000 && all.length < limit) break;
    endTime = page[0].openTime - 1;
  }
  return all;
}

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? value as T : fallback;
const intParam = (value: string | null, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) && value !== null && value !== '' ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
};

// GET /api/dashboard/backtest?tf=4h&symbols=BTC,ETH&step=6&rr=1:2
// Admin only. Replays the signal engine over past candles and reports how its plans would have turned out.
export async function GET(request: Request) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: 'Hanya admin.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const timeframe = pick(params.get('tf'), TIMEFRAMES, '4h') as Timeframe;
  const symbols = (params.get('symbols')?.split(',') ?? DEFAULT_SYMBOLS).map(item => item.trim().toUpperCase())
    .filter(item => /^[A-Z0-9]{2,10}$/.test(item)).slice(0, 30);
  const options = { step: intParam(params.get('step'), 6, 1, 48), maxWait: intParam(params.get('wait'), 6, 1, 48),
    maxHold: intParam(params.get('hold'), 24, 1, 200), feePct: intParam(params.get('fee'), 10, 0, 100) / 100 };
  const rawInput = { requestKey: crypto.randomUUID(), symbol: 'BTC', language: 'id', timeframe,
    tradingStyle: pick(params.get('style'), STYLES, 'intraday'), riskTolerance: pick(params.get('risk'), RISKS, 'Medium Risk'),
    strategyFocus: pick(params.get('strategy'), STRATEGIES, 'All-Round'), indicatorPref: 'Default',
    targetRR: pick(params.get('rr'), TARGET_RRS, '1:2') };
  const input = parseAnalysisInput(rawInput);
  if (!input) return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 400 });

  const started = Date.now();
  const history = intParam(params.get('history'), 1000, 300, 8000);
  const btc = await klines('BTC', timeframe, history);
  const series: SymbolSeries[] = [];
  const failed: string[] = [];
  let skipped: string[] = [];
  for (let i = 0; i < symbols.length; i += 4) {
    if (Date.now() - started > 35_000) { skipped = symbols.slice(i); break; }
    await Promise.all(symbols.slice(i, i + 4).map(async symbol => {
      const [candles, daily, weekly] = await Promise.all([klines(symbol, timeframe, history), klines(symbol, '1d', 1000), klines(symbol, '1w', 300)]);
      if (!candles || candles.length < 100 || !daily || !weekly) { failed.push(symbol); return; }
      series.push({ symbol, timeframe, candles, daily, weekly, btc: btc ?? undefined });
    }));
  }
  const evaluate = (config: NonNullable<ReturnType<typeof parseAnalysisInput>>) =>
    series.flatMap(item => runBacktest(item, config, options));
  const compact = (trades: BacktestTrade[]) => {
    const { first, second } = splitHalves(trades);
    const strong = trades.filter(trade => trade.score >= 80);
    return { overall: summarize(trades), firstHalf: summarize(first), secondHalf: summarize(second), score80plus: summarize(strong) };
  };
  const span = series[0] ? { from: new Date(series[0].candles[0].openTime).toISOString().slice(0, 10),
    to: new Date(series[0].candles[series[0].candles.length - 1].closeTime).toISOString().slice(0, 10) } : null;
  const coverage = { completed: series.map(item => item.symbol), failed, skippedForTime: skipped, candleSpan: span, candlesPerSymbol: history };

  if (params.get('sweep') === '1') {
    // Many configurations on the same data. The best of many looks good by luck alone, so a result only counts
    // when both halves of the data are positive and the interval around the average R stays above zero.
    const results: Array<Record<string, unknown>> = [];
    const wanted = <T extends string>(name: string, all: readonly T[]): T[] => {
      const list = params.get(name)?.split(',').map(item => item.trim()).filter((item): item is T => all.includes(item as T));
      return list?.length ? list : [...all];
    };
    for (const strategy of wanted('strategies', STRATEGIES)) for (const rrChoice of wanted('rrs', TARGET_RRS)) {
      if (Date.now() - started > 55_000) break;
      const config = parseAnalysisInput({ ...rawInput, strategyFocus: strategy, targetRR: rrChoice });
      if (!config) continue;
      results.push({ strategy, rr: rrChoice, breakEvenWinRatePct: Math.round(100 / (Number(rrChoice.slice(2)) + 1) * 10) / 10,
        ...compact(evaluate(config)) });
    }
    results.sort((a, b) => ((b.overall as { avgR: number | null }).avgR ?? -9) - ((a.overall as { avgR: number | null }).avgR ?? -9));
    return NextResponse.json({ mode: 'sweep', timeframe, coverage, results,
      reading: 'Look for rows where firstHalf.avgR, secondHalf.avgR and overall.ci95[0] are all above 0. Anything else is noise.' });
  }

  const trades = evaluate(input);
  const bucket = (trade: BacktestTrade) => trade.score >= 80 ? '80-100' : trade.score >= 70 ? '70-79' : trade.score >= 60 ? '60-69'
    : trade.score >= 50 ? '50-59' : trade.score >= 40 ? '40-49' : '0-39';
  const rr = Number(input.targetRR.slice(2));
  return NextResponse.json({
    params: { timeframe, rr: input.targetRR, style: input.tradingStyle, risk: input.riskTolerance, strategy: input.strategyFocus, ...options },
    coverage: { ...coverage, tookSeconds: Math.round((Date.now() - started) / 1000) },
    breakEvenWinRatePct: Math.round(100 / (rr + 1) * 10) / 10,
    ...compact(trades),
    byStatus: groupSummary(trades, trade => trade.status),
    byGrade: groupSummary(trades, trade => trade.grade),
    byScore: groupSummary(trades, bucket),
    byEntryType: groupSummary(trades, trade => trade.entryType),
    byDirection: groupSummary(trades, trade => trade.direction),
    bySymbol: groupSummary(trades, trade => trade.symbol),
    notes: ['Signals use only candles closed at the time (no look-ahead).',
      'Plan followed as written: trigger close, retest, entry at the worse zone edge, SL/TP1 by candle range.',
      'If SL and TP1 are in one candle the loss is counted. Fees are an estimate, slippage is not included.',
      'Funding, OI and sentiment are not available historically, so those factors count as unknown.',
      'Signals are 6 candles apart and coins move together, so the effective sample is smaller than the signal count.'],
  });
}
