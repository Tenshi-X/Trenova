import { NextResponse } from 'next/server';
import { DERIV_PERIODS, parseFundingHistory, parseLongShort, parseOpenInterestHistory, parseTakerRatio, type DerivPeriod } from '@/lib/derivs-history';
import { getJson, limited, OKX_HOSTS, readSymbol } from '@/lib/market-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAPI = 'https://fapi.binance.com';
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; body: unknown }>();

// GET /api/market/derivs?symbol=BTC&period=1h
// Funding history, open interest, long/short account ratio and taker buy/sell ratio from Binance futures.
// Binance futures is blocked from some hosting regions, so each series reports whether it is available.
export async function GET(request: Request) {
  const blocked = limited(request, 'derivs', 30);
  if (blocked) return blocked;
  const params = new URL(request.url).searchParams;
  const symbol = readSymbol(params.get('symbol'));
  const requested = params.get('period') ?? '1h';
  const period: DerivPeriod = (DERIV_PERIODS as readonly string[]).includes(requested) ? requested as DerivPeriod : '1h';
  if (!symbol) return NextResponse.json({ error: 'Simbol tidak valid.' }, { status: 400 });
  const key = `${symbol}:${period}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json(hit.body, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } });
  const pair = `${symbol}USDT`;
  const [fundingRaw, oiRaw, lsRaw, takerRaw] = await Promise.all([
    getJson(`${FAPI}/fapi/v1/fundingRate?symbol=${pair}&limit=60`),
    getJson(`${FAPI}/futures/data/openInterestHist?symbol=${pair}&period=${period}&limit=48`),
    getJson(`${FAPI}/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=${period}&limit=48`),
    getJson(`${FAPI}/futures/data/takerlongshortRatio?symbol=${pair}&period=${period}&limit=48`),
  ]);
  let funding = parseFundingHistory(fundingRaw);
  let fundingSource: 'binance' | 'okx' | null = funding.length ? 'binance' : null;
  if (!funding.length) {
    for (const host of OKX_HOSTS) {
      const okx = await getJson(`${host}/api/v5/public/funding-rate-history?instId=${symbol}-USDT-SWAP&limit=60`);
      const rows = okx && typeof okx === 'object' && Array.isArray((okx as { data?: unknown }).data) ? (okx as { data: unknown[] }).data : [];
      funding = parseFundingHistory(rows);
      if (funding.length) { fundingSource = 'okx'; break; }
    }
  }
  const openInterest = parseOpenInterestHistory(oiRaw);
  const longShort = parseLongShort(lsRaw);
  const taker = parseTakerRatio(takerRaw);
  const body = { symbol, period, asOf: Date.now(), funding, fundingSource, openInterest, longShort, taker,
    available: { funding: funding.length > 0, openInterest: openInterest.length > 0, longShort: longShort.length > 0, taker: taker.length > 0 } };
  const anything = Object.values(body.available).some(Boolean);
  if (anything) {
    cache.set(key, { at: Date.now(), body });
    if (cache.size > 200) cache.delete(cache.keys().next().value as string);
  }
  return NextResponse.json(body, { headers: { 'Cache-Control': anything ? 'public, s-maxage=30, stale-while-revalidate=60' : 'no-store' } });
}
