import { NextResponse } from 'next/server';
import { getJson, firstJson, limited, SPOT_HOSTS } from '@/lib/market-public';
import { idrPremium, parseIndodaxTickers, parseStablecoinSupply, parseTvl } from '@/lib/macro';

// Free public data only: DefiLlama (stablecoin supply, DeFi TVL) and Indodax (local IDR prices).
// Every block fails soft: a missing source returns { available: false } and the panel says so.
export const dynamic = 'force-dynamic';
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];
const CACHE = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' };

export async function GET(request: Request) {
  const blocked = limited(request, 'macro', 30);
  if (blocked) return blocked;
  const kind = new URL(request.url).searchParams.get('kind');
  if (kind === 'stable') {
    const series = parseStablecoinSupply(await getJson('https://stablecoins.llama.fi/stablecoincharts/all', 6000));
    return NextResponse.json(series ? { available: true, ...series } : { available: false }, { headers: CACHE });
  }
  if (kind === 'tvl') {
    const series = parseTvl(await getJson('https://api.llama.fi/v2/historicalChainTvl', 6000));
    return NextResponse.json(series ? { available: true, ...series } : { available: false }, { headers: CACHE });
  }
  if (kind === 'idr') {
    const tickers = parseIndodaxTickers(await getJson('https://indodax.com/api/tickers', 5000));
    if (!tickers.usdt_idr) return NextResponse.json({ available: false }, { headers: CACHE });
    const rows = (await Promise.all(SYMBOLS.map(async symbol => {
      const data = await firstJson(SPOT_HOSTS.map(host => `${host}/api/v3/ticker/price?symbol=${symbol}USDT`), 3000) as { price?: string } | null;
      return idrPremium(symbol, tickers, Number(data?.price));
    }))).filter(row => row !== null);
    return NextResponse.json(rows.length ? { available: true, rows, usdtIdr: tickers.usdt_idr } : { available: false }, { headers: CACHE });
  }
  return NextResponse.json({ error: 'kind tidak dikenal.' }, { status: 400 });
}
