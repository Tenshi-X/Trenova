import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime to avoid Binance blocking AWS Lambda IPs
export const runtime = 'edge';
export const preferredRegion = ['sin1', 'hkg1', 'iad1'];

const BINANCE_URLS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
];

async function fetchWithFallback(path: string, timeout = 8000): Promise<Response> {
  for (const baseUrl of BINANCE_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrenovaBot/1.0)' },
      });
      clearTimeout(timer);
      if (res.ok) return res;
    } catch (err: any) {
      console.warn(`${baseUrl}${path} failed: ${err.message}`);
    }
  }
  throw new Error('All Binance API domains unreachable');
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '100';

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  try {
    const res = await fetchWithFallback(
      `/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Binance klines proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from Binance', detail: String(err) },
      { status: 502 }
    );
  }
}
