import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 25;
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
const BINANCE_URLS = ['https://api.binance.com','https://api1.binance.com','https://api2.binance.com','https://api3.binance.com','https://api4.binance.com'];
const FAPI_URLS = ['https://fapi.binance.com'];
async function bFetch(urls: string[], path: string) {
  for (const base of urls) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 3500);
      const r = await fetch(base + path, { signal: c.signal, headers: { 'User-Agent': 'TrenovaBot/1.0' } });
      clearTimeout(t);
      if (!r.ok) continue;
      const d = await r.json();
      if (!Array.isArray(d)) continue;
      return d as any[];
    } catch { /* next mirror */ }
  }
  return null;
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
export async function GET() {
  try {
    const tickers = await bFetch(BINANCE_URLS, '/api/v3/ticker/24hr');
    const funding = await bFetch(FAPI_URLS, '/fapi/v1/premiumIndex');
    if (tickers && tickers.length) {
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
      const pick = (s: string) => tickers.find((t: any) => t.symbol === s);
      const btc = pick('BTCUSDT'), eth = pick('ETHUSDT'), sol = pick('SOLUSDT');
      const bnb = pick('BNBUSDT'), xrp = pick('XRPUSDT'), doge = pick('DOGEUSDT');
      const np = (v: any) => parseFloat(v ?? '0');
      const global = {
        totalVolume24h: totalVol, btcVolDominance: parseFloat(btcDom.toFixed(2)),
        btcPrice: np(btc?.lastPrice), btcChange24h: np(btc?.priceChangePercent),
        ethPrice: np(eth?.lastPrice), ethChange24h: np(eth?.priceChangePercent),
        solPrice: np(sol?.lastPrice), solChange24h: np(sol?.priceChangePercent),
        bnbPrice: np(bnb?.lastPrice), bnbChange24h: np(bnb?.priceChangePercent),
        xrpPrice: np(xrp?.lastPrice), xrpChange24h: np(xrp?.priceChangePercent),
        dogePrice: np(doge?.lastPrice), dogeChange24h: np(doge?.priceChangePercent),
        avgFundingRate: parseFloat(avgFR.toFixed(4)), topGainer: topG, topLoser: topL,
        gainersCount: gainers, losersCount: losers, totalPairs: usdt.length,
      };
      return NextResponse.json({ coins, global, timestamp: Date.now(), source: 'binance', degraded: false }, { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3' } });
    }
    const clG = await clGlobal();
    const clT = await clTickers();
    if (clG && clT && clT.length) {
      const allow = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','DOT','LINK','MATIC','ATOM','UNI','OP','ARB'];
      const coins = clT.filter((t: any) => allow.includes(String(t.symbol).toUpperCase())).slice(0, 50).map((t: any, i: number) => ({
        rank: i + 1, symbol: String(t.symbol).toUpperCase(), price: parseFloat(t.price),
        priceChangePercent: parseFloat(t.percent_change_24h) || 0, high24h: 0, low24h: 0,
        volume24h: parseFloat(t.volume_24h) || 0, marketCap: parseFloat(t.market_cap) || 0, fundingRate: 0, sparkline: [],
      }));
      let cg = { symbol: '', change: -Infinity, price: 0, volume: 0 };
      let cl = { symbol: '', change: Infinity, price: 0, volume: 0 };
      let gn = 0, ls = 0;
      for (const t of clT) {
        const chg = parseFloat(t.percent_change_24h), prc = parseFloat(t.price), vol = parseFloat(t.volume_24h);
        if (chg > cg.change) cg = { symbol: String(t.symbol).toUpperCase(), change: chg, price: prc, volume: vol };
        if (chg < cl.change) cl = { symbol: String(t.symbol).toUpperCase(), change: chg, price: prc, volume: vol };
        if (chg > 0) gn++; if (chg < 0) ls++;
      }
      const fp = (s: string) => clT.find((t: any) => t.symbol === s);
      const cb = fp('BTC'), ce = fp('ETH'), cs = fp('SOL'), cn = fp('BNB'), cx = fp('XRP'), cd = fp('DOGE');
      const mp = (v: any) => parseFloat(v ?? '0');
      const cglobal = {
        totalVolume24h: mp(clG.total_volume_24h), btcVolDominance: mp(clG.btc_dominance),
        btcPrice: mp(cb?.price), btcChange24h: mp(cb?.percent_change_24h),
        ethPrice: mp(ce?.price), ethChange24h: mp(ce?.percent_change_24h),
        solPrice: mp(cs?.price), solChange24h: mp(cs?.percent_change_24h),
        bnbPrice: mp(cn?.price), bnbChange24h: mp(cn?.percent_change_24h),
        xrpPrice: mp(cx?.price), xrpChange24h: mp(cx?.percent_change_24h),
        dogePrice: mp(cd?.price), dogeChange24h: mp(cd?.percent_change_24h),
        avgFundingRate: 0, topGainer: cg, topLoser: cl,
        gainersCount: gn, losersCount: ls, totalPairs: clT.length,
      };
      return NextResponse.json({ coins, global: cglobal, timestamp: Date.now(), source: 'coinlore', degraded: true }, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
    }
    const dcoins = DEGRADED_COINS.map((c) => ({
      rank: c.rank, symbol: c.symbol,
      price: parseFloat(c.price.toFixed(c.price >= 1 ? 2 : 6)),
      priceChangePercent: parseFloat(c.change.toFixed(2)),
      high24h: parseFloat(c.high.toFixed(c.price >= 1 ? 2 : 6)),
      low24h: parseFloat(c.low.toFixed(c.price >= 1 ? 2 : 6)),
      volume24h: c.volume, marketCap: 0, fundingRate: c.funding, sparkline: [],
    }));
    return NextResponse.json({ coins: dcoins, global: degradedGlobal(dcoins[0].price, dcoins[0].priceChangePercent), timestamp: Date.now(), source: 'fallback', degraded: true }, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
  } catch {
    const ecoins = DEGRADED_COINS.map((c) => ({
      rank: c.rank, symbol: c.symbol, price: c.price, priceChangePercent: c.change,
      high24h: c.high, low24h: c.low, volume24h: c.volume, marketCap: 0, fundingRate: c.funding, sparkline: [],
    }));
    return NextResponse.json({ coins: ecoins, global: degradedGlobal(ecoins[0].price, ecoins[0].priceChangePercent), timestamp: Date.now(), source: 'fallback-error', degraded: true });
  }
}