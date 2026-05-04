'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function checkUsageLimit() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    return { allowed: false, error: "User not logged in" };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return { allowed: false, error: "System configuration error" };
  }

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { allowed: false, error: "Could not fetch user profile stats" };
  }

  const limit = profile.analysis_limit ?? 150; 
  const currentCount = profile.current_analysis_count || 0;

  if (currentCount >= limit) {
    return { allowed: false, error: `Analysis limit reached (${limit}/${limit}). Please upgrade.` };
  }

  return { allowed: true, currentCount, limit };
}

export async function incrementUsage() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { success: false };

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return { success: false };

  // Fetch latest again to be safe or just increment
  // We can just increment using RPC or fetch-update pattern
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('current_analysis_count')
    .eq('id', user.id)
    .single();
    
  if (profile) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ current_analysis_count: (profile.current_analysis_count || 0) + 1 })
        .eq('id', user.id);
  }
  return { success: true };
}

export async function saveAnalysis(analysisData: any, coinSymbol?: string, coinName?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
      .from('analysis_results')
      .insert({
          user_id: user.id,
          analysis_json: JSON.stringify(analysisData),
          coin_symbol: coinSymbol,
          coin_name: coinName
      });

  if (error) {
      console.error("Save Analysis Error:", error);
      return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUserUsage() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) return null;

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  const current = profile.current_analysis_count || 0;
  const limit = profile.analysis_limit ?? 150;

  return {
    analysis: {
      used: current,
      limit: limit,
      remaining: limit - current
    }
  };
}

export async function activatePendingSubscription() {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) return { success: false };
  
    // Check if user has pending plan in metadata
    const initialDays = user.user_metadata?.initial_plan_days;
    if (!initialDays) return { success: true, message: "No pending plan" }; // nothing to do
  
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) return { success: false, error: "Config error" };
  
    // Check current profile status
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_end_at')
        .eq('id', user.id)
        .single();
    
    // If subscription is already active (not null), we might want to clear the metadata but not overwrite?
    // Requirement says: "start 30 days from user first login"
    // If subscription_end_at is NULL, it means it hasn't started.
    
    if (!profile?.subscription_end_at) {
        // Activate it now
        const now = new Date();
        const endAt = new Date(now);
        endAt.setDate(endAt.getDate() + Number(initialDays));
        
        console.log(`Activating subscription for ${user.email}: ${initialDays} days, ends ${endAt.toISOString()}`);
  
        // 1. Update Profile
        await supabaseAdmin
            .from('user_profiles')
            .update({ subscription_end_at: endAt.toISOString() })
            .eq('id', user.id);
            
        // 2. Update Auth Metadata (Clear pending, set active)
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { 
                subscription_end_at: endAt.toISOString(),
                initial_plan_days: null // Clear it so it doesn't trigger again
            }
        });
        
        return { success: true, activated: true };
    } else {
        // Already active, just clear the metadata if it's there?
        // Let's clear it to be safe
        if (user.user_metadata.initial_plan_days) {
             await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { initial_plan_days: null }
            });
        }
        return { success: true, activated: false };
    }
  }

export async function searchTVSymbols(query: string) {
    try {
        const res = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query)}&hl=en&exchange=&lang=en&type=&domain=production`, {
            method: "GET",
            headers: {
                'Origin': 'https://www.tradingview.com'
            }
        });
        
        if (!res.ok) {
            console.error("TV Search Failed", res.status, await res.text());
            return [];
        }
        
        const data = await res.json();
        return data; 
    } catch (e) {
        console.error("TV Search Exception", e);
        return [];
    }
}

export async function fetchCoinGeckoData(coinId: string) {
    try {
        const timestamp = new Date().getTime();
        const apiKey = process.env.COINGECKO_API_KEY || "CG-yPmFTeENj4pGkQmCnXgT1Rmk"; 
        
        const headers = {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'x-cg-demo-api-key': apiKey
        };

        // 1. Fetch Basic Price Data
        const pricePromise = fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&_t=${timestamp}`, {
            cache: 'no-store',
            headers: headers
        });

        // 2. Fetch OHLC Data (1 Day - 30 min candles)
        const ohlcPromise = fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1&_t=${timestamp}`, {
            cache: 'no-store',
            headers: headers
        });

        const [priceRes, ohlcRes] = await Promise.all([pricePromise, ohlcPromise]);

        if (!priceRes.ok) throw new Error("API Limit (Price)");
        
        const priceData = await priceRes.json();
        let ohlcData = [];

        if (ohlcRes.ok) {
            ohlcData = await ohlcRes.json();
        }

        return {
            price: priceData[coinId],
            ohlc: ohlcData 
        };

    } catch (e) {
        console.warn("CoinGecko API failed (likely rate limit), using fallback.");
        return null; 
    }
}

/**
 * Fetches enriched market data from Binance + external APIs for AI analysis.
 * All APIs are free. Data: spot price, funding rate, OI, ATR, Fear & Greed, BTC correlation.
 */
export async function fetchEnrichedMarketData(symbol: string) {
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

    return {
        price, change24h, high24h, low24h, volume24h, openPrice,
        markPrice, indexPrice, fundingRate, nextFundingTime,
        openInterestUSD,
        atr4h, atrPercent, atrNote,
        recentCandles,
        btcPrice, btcChange24h, btcFundingRate,
        fearGreedValue, fearGreedLabel,
        dataAvailable: price > 0
    };
}

