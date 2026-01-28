'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { calculateRSI, calculateStoch, calculateCCI, normalizeRSI, normalizeStoch, normalizeCCI } from '@/lib/technical-analysis';
import clsx from 'clsx';
import { Loader2, Activity, Gauge } from 'lucide-react';

interface SentimentChartProps {
    symbol: string;
}

export default function SentimentChart({ symbol }: SentimentChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!symbol) return;
        
        const fetchBinance = async (sym: string) => {
            let clean = sym.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            // Binance mappings
            if (clean.endsWith('USD') && !clean.endsWith('USDT')) clean = clean.replace(/USD$/, 'USDT');
            if (!clean.endsWith('USDT') && !clean.endsWith('BTC') && !clean.endsWith('ETH')) clean = `${clean}USDT`;
            
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${clean}&interval=1h&limit=100`);
            if (!res.ok) throw new Error("Binance symbol not found");
            const raw = await res.json();
            return raw.map((d: any) => ({
                close: parseFloat(d[4]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3])
            }));
        };

        const fetchCryptoCompare = async (sym: string) => {
            // Parse base symbol (e.g. HYPEUSDT -> HYPE)
            let base = sym.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (base.endsWith('USDT')) base = base.replace('USDT', '');
            else if (base.endsWith('USD')) base = base.replace('USD', '');
            
            const res = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${base}&tsym=USD&limit=100`);
            const data = await res.json();
            if (data.Response === 'Error') throw new Error("CC symbol not found");
            
            return data.Data.Data.map((d: any) => ({
                close: d.close,
                high: d.high,
                low: d.low
            }));
        };

        async function fetchData() {
            setLoading(true);
            setError('');
            
            try {
                // Strategy 1: Try Binance
                try {
                    const data = await fetchBinance(symbol);
                    if (data.length > 30) {
                        setData(data);
                        return;
                    }
                } catch (ignored) {
                   // Continue to fallback
                   console.log("Binance failed, trying fallback...");
                }

                // Strategy 2: Try CryptoCompare (Backup for alts like HYPE)
                const data = await fetchCryptoCompare(symbol);
                if (data.length > 30) {
                    setData(data);
                } else {
                    throw new Error("Insufficient data");
                }

            } catch (e) {
                console.warn("Sentiment Data Fetch Failed", e);
                setError("Data unavailable");
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [symbol]);


    const metrics = useMemo(() => {
        if (data.length < 30) return null;
        
        const closes = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        
        // Calculate Raw
        const rsiRaw = calculateRSI(closes, 14) || 50;
        const stochRaw = calculateStoch(highs, lows, closes, 14) || 50;
        const cciRaw = calculateCCI(highs, lows, closes, 20) || 0;
        
        // Normalize
        const rsiNorm = normalizeRSI(rsiRaw);
        const stochNorm = normalizeStoch(stochRaw);
        const cciNorm = normalizeCCI(cciRaw);
        
        // Average Sentiment (Simple weight)
        const sentiment = (rsiNorm + stochNorm + cciNorm) / 3;
        
        return {
            sentiment,
            rsi: { raw: rsiRaw, norm: rsiNorm },
            stoch: { raw: stochRaw, norm: stochNorm },
            cci: { raw: cciRaw, norm: cciNorm }
        };
    }, [data]);


    // RENDER STATES
    if (loading) return (
        <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 className="animate-spin text-neon" size={18}/> 
            <span>Analyzing Market Sentiment for {symbol}...</span>
        </div>
    );

    if (error) return (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-400">
             <span>⚠️ Sentiment analysis unavailable for <b>{symbol}</b> (Data source mismatch)</span>
        </div>
    );

    if (!metrics) return null;

    const { sentiment, rsi, stoch, cci } = metrics;
    
    // Gradient Color Logic
    const getColor = (val: number) => {
        if (val >= 60) return "text-emerald-500";
        if (val <= 40) return "text-rose-500";
        return "text-slate-400";
    };
    
    const getBgColor = (val: number) => {
        if (val >= 60) return "bg-emerald-500";
        if (val <= 40) return "bg-rose-500";
        return "bg-slate-400";
    };

    return (
        <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row gap-6 items-center">
                
                {/* Gauge Section */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-w-[200px]">
                    <div className="absolute top-0 left-0 flex items-center gap-2 text-slate-500">
                         <Activity size={16} />
                         <span className="text-xs font-bold uppercase">Technical Sentiment</span>
                    </div>
                    
                    {/* Gauge Visual */}
                    <div className="relative w-48 h-24 mt-6 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-slate-100 dark:bg-slate-800 rounded-t-full" />
                        <div 
                            className={clsx("absolute top-0 left-0 w-full h-full rounded-t-full origin-bottom transition-all duration-1000 opacity-50", getBgColor(sentiment))} 
                            style={{ transform: `rotate(${(sentiment / 100) * 180 - 180}deg)`}}
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-white dark:bg-slate-900 rounded-t-full flex items-end justify-center pb-2">
                            <div className="text-center">
                                <div className={clsx("text-3xl font-black", getColor(sentiment))}>
                                    {sentiment.toFixed(1)}%
                                </div>
                                <div className="text-[10px] font-bold uppercase text-slate-400">
                                    {sentiment >= 60 ? "Bullish" : sentiment <= 40 ? "Bearish" : "Neutral"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bars Section (The "Panel" from the screenshot) */}
                <div className="flex-1 w-full grid grid-cols-3 gap-2 md:gap-4">
                     <IndicatorBar label="RSI" value={rsi.norm} raw={rsi.raw.toFixed(2)} />
                     <IndicatorBar label="Stoch %K" value={stoch.norm} raw={stoch.raw.toFixed(2)} />
                     <IndicatorBar label="CCI" value={cci.norm} raw={cci.raw.toFixed(2)} />
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                 <span>Powered by Antigravity Technical Analysis Engine</span>
                 <span>Source: LuxAlgo Logic Replicated</span>
            </div>
        </div>
    );
}

function IndicatorBar({ label, value, raw }: { label: string, value: number, raw: string }) {
    const isBullish = value >= 60;
    const isBearish = value <= 40;
    
    return (
        <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-500">{label}</span>
                <span className="text-[10px] font-mono opacity-50">{raw}</span>
            </div>
            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-lg relative overflow-hidden flex items-end">
                <div 
                    className={clsx("w-full transition-all duration-700", 
                        isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-slate-400"
                    )}
                    style={{ height: `${value}%` }} 
                />
            </div>
            <div className="text-center text-[10px] font-bold md:mt-1">
                 {isBullish ? "BULL" : isBearish ? "BEAR" : "NEUT"}
            </div>
        </div>
    );
}
