import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for Binance 24hr ticker API.
 * Avoids CORS issues when fetching from the browser.
 * Usage: GET /api/binance-ticker?symbol=BTCUSDT
 *        GET /api/binance-ticker?symbols=BTCUSDT,ETHUSDT (multiple)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');

  try {
    if (symbols) {
      // Multiple symbols: fetch in parallel
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      const results = await Promise.all(
        symbolList.map(async (sym) => {
          try {
            const res = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`,
              { cache: 'no-store' }
            );
            if (!res.ok) return { symbol: sym, error: true };
            return res.json();
          } catch {
            return { symbol: sym, error: true };
          }
        })
      );
      return NextResponse.json(results);
    }

    if (symbol) {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`,
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
    }

    return NextResponse.json(
      { error: 'Missing "symbol" or "symbols" query parameter' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Binance proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from Binance' },
      { status: 502 }
    );
  }
}

// Force dynamic — never statically cache this route
export const dynamic = 'force-dynamic';
