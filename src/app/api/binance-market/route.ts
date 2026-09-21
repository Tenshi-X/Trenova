import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 25;
export const revalidate = 10;
// Live market aggregator. Priority: Coinbase (Vercel-friendly) -> Binance -> CoinLore -> static.
// Always returns 200, never 500/502.
const D1 = { symbol: 'BTC', price: 67500, change: 2.35, high: 68200, low: 66100, volume: 2500000000, funding: 0.0001, rank: 1 };
const D2 = { symbol: 'ETH', price: 3450, change: 1.82, high: 3490, low: 3390, volume: 1500000000, funding: 0.0002, rank: 2 };
const D3 = { symbol: 'SOL', price: 145.2, change: 5.12, high: 147.5, low: 138, volume: 3200000000, funding: 0.0005, rank: 3 };
const D4 = { symbol: 'BNB', price: 585, change: 1.1, high: 589, low: 577, volume: 180000000, funding: 0.0003, rank: 4 };
const D5 = { symbol: 'XRP', price: 0.523, change: -0.45, high: 0.535, low: 0.512, volume: 520000000, funding: -0.0001, rank: 5 };
const D6 = { symbol: 'DOGE', price: 0.0825, change: 3.2, high: 0.0835, low: 0.079, volume: 480000000, funding: 0.0001, rank: 6 };
const D7 = { symbol: 'ADA', price: 0.382, change: 1.55, high: 0.388, low: 0.375, volume: 210000000, funding: 0, rank: 7 };
const D8 = { symbol: 'AVAX', price: 32.5, change: -2.1, high: 33.8, low: 32, volume: 380000000, funding: -0.0003, rank: 8 };
const D9 = { symbol: 'DOT', price: 5.25, change: 0.8, high: 5.32, low: 5.18, volume: 95000000, funding: 0.0001, rank: 9 };
const D10 = { symbol: 'LINK', price: 12.8, change: 2.75, high: 12.95, low: 12.4, volume: 220000000, funding: 0.0004, rank: 10 };
const D11 = { symbol: 'MATIC', price: 0.285, change: -1.2, high: 0.291, low: 0.28, volume: 180000000, funding: -0.0002, rank: 11 };
const D12 = { symbol: 'ATOM', price: 8.45, change: 0.45, high: 8.55, low: 8.35, volume: 75000000, funding: 0, rank: 12 };
const D13 = { symbol: 'OP', price: 1.85, change: 4.5, high: 1.88, low: 1.77, volume: 150000000, funding: 0.0006, rank: 13 };
const D14 = { symbol: 'ARB', price: 0.82, change: -3.1, high: 0.85, low: 0.8, volume: 120000000, funding: -0.0004, rank: 14 };
const D15 = { symbol: 'UNI', price: 6.95, change: 1.3, high: 7.02, low: 6.85, volume: 110000000, funding: 0.0002, rank: 15 };
const DEGRADED_COINS = [D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,D14,D15];

function degradedGlobal(price: number, change: number) {
  return {
    totalVolume24h: DEGRADED_COINS.reduce((a, c) => a + c.volume, 0),
    btcVolDominance: 52.3, btcPrice: price, btcChange24h: change,
    ethPrice: D2.price, ethChange24h: D2.change,
    solPrice: D3.price, solChange24h: D3.change,
    bnbPrice: D4.price, bnbChange24h: D4.change,
    xrpPrice: D5.price, xrpChange24h: D5.change,
    dogePrice: D6.price, dogeChange24h: D6.change,
    avgFundingRate: 0.0001,
    topGainer: { symbol: 'SOL', change: 5.12, price: 145.2, volume: 3200000000 },
    topLoser: { symbol: 'ARB', change: -3.1, price: 0.82, volume: 120000000 },
    gainersCount: 10, losersCount: 5, totalPairs: 15,
  };
}
function withTimeout(ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}
async function fetchJson(url: string, ms = 4000) {
  const { signal, done } = withTimeout(ms);
  try {
    const r = await fetch(url, { signal, headers: { 'User-Agent': 'TrenovaBot/1.0' }, cache: 'no-store' });
    done();
    if (!r.ok) return { ok: false as const, error: 'http-' + r.status };
    return { ok: true as const, data: await r.json() };
  } catch (e: any) {
    done();
    return { ok: false as const, error: String(e?.name || e) };
  }
}
const BINANCE_URLS = ['https://api.binance.com','https://api1.binance.com','https://api2.binance.com','https://api3.binance.com','https://api4.binance.com'];
const FAPI_URLS = ['https://fapi.binance.com'];
async function bFetch(urls: string[], path: string) {
  // Parallel race: all mirrors at once, first valid array wins. Total ~4s max.
  const jobs = urls.map((base) => (async () => {
    const out = await fetchJson(base + path, 4000);
    if (out.ok && Array.isArray((out as any).data)) return (out as any).data as any[];
    return null;
  })());
  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && r.value.length) return r.value;
  }
  return null;
}
const CB = 'https://api.exchange.coinbase.com';
// Coinbase pairs we track -> display symbol + decimals hint
const CB_PAIRS: { id: string; symbol: string }[] = [
  { id: 'BTC-USD', symbol: 'BTC' }, { id: 'ETH-USD', symbol: 'ETH' },
  { id: 'SOL-USD', symbol: 'SOL' }, { id: 'BNB-USD', symbol: 'BNB' },
  { id: 'XRP-USD', symbol: 'XRP' }, { id: 'DOGE-USD', symbol: 'DOGE' },
  { id: 'ADA-USD', symbol: 'ADA' }, { id: 'AVAX-USD', symbol: 'AVAX' },
  { id: 'DOT-USD', symbol: 'DOT' }, { id: 'LINK-USD', symbol: 'LINK' },
  { id: 'MATIC-USD', symbol: 'MATIC' }, { id: 'ATOM-USD', symbol: 'ATOM' },
  { id: 'UNI-USD', symbol: 'UNI' }, { id: 'OP-USD', symbol: 'OP' },
  { id: 'ARB-USD', symbol: 'ARB' },
];
async function coinbaseSnapshot() {
  // Fetch ticker + 24h stats per pair in parallel. ~2 round trips each.
  const jobs = CB_PAIRS.map(async (p) => {
    const [tk, st] = await Promise.all([
      fetchJson(CB + '/products/' + p.id + '/ticker', 4000),
      fetchJson(CB + '/products/' + p.id + '/stats', 4000),
    ]);
    if (!tk.ok || !st.ok) return null;
    const price = parseFloat((tk as any).data?.price ?? '0');
    const open = parseFloat((st as any).data?.open ?? '0');
    const high = parseFloat((st as any).data?.high ?? '0');
    const low = parseFloat((st as any).data?.low ?? '0');
    const vol = parseFloat((st as any).data?.volume ?? '0'); // base volume
    if (!price) return null;
    const chg = open ? ((price - open) / open) * 100 : 0;
    return { symbol: p.symbol, price, priceChangePercent: chg, high24h: high, low24h: low, volume24h: vol * price, marketCap: 0, fundingRate: 0, sparkline: [] as number[] };
  });
  const settled = await Promise.allSettled(jobs);
  const coins = settled.flatMap((r, i) => {
    if (r.status !== 'fulfilled' || !r.value) return [];
    return [{ rank: 0, ...r.value }];
  });
  if (coins.length < 3) return null; // need quorum
  coins.sort((a, b) => b.volume24h - a.volume24h);
  coins.forEach((c, i) => { c.rank = i + 1; });
  return coins;
}
const CL = 'https://api.coinlore.net';
async function clGlobal() {
  try {
    const r = await fetch(CL + '/api/global/', { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data ?? null;
  } catch { return null; }
}
async function clTickers() {
  try {
    const r = await fetch(CL + '/api/tickers/', { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data : null;
  } catch { return null; }
}
// Public CoinGecko markets (NO API key). Free tier ~5-15 req/min per IP,
// so a single batched call + server cache does the job. API key stays
// reserved for the AI analysis menu only (dashboard/actions.ts).
const CG = 'https://api.coingecko.com/api/v3';
async function cgMarkets() {
  try {
    const r = await fetch(CG + '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? j : null;
  } catch { return null; }
}
export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.get('debug') === '1';
  const attempts: { provider: string; ok: boolean; ms: number; error?: string }[] = [];
  const timed = async <T,>(provider: string, fn: () => Promise<T>): Promise<T | null> => {
    const t0 = Date.now();
    try {
      const v = await fn();
      attempts.push({ provider, ok: !!v, ms: Date.now() - t0 });
      return v;
    } catch (e: any) {
      attempts.push({ provider, ok: false, ms: Date.now() - t0, error: String(e?.message || e) });
      return null;
    }
  };
  const globalFromCoins = (coins: any[], totalPairs: number, avgFR = 0, btcDom = 52) => {
    let topG = { symbol: '', change: -Infinity, price: 0, volume: 0 };
    let topL = { symbol: '', change: Infinity, price: 0, volume: 0 };
    let gainers = 0, losers = 0, totalVol = 0;
    for (const c of coins) {
      totalVol += c.volume24h || 0;
      const chg = c.priceChangePercent || 0;
      if (chg > topG.change) topG = { symbol: c.symbol, change: chg, price: c.price, volume: c.volume24h };
      if (chg < topL.change) topL = { symbol: c.symbol, change: chg, price: c.price, volume: c.volume24h };
      if (chg > 0) gainers++; else if (chg < 0) losers++;
    }
    const px = (s: string) => coins.find((c) => c.symbol === s);
    const btc = px('BTC'), eth = px('ETH'), sol = px('SOL'), bnb = px('BNB'), xrp = px('XRP'), doge = px('DOGE');
    return {
      totalVolume24h: totalVol, btcVolDominance: btcDom,
      btcPrice: btc?.price ?? 0, btcChange24h: btc?.priceChangePercent ?? 0,
      ethPrice: eth?.price ?? 0, ethChange24h: eth?.priceChangePercent ?? 0,
      solPrice: sol?.price ?? 0, solChange24h: sol?.priceChangePercent ?? 0,
      bnbPrice: bnb?.price ?? 0, bnbChange24h: bnb?.priceChangePercent ?? 0,
      xrpPrice: xrp?.price ?? 0, xrpChange24h: xrp?.priceChangePercent ?? 0,
      dogePrice: doge?.price ?? 0, dogeChange24h: doge?.priceChangePercent ?? 0,
      avgFundingRate: avgFR, topGainer: topG, topLoser: topL,
      gainersCount: gainers, losersCount: losers, totalPairs,
    };
  };
  try {
    // P1: Coinbase (Vercel-friendly, no key, no geo-block)
    const cb = await timed('coinbase', coinbaseSnapshot);
    if (cb && cb.length >= 3) {
      const body: any = { coins: cb, global: globalFromCoins(cb, cb.length), timestamp: Date.now(), source: 'coinbase', degraded: false };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } });
    }
    // P2: Binance (parallel mirror race)
    const bn = await timed('binance', async () => {
      const [tickers, funding] = await Promise.all([
        bFetch(BINANCE_URLS, '/api/v3/ticker/24hr'),
        bFetch(FAPI_URLS, '/fapi/v1/premiumIndex'),
      ]);
      if (!tickers || !tickers.length) return null;
      return { tickers, funding };
    });
    if (bn && bn.tickers && bn.tickers.length) {
      const { tickers, funding } = bn;
      const stable = ['USDCUSDT','BUSDUSDT','TUSDUSDT','DAIUSDT','FDUSDUSDT','USDPUSDT','EURUSDT'];
      const usdt = tickers.filter((t: any) => t.symbol?.endsWith('USDT') && !stable.includes(t.symbol));
      let totalVol = 0, btcVol = 0, gainers = 0, losers = 0;
      let topG = { symbol: '', change: -Infinity, price: 0, volume: 0 };
      let topL = { symbol: '', change: Infinity, price: 0, volume: 0 };
      for (const t of usdt) {
        const vol = parseFloat(t.quoteVolume ?? '0');
        const chg = parseFloat(t.priceChangePercent ?? '0');
        const prc = parseFloat(t.lastPrice ?? '0');
        totalVol += vol;
        if (t.symbol === 'BTCUSDT') btcVol = vol;
        if (vol > 1e6) {
          if (chg > topG.change) topG = { symbol: t.symbol.replace('USDT',''), change: chg, price: prc, volume: vol };
          if (chg < topL.change) topL = { symbol: t.symbol.replace('USDT',''), change: chg, price: prc, volume: vol };
        }
        if (chg > 0) gainers++; else if (chg < 0) losers++;
      }
      const btcDom = totalVol > 0 ? (btcVol / totalVol) * 100 : 0;
      usdt.sort((a: any, b: any) => parseFloat(b.quoteVolume ?? '0') - parseFloat(a.quoteVolume ?? '0'));
      const coins = usdt.slice(0, 50).map((t: any, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).replace('USDT','').toUpperCase(),
        price: parseFloat(t.lastPrice ?? '0'), priceChangePercent: parseFloat(t.priceChangePercent ?? '0'),
        high24h: parseFloat(t.highPrice ?? '0'), low24h: parseFloat(t.lowPrice ?? '0'),
        volume24h: parseFloat(t.quoteVolume ?? '0'), marketCap: 0, fundingRate: 0, sparkline: [],
      }));
      const fm: Record<string, number> = {};
      for (const f of (funding ?? [])) { if (f.symbol && f.lastFundingRate) fm[f.symbol] = parseFloat(f.lastFundingRate) * 100; }
      let tf = 0, tfc = 0;
      for (const k in fm) { if (k.endsWith('USDT') && !stable.includes(k)) { tf += fm[k]; tfc++; } }
      const avgFR = tfc > 0 ? tf / tfc : 0;
      const body: any = { coins, global: globalFromCoins(coins, usdt.length, parseFloat(avgFR.toFixed(4)), parseFloat(btcDom.toFixed(2))), timestamp: Date.now(), source: 'binance', degraded: false };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3' } });
    }
    const clPair = await timed('coinlore', async () => {
      const [clG, clT] = await Promise.all([clGlobal(), clTickers()]);
      if (!clG || !clT || !clT.length) return null;
      return { clG, clT };
    });
    if (clPair && clPair.clT && clPair.clT.length) {
      const { clG, clT } = clPair;
      const allow = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','DOT','LINK','MATIC','ATOM','UNI','OP','ARB'];
      const coins = clT.filter((t: any) => allow.includes(String(t.symbol).toUpperCase())).slice(0, 50).map((t: any, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).toUpperCase(), price: parseFloat(t.price),
        priceChangePercent: parseFloat(t.percent_change_24h) || 0, high24h: 0, low24h: 0,
        volume24h: parseFloat(t.volume_24h) || 0, marketCap: parseFloat(t.market_cap) || 0, fundingRate: 0, sparkline: [],
      }));
      const mp = (v: any) => parseFloat(v ?? '0');
      const body: any = { coins, global: globalFromCoins(coins, clT.length, 0, mp(clG.btc_dominance)), timestamp: Date.now(), source: 'coinlore', degraded: true };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
    }
    // P3b: Public CoinGecko markets (no key). Rich data incl. market cap.
    const cg = await timed('coingecko-public', cgMarkets);
    if (cg && cg.length >= 3) {
      const coins = cg.map((t: any, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).toUpperCase(), price: parseFloat(t.current_price) || 0,
        priceChangePercent: parseFloat(t.price_change_percentage_24h) || 0,
        high24h: parseFloat(t.high_24h) || 0, low24h: parseFloat(t.low_24h) || 0,
        volume24h: parseFloat(t.total_volume) || 0, marketCap: parseFloat(t.market_cap) || 0, fundingRate: 0, sparkline: [],
      }));
      const body: any = { coins, global: globalFromCoins(coins, cg.length), timestamp: Date.now(), source: 'coingecko', degraded: true };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
    }
    const dcoins = DEGRADED_COINS.map((c) => ({
      rank: c.rank, symbol: c.symbol,
      price: parseFloat(c.price.toFixed(c.price >= 1 ? 2 : 6)),
      priceChangePercent: parseFloat(c.change.toFixed(2)),
      high24h: parseFloat(c.high.toFixed(c.price >= 1 ? 2 : 6)),
      low24h: parseFloat(c.low.toFixed(c.price >= 1 ? 2 : 6)),
      volume24h: c.volume, marketCap: 0, fundingRate: c.funding, sparkline: [],
    }));
    const fbody: any = { coins: dcoins, global: degradedGlobal(dcoins[0].price, dcoins[0].priceChangePercent), timestamp: Date.now(), source: 'fallback', degraded: true };
    if (debug) fbody.attempts = attempts;
    return NextResponse.json(fbody, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
  } catch {
    const ecoins = DEGRADED_COINS.map((c) => ({
      rank: c.rank, symbol: c.symbol, price: c.price, priceChangePercent: c.change,
      high24h: c.high, low24h: c.low, volume24h: c.volume, marketCap: 0, fundingRate: c.funding, sparkline: [],
    }));
    return NextResponse.json({ coins: ecoins, global: degradedGlobal(ecoins[0].price, ecoins[0].priceChangePercent), timestamp: Date.now(), source: 'fallback-error', degraded: true });
  }
}