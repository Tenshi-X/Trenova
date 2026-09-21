import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300;

// Fear & Greed proxy: alternative.me (server-side, no CORS) + static fallback.
export async function GET() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 5000);
    const r = await fetch('https://api.alternative.me/fng/?limit=2', {
      signal: c.signal, cache: 'no-store', headers: { 'User-Agent': 'TrenovaBot/1.0' },
    });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      if (j?.data?.[0]) return NextResponse.json(j.data[0]);
    }
  } catch { /* fallback below */ }
  return NextResponse.json(
    { value: '50', value_classification: 'Neutral', timestamp: String(Math.floor(Date.now() / 1000)), time_until_update: '0', degraded: true },
  );
}