import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300;

// Public CoinGecko proxy (NO API key by design).
// API key is reserved for the AI analysis menu only (dashboard/actions.ts).
// Used by CoinSelector for the top-100 list. Cached 5 min server-side to
// stay under the public rate limit (5-15 req/min per IP).
export async function GET() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 6000);
    const r = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
      { signal: c.signal, cache: 'no-store', headers: { 'User-Agent': 'TrenovaBot/1.0' } },
    );
    clearTimeout(t);
    if (!r.ok) return NextResponse.json([], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    const d = await r.json();
    if (!Array.isArray(d)) return NextResponse.json([]);
    return NextResponse.json(d, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  }
}