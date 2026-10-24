import { NextResponse } from 'next/server';
import { parseAggTrade, type Trade } from '@/lib/market-stream';
import { firstJson, limited, OKX_HOSTS, readSymbol, SPOT_HOSTS } from '@/lib/market-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function okxTrades(raw: unknown): Trade[] {
  const data = raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data) ? (raw as { data: unknown[] }).data : [];
  const trades: Trade[] = [];
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const price = Number(item.px); const qty = Number(item.sz); const time = Number(item.ts);
    if (!(price > 0) || !(qty > 0) || !(time > 0) || (item.side !== 'buy' && item.side !== 'sell')) continue;
    trades.push({ id: String(item.tradeId ?? `${time}-${price}-${qty}`), price, qty, usd: price * qty, time, side: item.side });
  }
  return trades;
}

// GET /api/market/trades?symbol=BTC  ->  latest trades, newest first (fallback for the live trade stream).
export async function GET(request: Request) {
  const blocked = limited(request, 'trades', 90);
  if (blocked) return blocked;
  const symbol = readSymbol(new URL(request.url).searchParams.get('symbol'));
  if (!symbol) return NextResponse.json({ error: 'Simbol tidak valid.' }, { status: 400 });
  let source = 'binance';
  const raw = await firstJson(SPOT_HOSTS.map(host => `${host}/api/v3/aggTrades?symbol=${symbol}USDT&limit=60`));
  let trades = Array.isArray(raw) ? raw.map(parseAggTrade).filter((trade): trade is Trade => trade !== null) : [];
  if (!trades.length) {
    source = 'okx';
    trades = okxTrades(await firstJson(OKX_HOSTS.map(host => `${host}/api/v5/market/trades?instId=${symbol}-USDT&limit=60`)));
  }
  if (!trades.length) return NextResponse.json({ error: 'Data transaksi belum tersedia untuk pasangan ini.' }, { status: 404 });
  trades.sort((a, b) => b.time - a.time);
  return NextResponse.json({ symbol, source, asOf: Date.now(), trades: trades.slice(0, 60) },
    { headers: { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2' } });
}
