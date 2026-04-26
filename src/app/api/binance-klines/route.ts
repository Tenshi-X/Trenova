import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '100';

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Binance API error', status: res.status },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Binance klines proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from Binance' },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';
