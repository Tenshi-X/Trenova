import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 25;
export const revalidate = 0;

// Unified klines proxy: Binance -> Coinbase -> 200 degraded (never 502).
const BINANCE_URLS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
];

function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

const GRAN: Record<string, number> = { '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400 };

function toCoinbaseId(symbol: string): string | null {
  let s = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!s || s === 'USDT' || s === 'USD') return null;
  if (s.endsWith('USDT')) s = s.slice(0, -4);
  else if (s.endsWith('USD') && !s.endsWith('BUSD')) s = s.slice(0, -3);
  if (!s) return null;
  return s + '-USD';
}

async function binanceKlines(symbol: string, interval: string, limit: string) {
  for (const base of BINANCE_URLS) {
    const { signal, done } = withTimeout(4000);
    try {
      const r = await fetch(base + '/api/v3/klines?symbol=' + symbol + '&interval=' + interval + '&limit=' + limit, {
        signal, cache: 'no-store', headers: { 'User-Agent': 'TrenovaBot/1.0' },
      });
      done();
      if (!r.ok) continue;
      const d = await r.json();
      if (Array.isArray(d) && d.length) return d;
    } catch { done(); }
  }
  return null;
}

async function coinbaseKlines(cbId: string, interval: string, limit: string) {
  const gran = GRAN[interval] || 3600;
  const { signal, done } = withTimeout(5000);
  try {
    const r = await fetch('https://api.exchange.coinbase.com/products/' + cbId + '/candles?granularity=' + gran, {
      signal, cache: 'no-store', headers: { 'User-Agent': 'TrenovaBot/1.0' },
    });
    done();
    if (!r.ok) return null;
    const d = await r.json();
    if (!Array.isArray(d) || !d.length) return null;
    // Coinbase: [time, low, high, open, close, volume] oldest-first -> map to Binance shape newest-last slice
    const n = Math.min(parseInt(limit) || 100, d.length);
    const slice = d.slice(0, n).reverse();
    return slice.map((c: number[]) => [c[0] * 1000, String(c[3]), String(c[2]), String(c[1]), String(c[4]), String(c[5]), c[0] * 1000, '0', 0, '0', '0', '0']);
  } catch { done(); return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawSymbol = (searchParams.get('symbol') || '').toUpperCase();
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '100';

  const clean = rawSymbol.replace(/[^A-Z0-9]/g, '');
  if (!clean || clean === 'USDT' || clean === 'USD') {
    return NextResponse.json({ error: 'Missing or invalid symbol', degraded: true, source: 'none', data: [] }, { status: 400 });
  }

  const bn = await binanceKlines(clean, interval, limit);
  if (bn) return NextResponse.json(bn);

  const cbId = toCoinbaseId(clean);
  if (cbId) {
    const cb = await coinbaseKlines(cbId, interval, limit);
    if (cb) return NextResponse.json(cb);
  }

  return NextResponse.json({ error: 'All candle providers unreachable', degraded: true, source: 'none', data: [] }, { status: 200 });
}
