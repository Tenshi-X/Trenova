import { NextResponse } from 'next/server';

/**
 * Combined Binance market data proxy.
 * Returns top USDT pairs + global stats.
 * If Binance is unreachable, returns a degraded fallback so the dashboard market widget
 * still renders instead of showing a 502 / console error.
 */

// ── Fallback coin snapshot (used when Binance API is unreachable) ──────────
const DEGRADED_COINS = [
  { symbol: 'BTC', price: 67500.00, priceChangePercent: 2.35, high24h: 68200.00, low24h: 66100.00, volume24h: 2500000000, fundingRate: 0.0001, rank: 1 },
  { symbol: 'ETH', price: 3450.00, priceChangePercent: 1.82, high24h: 3490.00, low24h: 3390.00, volume24h: 1500000000, fundingRate: 0.0002, rank: 2 },
  { symbol: 'SOL', price: 145.20, priceChangePercent: 5.12, high24h: 147.50, low24h: 138.00, volume24h: 3200000000, fundingRate: 0.0005, rank: 3 },
  { symbol: 'BNB', price: 585.00, priceChangePercent: 1.10, high24h: 589.00, low24h: 577.00, volume24h: 180000000, fundingRate: 0.0003, rank: 4 },
  { symbol: 'XRP', price: 0.5230, priceChangePercent: -0.45, high24h: 0.5350, low24h: 0.5120, volume24h: 520000000, fundingRate: -0.0001, rank: 5 },
  { symbol: 'DOGE', price: 0.0825, priceChangePercent: 3.20, high24h: 0.0835, low24h: 0.0790, volume24h: 480000000, fundingRate: 0.0001, rank: 6 },
  { symbol: 'ADA', price: 0.3820, priceChangePercent: 1.55, high24h: 0.3880, low24h: 0.3750, volume24h: 210000000, fundingRate: 0.0000, rank: 7 },
  { symbol: 'AVAX', price: 32.50, priceChangePercent: -2.10, high24h: 33.80, low24h: 32.00, volume24h: 380000000, fundingRate: -0.0003, rank: 8 },
  { symbol: 'DOT', price: 5.25, priceChangePercent: 0.80, high24h: 5.32, low24h: 5.18, volume24h: 95000000, fundingRate: 0.0001, rank: 9 },
  { symbol: 'LINK', price: 12.80, priceChangePercent: 2.75, high24h: 12.95, low24h: 12.40, volume24h: 220000000, fundingRate: 0.0004, rank: 10 },
  { symbol: 'MATIC', price: 0.2850, priceChangePercent: -1.20, high24h: 0.2910, low24h: 0.2800, volume24h: 180000000, fundingRate: -0.0002, rank: 11 },
  { symbol: 'ATOM', price: 8.45, priceChangePercent: 0.45, high24h: 8.55, low24h: 8.35, volume24h: 75000000, fundingRate: 0.0000, rank: 12 },
  { symbol: 'OP', price: 1.85, priceChangePercent: 4.50, high24h: 1.88, low24h: 1.77, volume24h: 150000000, fundingRate: 0.0006, rank: 13 },
  { symbol: 'ARB', price: 0.82, priceChangePercent: -3.10, high24h: 0.85, low24h: 0.80, volume24h: 120000000, fundingRate: -0.0004, rank: 14 },
  { symbol: 'UNI', price: 6.95, priceChangePercent: 1.30, high24h: 7.02, low24h: 6.85, volume24h: 110000000, fundingRate: 0.0002, rank: 15 },
];

function normalizeCoin(t: any, index: number) {
  const price = parseFloat(t.lastPrice ?? t.price ?? '0');
  return {
    rank: index + 1,
    symbol: (t.symbol || '').replace('USDT', ''),
    price,
    priceChangePercent: parseFloat(t.priceChangePercent ?? '0'),
    high24h: parseFloat(t.highPrice ?? t.high24h ?? '0'),
    low24h: parseFloat(t.lowPrice ?? t.low24h ?? '0'),
    volume24h: parseFloat(t.quoteVolume ?? t.volume24h ?? '0'),
    marketCap: 0,
    fundingRate: 0,
    sparkline: [],
  };
}

function degradedGlobalStats(price: number, change: number) {
  const eth = DEGRADED_COINS.find(c => c.symbol === 'ETH') ?? { price: 0, priceChangePercent: 0 };
  const sol = DEGRADED_COINS.find(c => c.symbol === 'SOL') ?? { price: 0, priceChangePercent: 0 };
  const bnb = DEGRADED_COINS.find(c => c.symbol === 'BNB') ?? { price: 0, priceChangePercent: 0 };
  const xrp = DEGRADED_COINS.find(c => c.symbol === 'XRP') ?? { price: 0, priceChangePercent: 0 };
  const doge = DEGRADED_COINS.find(c => c.symbol === 'DOGE') ?? { price: 0, priceChangePercent: 0 };
  return {
    totalVolume24h: DEGRADED_COINS.reduce((sum, c) => sum + (c.volume24h || 0), 0),
    btcVolDominance: 52.30,
    btcPrice: price,
    btcChange24h: change,
    ethPrice: eth.price,
    ethChange24h: eth.priceChangePercent,
    solPrice: sol.price,
    solChange24h: sol.priceChangePercent,
    bnbPrice: bnb.price,
    bnbChange24h: bnb.priceChangePercent,
    xrpPrice: xrp.price,
    xrpChange24h: xrp.priceChangePercent,
    dogePrice: doge.price,
    dogeChange24h: doge.priceChangePercent,
    avgFundingRate: 0.0001,
    topGainer: { symbol: 'SOL', change: 5.12, price: 145.20, volume: 3200000000 },
    topLoser: { symbol: 'AVAX', change: -2.10, price: 32.50, volume: 380000000 },
    gainersCount: 9,
    losersCount: 6,
    totalPairs: DEGRADED_COINS.length,
  };
}

// Binance has multiple API domains — fallback if one is blocked
const BINANCE_SPOT_URLS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
];

const BINANCE_FUTURES_URLS = [
  'https://fapi.binance.com',
];

type FetchResult =
  | { ok: true; data: unknown[] }
  | { ok: false; reason: string };

async function fetchWithFallback(
  urls: string[],
  path: string,
  timeoutMs = 8000,
): Promise<FetchResult> {
  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TrenovaBot/1.0)',
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[binance-market] ${baseUrl}${path} returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`[binance-market] ${baseUrl}${path} returned non-array response`);
        continue;
      }

      return { ok: true, data };
    } catch (err: any) {
      console.warn(`[binance-market] ${baseUrl}${path} failed: ${err?.message ?? String(err)}`);
    }
  }

  return {
    ok: false,
    reason: 'Binance ticker API unreachable from all fallback domains',
  };
}

export async function GET() {
  const tickerResult = await fetchWithFallback(BINANCE_SPOT_URLS, '/api/v3/ticker/24hr');
  const fundingResult = await fetchWithFallback(BINANCE_FUTURES_URLS, '/fapi/v1/premiumIndex');

  const rawTickers = tickerResult.ok ? (tickerResult.data as any[]) : [];
  const rawFunding = fundingResult.ok ? (fundingResult.data as any[]) : [];

  if (rawTickers.length === 0) {
    console.warn('[binance-market] Binance ticker unavailable; returning degraded market snapshot');

    const degradedCoins = DEGRADED_COINS.map((c) => ({
      ...c,
      price: parseFloat(c.price.toFixed(c.price >= 1 ? 2 : 6)),
      priceChangePercent: parseFloat(c.priceChangePercent.toFixed(2)),
      high24h: parseFloat(c.high24h.toFixed(c.price >= 1 ? 2 : 6)),
      low24h: parseFloat(c.low24h.toFixed(c.price >= 1 ? 2 : 6)),
      volume24h: c.volume24h,
      fundingRate: c.fundingRate,
      rank: c.rank,
    }));

    return NextResponse.json(
      {
        coins: degradedCoins,
        global: degradedGlobalStats(degradedCoins[0].price, degradedCoins[0].priceChangePercent),
        timestamp: Date.now(),
        degraded: true,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      },
    );
  }

  const stablecoins = ['USDCUSDT', 'BUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 'FDUSDUSDT', 'USDPUSDT', 'EURUSDT'];

  const usdtTickers = rawTickers.filter((t: any) => {
    if (!t.symbol?.endsWith('USDT')) return false;
    if (stablecoins.includes(t.symbol)) return false;
    if (/\d+(L|S)USDT$/.test(t.symbol)) return false;
    if (t.symbol.includes('UP') || t.symbol.includes('DOWN')) return false;
    return true;
  });

  let totalVolume24h = 0;
  let btcVolume = 0;
  let topGainer = { symbol: '', change: -Infinity, price: 0, volume: 0 };
  let topLoser = { symbol: '', change: Infinity, price: 0, volume: 0 };
  let gainersCount = 0;
  let losersCount = 0;

  for (const t of usdtTickers) {
    const vol = parseFloat(t.quoteVolume ?? '0');
    const change = parseFloat(t.priceChangePercent ?? '0');
    const price = parseFloat(t.lastPrice ?? '0');
    totalVolume24h += vol;

    if (t.symbol === 'BTCUSDT') btcVolume = vol;

    if (vol > 1_000_000) {
      if (change > topGainer.change) {
        topGainer = { symbol: t.symbol.replace('USDT', ''), change, price, volume: vol };
      }
      if (change < topLoser.change) {
        topLoser = { symbol: t.symbol.replace('USDT', ''), change, price, volume: vol };
      }
    }

    if (change > 0) gainersCount++;
    else if (change < 0) losersCount++;
  }

  const btcVolDominance = totalVolume24h > 0 ? (btcVolume / totalVolume24h) * 100 : 0;

  usdtTickers.sort((a: any, b: any) => parseFloat(b.quoteVolume ?? '0') - parseFloat(a.quoteVolume ?? '0'));

  const top50 = usdtTickers.slice(0, 50);

  const fundingMap: Record<string, number> = {};
  for (const f of rawFunding) {
    if (f.symbol && f.lastFundingRate) {
      fundingMap[f.symbol] = parseFloat(f.lastFundingRate) * 100;
    }
  }

  let totalFunding = 0;
  let fundingCount = 0;
  for (const symbol in fundingMap) {
    if (symbol.endsWith('USDT') && !stablecoins.includes(symbol)) {
      totalFunding += fundingMap[symbol];
      fundingCount++;
    }
  }
  const avgFundingRate = fundingCount > 0 ? totalFunding / fundingCount : 0;

  const coins = top50.map((t, index) => normalizeCoin(t, index));

  const btcTicker = rawTickers.find((t: any) => t.symbol === 'BTCUSDT');
  const ethTicker = rawTickers.find((t: any) => t.symbol === 'ETHUSDT');
  const solTicker = rawTickers.find((t: any) => t.symbol === 'SOLUSDT');
  const bnbTicker = rawTickers.find((t: any) => t.symbol === 'BNBUSDT');
  const xrpTicker = rawTickers.find((t: any) => t.symbol === 'XRPUSDT');
  const dogeTicker = rawTickers.find((t: any) => t.symbol === 'DOGEUSDT');

  const global = {
    totalVolume24h,
    btcVolDominance: parseFloat(btcVolDominance.toFixed(2)),
    btcPrice: parseFloat(btcTicker?.lastPrice ?? btcTicker?.price ?? '0'),
    btcChange24h: parseFloat(btcTicker?.priceChangePercent ?? btcTicker?.change ?? '0'),
    ethPrice: parseFloat(ethTicker?.lastPrice ?? ethTicker?.price ?? '0'),
    ethChange24h: parseFloat(ethTicker?.priceChangePercent ?? ethTicker?.change ?? '0'),
    solPrice: parseFloat(solTicker?.lastPrice ?? solTicker?.price ?? '0'),
    solChange24h: parseFloat(solTicker?.priceChangePercent ?? solTicker?.change ?? '0'),
    bnbPrice: parseFloat(bnbTicker?.lastPrice ?? bnbTicker?.price ?? '0'),
    bnbChange24h: parseFloat(bnbTicker?.priceChangePercent ?? bnbTicker?.change ?? '0'),
    xrpPrice: parseFloat(xrpTicker?.lastPrice ?? xrpTicker?.price ?? '0'),
    xrpChange24h: parseFloat(xrpTicker?.priceChangePercent ?? xrpTicker?.change ?? '0'),
    dogePrice: parseFloat(dogeTicker?.lastPrice ?? dogeTicker?.price ?? '0'),
    dogeChange24h: parseFloat(dogeTicker?.priceChangePercent ?? dogeTicker?.change ?? '0'),
    avgFundingRate: parseFloat(avgFundingRate.toFixed(4)),
    topGainer,
    topLoser,
    gainersCount,
    losersCount,
    totalPairs: usdtTickers.length,
  };

  return NextResponse.json(
    { coins, global, timestamp: Date.now(), degraded: false },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3',
      },
    },
  );
}


