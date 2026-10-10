import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 25;
export const revalidate = 10;
// Live market aggregator. Priority: Coinbase (Vercel-friendly) -> Binance -> CoinLore -> static.
// Always returns 200, never 500/502.
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
  } catch (e: unknown) {
    done();
    return { ok: false as const, error: e instanceof Error ? e.name : String(e) };
  }
}
const BINANCE_URLS = ['https://api.binance.com','https://api1.binance.com','https://api2.binance.com','https://api3.binance.com','https://api4.binance.com'];
const FAPI_URLS = ['https://fapi.binance.com'];
async function bFetch(urls: string[], path: string) {
  // Parallel race: all mirrors at once, first valid array wins. Total ~4s max.
  const jobs = urls.map((base) => (async () => {
    const out = await fetchJson(base + path, 4000);
    if (out.ok && Array.isArray(out.data)) return out.data as Record<string, string>[];
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
    const price = parseFloat(tk.data?.price ?? '0');
    const open = parseFloat(st.data?.open ?? '0');
    const high = parseFloat(st.data?.high ?? '0');
    const low = parseFloat(st.data?.low ?? '0');
    const vol = parseFloat(st.data?.volume ?? '0'); // base volume
    if (!price) return null;
    const chg = open ? ((price - open) / open) * 100 : 0;
    return { symbol: p.symbol, price, priceChangePercent: chg, high24h: high, low24h: low, volume24h: vol * price, marketCap: 0, fundingRate: null as number | null, sparkline: [] as number[] };
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
    } catch (e: unknown) {
      attempts.push({ provider, ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) });
      return null;
    }
  };
  const globalFromCoins = (coins: { symbol: string; volume24h: number; priceChangePercent: number; price: number }[], totalPairs: number, avgFR: number | null = null, btcDom = 52) => {
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
      const body: Record<string, unknown> = { coins: cb, global: globalFromCoins(cb, cb.length), timestamp: Date.now(), source: 'coinbase', degraded: false };
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
      const usdt = tickers.filter((t: Record<string, string>) => t.symbol?.endsWith('USDT') && !stable.includes(t.symbol));
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
      usdt.sort((a: Record<string, string>, b: Record<string, string>) => parseFloat(b.quoteVolume ?? '0') - parseFloat(a.quoteVolume ?? '0'));
      const coins = usdt.slice(0, 50).map((t: Record<string, string>, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).replace('USDT','').toUpperCase(),
        price: parseFloat(t.lastPrice ?? '0'), priceChangePercent: parseFloat(t.priceChangePercent ?? '0'),
        high24h: parseFloat(t.highPrice ?? '0'), low24h: parseFloat(t.lowPrice ?? '0'),
        volume24h: parseFloat(t.quoteVolume ?? '0'), marketCap: 0, fundingRate: null as number | null, sparkline: [],
      }));
      const fm: Record<string, number> = {};
      for (const f of (funding ?? [])) { if (f.symbol && f.lastFundingRate) fm[f.symbol] = parseFloat(f.lastFundingRate) * 100; }
      let tf = 0, tfc = 0;
      for (const k in fm) { if (k.endsWith('USDT') && !stable.includes(k)) { tf += fm[k]; tfc++; } }
      const avgFR = tfc > 0 ? tf / tfc : null;
      coins.forEach((coin) => { coin.fundingRate = fm[`${coin.symbol}USDT`] ?? null; });
      const body: Record<string, unknown> = { coins, global: globalFromCoins(coins, usdt.length, avgFR === null ? null : Number(avgFR.toFixed(4)), parseFloat(btcDom.toFixed(2))), timestamp: Date.now(), source: 'binance', degraded: false };
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
      const coins = clT.filter((t: Record<string, string>) => allow.includes(String(t.symbol).toUpperCase())).slice(0, 50).map((t: Record<string, string>, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).toUpperCase(), price: parseFloat(t.price),
        priceChangePercent: parseFloat(t.percent_change_24h) || 0, high24h: 0, low24h: 0,
        volume24h: parseFloat(t.volume_24h) || 0, marketCap: parseFloat(t.market_cap) || 0, fundingRate: null as number | null, sparkline: [],
      }));
      const mp = (v: string | undefined) => parseFloat(v ?? '0');
      const body: Record<string, unknown> = { coins, global: globalFromCoins(coins, clT.length, 0, mp(clG.btc_dominance)), timestamp: Date.now(), source: 'coinlore', degraded: true };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
    }
    // P3b: Public CoinGecko markets (no key). Rich data incl. market cap.
    const cg = await timed('coingecko-public', cgMarkets);
    if (cg && cg.length >= 3) {
      const coins = cg.map((t: Record<string, string>, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).toUpperCase(), price: parseFloat(t.current_price) || 0,
        priceChangePercent: parseFloat(t.price_change_percentage_24h) || 0,
        high24h: parseFloat(t.high_24h) || 0, low24h: parseFloat(t.low_24h) || 0,
        volume24h: parseFloat(t.total_volume) || 0, marketCap: parseFloat(t.market_cap) || 0, fundingRate: null as number | null, sparkline: [],
      }));
      const body: Record<string, unknown> = { coins, global: globalFromCoins(coins, cg.length), timestamp: Date.now(), source: 'coingecko', degraded: true };
      if (debug) body.attempts = attempts;
      return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
    }
    return NextResponse.json({ coins: [], error: 'Data pasar tidak tersedia.' }, { status: 503 });
  } catch {
    return NextResponse.json({ coins: [], error: 'Data pasar tidak tersedia.' }, { status: 503 });
  }
}
