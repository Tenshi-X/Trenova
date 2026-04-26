import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr`,
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
    console.error('Binance tickers proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from Binance' },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';
