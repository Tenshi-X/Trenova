import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Combined Binance market data proxy.
 * Returns top 50 USDT pairs + global stats.
 * All server-side → bypasses Indonesian ISP blocks.
 * 
 * Stats derived purely from official Binance API ticker data:
 * - 24h Volume, BTC Vol. Dominance, Top Gainer/Loser
 * - Funding Rates from futures API
 */

export async function GET() {
  try {
    // Fetch ticker + funding in parallel (removed unreliable get-products)
    const [tickerRes, fundingRes] = await Promise.allSettled([
      fetch('https://api.binance.com/api/v3/ticker/24hr', { cache: 'no-store' }),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex', { cache: 'no-store' }),
    ]);

    // Parse ticker data
    let tickers: any[] = [];
    if (tickerRes.status === 'fulfilled' && tickerRes.value.ok) {
      tickers = await tickerRes.value.json();
    } else {
      return NextResponse.json({ error: 'Binance ticker API unreachable' }, { status: 502 });
    }

    // Parse funding rates
    let fundingMap: Record<string, number> = {};
    if (fundingRes.status === 'fulfilled' && fundingRes.value.ok) {
      const fundingData = await fundingRes.value.json();
      for (const f of fundingData) {
        if (f.symbol && f.lastFundingRate) {
          fundingMap[f.symbol] = parseFloat(f.lastFundingRate) * 100;
        }
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

      // Only consider coins with meaningful volume for top gainer/loser (>$1M)
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

    // Take top 50
    const top50 = usdtTickers.slice(0, 50);

    // Get BTC and ETH specific data
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
      { error: 'Failed to fetch market data from Binance' },
      { status: 502 }
    );
  }
}
