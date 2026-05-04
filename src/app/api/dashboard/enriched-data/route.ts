import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = ['sin1', 'hkg1', 'iad1'];

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
    }

    const pair = `${symbol.toUpperCase()}USDT`;
    const TIMEOUT = 5000;

    const safeFetch = async (url: string): Promise<any> => {
        try {
            const res = await fetch(url, { 
                cache: 'no-store',
                signal: AbortSignal.timeout(TIMEOUT),
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrenovaBot/1.0)' }
            });
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    };

    // Binance has multiple spot API domains — try them with fallback
    const SPOT_URLS = [
        'https://api.binance.com',
        'https://api1.binance.com',
        'https://api2.binance.com',
        'https://api3.binance.com',
        'https://api4.binance.com',
    ];

    const safeFetchSpot = async (path: string): Promise<any> => {
        for (const base of SPOT_URLS) {
            const result = await safeFetch(`${base}${path}`);
            if (result) return result;
        }
        return null;
    };

    // Fetch all data in parallel (non-blocking)
    const [
        tickerData,
        fundingData,
        oiData,
        klines1h,
        klines4h,
        btcTicker,
        btcFunding,
        fearGreedData
    ] = await Promise.all([
        safeFetchSpot(`/api/v3/ticker/24hr?symbol=${pair}`),
        safeFetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${pair}`),
        safeFetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${pair}`),
        safeFetchSpot(`/api/v3/klines?symbol=${pair}&interval=1h&limit=24`),
        safeFetchSpot(`/api/v3/klines?symbol=${pair}&interval=4h&limit=15`),
        safeFetchSpot(`/api/v3/ticker/24hr?symbol=BTCUSDT`),
        safeFetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT`),
        safeFetch('https://api.alternative.me/fng/?limit=1'),
    ]);

    // ── Parse Spot Ticker ──
    const price = tickerData ? parseFloat(tickerData.lastPrice || '0') : 0;
    const change24h = tickerData ? parseFloat(tickerData.priceChangePercent || '0') : 0;
    const high24h = tickerData ? parseFloat(tickerData.highPrice || '0') : 0;
    const low24h = tickerData ? parseFloat(tickerData.lowPrice || '0') : 0;
    const volume24h = tickerData ? parseFloat(tickerData.quoteVolume || '0') : 0;
    const openPrice = tickerData ? parseFloat(tickerData.openPrice || '0') : 0;

    // ── Parse Derivatives ──
    const markPrice = fundingData ? parseFloat(fundingData.markPrice || '0') : null;
    const indexPrice = fundingData ? parseFloat(fundingData.indexPrice || '0') : null;
    const fundingRate = fundingData ? parseFloat(fundingData.lastFundingRate || '0') : null;
    const nextFundingTime = fundingData ? fundingData.nextFundingTime : null;

    // ── Parse Open Interest ──
    let openInterestRaw = oiData ? parseFloat(oiData.openInterest || '0') : 0;
    let openInterestUSD = 'N/A';
    if (openInterestRaw && (markPrice || price)) {
        const oiUsd = openInterestRaw * (markPrice || price);
        openInterestUSD = oiUsd >= 1e9 ? `$${(oiUsd / 1e9).toFixed(2)}B` : `$${(oiUsd / 1e6).toFixed(1)}M`;
    }

    // ── Calculate ATR from 4H Klines ──
    let atr4h = 'N/A';
    let atrPercent = '';
    let atrNote = '';
    if (Array.isArray(klines4h) && klines4h.length >= 2) {
        const trueRanges: number[] = [];
        for (let i = 1; i < klines4h.length; i++) {
            const high = parseFloat(klines4h[i][2]);
            const low = parseFloat(klines4h[i][3]);
            const prevClose = parseFloat(klines4h[i - 1][4]);
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        const atrVal = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
        const lastClose = parseFloat(klines4h[klines4h.length - 1][4]);
        atrPercent = (atrVal / lastClose * 100).toFixed(2);
        atr4h = atrVal > 100 ? `$${atrVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${atrVal.toFixed(4)}`;
        atrNote = parseFloat(atrPercent) > 5 ? 'VOLATILITAS SANGAT TINGGI' :
                  parseFloat(atrPercent) > 2 ? 'Volatilitas tinggi' :
                  parseFloat(atrPercent) > 1 ? 'Volatilitas normal' : 'Volatilitas rendah/squeeze';
    }

    // ── Parse Recent 1H Candles for prompt ──
    let recentCandles: { open: number; high: number; low: number; close: number; volume: number }[] = [];
    if (Array.isArray(klines1h)) {
        recentCandles = klines1h.slice(-8).map((k: any) => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    }

    // ── Parse BTC Data ──
    const btcPrice = btcTicker ? parseFloat(btcTicker.lastPrice || '0') : null;
    const btcChange24h = btcTicker ? parseFloat(btcTicker.priceChangePercent || '0') : null;
    const btcFundingRate = btcFunding ? parseFloat(btcFunding.lastFundingRate || '0') : null;

    // ── Parse Fear & Greed ──
    const fearGreedValue = fearGreedData?.data?.[0]?.value || 'N/A';
    const fearGreedLabel = fearGreedData?.data?.[0]?.value_classification || 'N/A';

    return NextResponse.json({
        price, change24h, high24h, low24h, volume24h, openPrice,
        markPrice, indexPrice, fundingRate, nextFundingTime,
        openInterestUSD,
        atr4h, atrPercent, atrNote,
        recentCandles,
        btcPrice, btcChange24h, btcFundingRate,
        fearGreedValue, fearGreedLabel,
        dataAvailable: price > 0
    });
}
