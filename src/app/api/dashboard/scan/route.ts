import { NextResponse } from 'next/server';
import { getSessionProfile, isActiveSubscriber } from '@/lib/authz';
import { isStablecoin, parseAnalysisInput, STRATEGIES, TARGET_RRS, TIMEFRAMES } from '@/lib/analysis/core';
import { getMarketSnapshot } from '@/lib/analysis/market';
import { buildTechnicalAnalysis } from '@/lib/analysis/report';
import { allowRequest } from '@/lib/rate-limit';
import { rankScan, toScanRow, type ScanItem } from '@/lib/scan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_SYMBOLS = 5;
const BUDGET_MS = 20_000;

// GET /api/dashboard/scan?symbols=BTC,ETH,SOL&tf=4h&rr=1:2&strategy=All-Round
// Rule-based plan and confluence score per coin. No AI call and no credit; the browser sends a few coins per request.
export async function GET(request: Request) {
  const context = await getSessionProfile();
  if (!context) return NextResponse.json({ error: 'Silakan masuk kembali.' }, { status: 401 });
  const { user, profile } = context;
  if (profile.role !== 'admin' && (profile.role !== 'user' || !isActiveSubscriber(profile))) {
    return NextResponse.json({ error: 'Akun belum aktif.' }, { status: 403 });
  }
  if (!allowRequest(`scan:${user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak pemindaian. Coba lagi sebentar lagi.' }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const timeframe = TIMEFRAMES.find(item => item === params.get('tf')) ?? '4h';
  const targetRR = TARGET_RRS.find(item => item === params.get('rr')) ?? '1:2';
  const strategyFocus = STRATEGIES.find(item => item === params.get('strategy')) ?? 'All-Round';
  const symbols = [...new Set((params.get('symbols') ?? '').split(',').map(item => item.trim().toUpperCase())
    .filter(item => /^[A-Z0-9]{2,15}$/.test(item) && !isStablecoin(item)))].slice(0, MAX_SYMBOLS);
  if (!symbols.length) return NextResponse.json({ error: 'Pilih minimal satu koin yang valid.' }, { status: 400 });

  const started = Date.now();
  const scan = async (symbol: string): Promise<ScanItem> => {
    if (Date.now() - started > BUDGET_MS) return { symbol, error: 'no_data' };
    const input = parseAnalysisInput({ requestKey: crypto.randomUUID(), symbol, language: 'id', tradingStyle: 'intraday', timeframe,
      riskTolerance: 'Medium Risk', strategyFocus, indicatorPref: 'Default', targetRR, marketType: 'futures', directionPreference: 'auto' });
    if (!input) return { symbol, error: 'no_plan' };
    const market = await getMarketSnapshot(symbol, timeframe);
    if (!market) return { symbol, error: 'no_data' };
    try {
      const row = toScanRow(buildTechnicalAnalysis(input, market), market);
      return row ?? { symbol, error: 'no_plan' };
    } catch { return { symbol, error: 'no_plan' }; }
  };
  const results: ScanItem[] = [];
  for (let i = 0; i < symbols.length; i += 3) results.push(...await Promise.all(symbols.slice(i, i + 3).map(scan)));
  return NextResponse.json({ timeframe, targetRR, asOf: Date.now(), results: rankScan(results) }, { headers: { 'Cache-Control': 'no-store' } });
}
