import { NextResponse } from 'next/server';

// Use Edge Runtime — runs on Cloudflare's edge network, not AWS Lambda.
// Binance blocks many cloud provider IPs (AWS, GCP) but Edge IPs are typically not blocked.
export const runtime = 'edge';
export const preferredRegion = ['sin1', 'hkg1', 'iad1']; // Singapore, Hong Kong, US East

/**
 * Combined Binance market data proxy.
 * Returns top 50 USDT pairs + global stats.
 * All server-side → bypasses Indonesian ISP blocks.
 */

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

async function fetchWithFallback(urls: string[], path: string, timeout = 10000): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TrenovaBot/1.0)',
        },
      });
      clearTimeout(timer);

      if (res.ok) return res;

      // If we get a non-ok response, try next domain
      console.warn(`Binance ${baseUrl}${path} returned ${res.status}`);
    } catch (err: any) {
      lastError = err;
      console.warn(`Binance ${baseUrl}${path} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('All Binance API domains unreachable');
}

export async function GET() {
  try {
    // Fetch ticker + funding in parallel with fallback domains
    const [tickerRes, fundingRes] = await Promise.allSettled([
      fetchWithFallback(BINANCE_SPOT_URLS, '/api/v3/ticker/24hr'),
      fetchWithFallback(BINANCE_FUTURES_URLS, '/fapi/v1/premiumIndex'),
    ]);

    // Parse ticker data
    let tickers: any[] = [];
    if (tickerRes.status === 'fulfilled') {
      tickers = await tickerRes.value.json();
    } else {
      console.error('All Binance ticker endpoints failed:', tickerRes.reason);
      return NextResponse.json(
        { error: 'Binance ticker API unreachable from all domains', detail: String(tickerRes.reason) },
        { status: 502 }
      );
    }

    // Parse funding rates (optional — don't fail if unavailable)
    let fundingMap: Record<string, number> = {};
    if (fundingRes.status === 'fulfilled') {
      try {
        const fundingData = await fundingRes.value.json();
        for (const f of fundingData) {
          if (f.symbol && f.lastFundingRate) {
            fundingMap[f.symbol] = parseFloat(f.lastFundingRate) * 100;
          }
        }
      } catch (e) {
        console.warn('Failed to parse funding data:', e);
      }
    }

    // Filter USDT pairs only, exclude stablecoins & leveraged tokens
    const stablecoins = ['USDCUSDT', 'BUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 'FDUSDUSDT', 'USDPUSDT', 'EURUSDT'];
    const usdtTickers = tickers.filter((t: any) => {
      if (!t.symbol?.endsWith('USDT')) return false;
      if (stablecoins.includes(t.symbol)) return false;
      if (/\d+(L|S)USDT$/.test(t.symbol)) return false;
      if (t.symbol.includes('UP') || t.symbol.includes('DOWN')) return false;
      return true;
    });

    // Calculate global stats from ticker data
    let totalVolume24h = 0;
    let btcVolume = 0;
    let topGainer = { symbol: '', change: -Infinity, price: 0, volume: 0 };
    let topLoser = { symbol: '', change: Infinity, price: 0, volume: 0 };
    let gainersCount = 0;
    let losersCount = 0;

    for (const t of usdtTickers) {
      const vol = parseFloat(t.quoteVolume || '0');
      const change = parseFloat(t.priceChangePercent || '0');
      const price = parseFloat(t.lastPrice || '0');
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

    // Sort by 24h quote volume (highest first)
    usdtTickers.sort((a: any, b: any) => {
      return parseFloat(b.quoteVolume || '0') - parseFloat(a.quoteVolume || '0');
    });

    const top50 = usdtTickers.slice(0, 50);

    // Get BTC, ETH, SOL specific data
    const btcTicker = tickers.find((t: any) => t.symbol === 'BTCUSDT');
    const ethTicker = tickers.find((t: any) => t.symbol === 'ETHUSDT');
    const solTicker = tickers.find((t: any) => t.symbol === 'SOLUSDT');

    // Build response for top 50 coins
    const coins = top50.map((t: any, index: number) => {
      const price = parseFloat(t.lastPrice || '0');
      const baseSymbol = t.symbol.replace('USDT', '');

      return {
        symbol: baseSymbol,
        pair: t.symbol,
        price,
        priceChangePercent: parseFloat(t.priceChangePercent || '0'),
        high24h: parseFloat(t.highPrice || '0'),
        low24h: parseFloat(t.lowPrice || '0'),
        volume24h: parseFloat(t.quoteVolume || '0'),
        fundingRate: fundingMap[t.symbol] ?? null,
        rank: index + 1,
      };
    });

    // Build global stats
    const global = {
      totalVolume24h,
      btcVolDominance: parseFloat(btcVolDominance.toFixed(2)),
      btcPrice: parseFloat(btcTicker?.lastPrice || '0'),
      btcChange24h: parseFloat(btcTicker?.priceChangePercent || '0'),
      ethPrice: parseFloat(ethTicker?.lastPrice || '0'),
      ethChange24h: parseFloat(ethTicker?.priceChangePercent || '0'),
      solPrice: parseFloat(solTicker?.lastPrice || '0'),
      solChange24h: parseFloat(solTicker?.priceChangePercent || '0'),
      topGainer,
      topLoser,
      gainersCount,
      losersCount,
      totalPairs: usdtTickers.length,
    };

    return NextResponse.json(
      { coins, global, timestamp: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=3',
        },
      }
    );
  } catch (error) {
    console.error('Binance market API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data from Binance', detail: String(error) },
      { status: 502 }
    );
  }
}
