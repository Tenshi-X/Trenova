import { NextResponse } from 'next/server';
import { parseOrderBook } from '@/lib/market-stream';
import { firstJson, limited, OKX_HOSTS, readSymbol, SPOT_HOSTS } from '@/lib/market-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/market/depth?symbol=BTC  ->  top of the order book, used when the browser cannot open the live stream.
export async function GET(request: Request) {
  const blocked = limited(request, 'depth', 90);
  if (blocked) return blocked;
  const symbol = readSymbol(new URL(request.url).searchParams.get('symbol'));
  if (!symbol) return NextResponse.json({ error: 'Simbol tidak valid.' }, { status: 400 });
  const binance = parseOrderBook(await firstJson(SPOT_HOSTS.map(host => `${host}/api/v3/depth?symbol=${symbol}USDT&limit=20`)));
  let book = binance; let source = 'binance';
  if (!book) {
    const okx = await firstJson(OKX_HOSTS.map(host => `${host}/api/v5/market/books?instId=${symbol}-USDT&sz=20`));
    const data = okx && typeof okx === 'object' && Array.isArray((okx as { data?: unknown }).data) ? (okx as { data: unknown[] }).data[0] : null;
    book = parseOrderBook(data); source = 'okx';
  }
  if (!book) return NextResponse.json({ error: 'Order book belum tersedia untuk pasangan ini.' }, { status: 404 });
  return NextResponse.json({ symbol, source, asOf: Date.now(), bids: book.bids.slice(0, 20), asks: book.asks.slice(0, 20) },
    { headers: { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2' } });
}
