'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Skull, BarChart, Flame, ArrowUpDown, Percent } from 'lucide-react';
import clsx from 'clsx';

interface GlobalData {
  totalVolume24h: number;
  btcVolDominance: number;
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  solPrice: number;
  solChange24h: number;
  topGainer: { symbol: string; change: number; price: number; volume: number };
  topLoser: { symbol: string; change: number; price: number; volume: number };
  gainersCount: number;
  losersCount: number;
  totalPairs: number;
}

export default function MarketIntelligence() {
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [fng, setFng] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchBinanceData = useCallback(async (force = false) => {
        try {
            const CACHE_KEY = 'trv_binance_global_data_v2';
            const CACHE_TTL = 9000; // 9 seconds

            if (!force && typeof window !== 'undefined') {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const { timestamp, data } = JSON.parse(cached);
                        if (Date.now() - timestamp < CACHE_TTL) {
                            setGlobalData(data);
                            setLastUpdated(new Date(timestamp));
                            return;
                        }
                    } catch (e) {}
                }
            }

            const res = await fetch('/api/binance-market');
            if (!res.ok) throw new Error('Binance market API error');
            const json = await res.json();

            const data: GlobalData = {
                totalVolume24h: json.global?.totalVolume24h || 0,
                btcVolDominance: json.global?.btcVolDominance || 0,
                btcPrice: json.global?.btcPrice || 0,
                btcChange24h: json.global?.btcChange24h || 0,
                ethPrice: json.global?.ethPrice || 0,
                ethChange24h: json.global?.ethChange24h || 0,
                solPrice: json.global?.solPrice || 0,
                solChange24h: json.global?.solChange24h || 0,
                topGainer: json.global?.topGainer || { symbol: '—', change: 0, price: 0, volume: 0 },
                topLoser: json.global?.topLoser || { symbol: '—', change: 0, price: 0, volume: 0 },
                gainersCount: json.global?.gainersCount || 0,
                losersCount: json.global?.losersCount || 0,
                totalPairs: json.global?.totalPairs || 0,
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
            }

            setGlobalData(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Binance Global Data Error", err);
        }
    }, []);

    const fetchSentiment = useCallback(async () => {
        try {
            const CACHE_KEY = 'trv_fng_cache';
            const CACHE_TTL = 300000; // 5 minutes

            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const { timestamp, data } = JSON.parse(cached);
                        if (Date.now() - timestamp < CACHE_TTL) {
                            setFng(data);
                            return;
                        }
                    } catch (e) {}
                }
            }

            const res = await fetch("https://api.alternative.me/fng/?limit=1");
            if (!res.ok) return;
            const data = await res.json();
            if (data.data?.[0]) {
                setFng(data.data[0]);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data.data[0] }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch sentiment:", e);
        }
    }, []);

    useEffect(() => {
        fetchBinanceData();
        fetchSentiment();

        const priceTimer = setInterval(() => fetchBinanceData(true), 10000);
        const sentTimer = setInterval(fetchSentiment, 300000);

        return () => {
            clearInterval(priceTimer);
            clearInterval(sentTimer);
        };
    }, [fetchBinanceData, fetchSentiment]);

    const formatCompactNumber = (number: number) => {
        if (!number) return "-";
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 2,
            style: "currency",
            currency: "USD"
        }).format(number);
    };

    const btcChange = globalData?.btcChange24h ?? 0;
    const ethChange = globalData?.ethChange24h ?? 0;
    const solChange = globalData?.solChange24h ?? 0;

    const cardBase = "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative h-36";

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-3">

                {/* 1. BTC Price — Binance Live */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <span className="text-orange-500 font-black text-base">₿</span>
                            <span className="text-xs font-bold uppercase tracking-wider">BTC/USDT</span>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                            {globalData?.btcPrice ? `$${globalData.btcPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </div>
                        <div className={clsx("text-xs font-bold w-fit mt-1 px-1.5 py-0.5 rounded tabular-nums", btcChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={clsx("w-full h-full fill-current", btcChange >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            <path d="M0,20 L0,12 Q25,14 40,8 T70,10 T100,4 L100,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* 2. ETH Price — Binance Live */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <span className="text-indigo-500 font-black text-base">Ξ</span>
                            <span className="text-xs font-bold uppercase tracking-wider">ETH/USDT</span>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                            {globalData?.ethPrice ? `$${globalData.ethPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </div>
                        <div className={clsx("text-xs font-bold w-fit mt-1 px-1.5 py-0.5 rounded tabular-nums", ethChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={clsx("w-full h-full fill-current", ethChange >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            <path d="M0,20 L0,15 Q20,10 40,12 T70,8 T100,5 L100,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* 3. SOL Price — Binance Live */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <span className="text-purple-500 font-black text-base">◎</span>
                            <span className="text-xs font-bold uppercase tracking-wider">SOL/USDT</span>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                            {globalData?.solPrice ? `$${globalData.solPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </div>
                        <div className={clsx("text-xs font-bold w-fit mt-1 px-1.5 py-0.5 rounded tabular-nums", solChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {solChange >= 0 ? '+' : ''}{solChange.toFixed(2)}%
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={clsx("w-full h-full fill-current", solChange >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            <path d="M0,20 L0,14 Q15,10 30,14 T60,8 T100,6 L100,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* 4. 24h Volume */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <BarChart size={14} className="text-cyan-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">24h Volume</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                            {globalData ? formatCompactNumber(globalData.totalVolume24h) : "Loading..."}
                        </div>
                        {/* BTC Volume Dominance bar */}
                        <div className="mt-2">
                            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>BTC Vol</span>
                                <span className="font-bold text-cyan-500">{globalData?.btcVolDominance?.toFixed(1) || '0'}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-cyan-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${globalData?.btcVolDominance || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Fear & Greed */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between h-36">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Skull size={14} className={clsx(
                                !fng ? "text-slate-400" :
                                parseInt(fng.value) < 25 ? "text-rose-500" :
                                parseInt(fng.value) < 45 ? "text-orange-500" :
                                "text-emerald-500"
                            )}/>
                            <span className="text-xs font-bold uppercase tracking-wider">Fear & Greed</span>
                        </div>
                        <div className="mt-1">
                            <div className={clsx("text-2xl font-black",
                                !fng ? "text-slate-300" :
                                parseInt(fng.value) < 25 ? "text-rose-500" :
                                parseInt(fng.value) < 45 ? "text-orange-500" :
                                parseInt(fng.value) < 55 ? "text-yellow-500" :
                                "text-emerald-500"
                            )}>
                                {fng ? fng.value : "--"}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fng ? fng.value_classification : "Loading"}</div>
                        </div>
                    </div>
                    <div className="w-16 h-8 relative flex items-end justify-center overflow-hidden shrink-0">
                        <div className="absolute w-16 h-16 rounded-full border-[5px] border-slate-100 dark:border-slate-800 top-0 box-border"></div>
                        <div className="absolute w-16 h-16 rounded-full top-0 opacity-80" style={{
                            background: `conic-gradient(from 270deg, #ef4444 0deg 90deg, #f97316 90deg 126deg, #eab308 126deg 150deg, #22c55e 150deg 180deg, transparent 180deg)`,
                            maskImage: 'radial-gradient(transparent 55%, black 56%)',
                            WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)'
                        }}></div>
                        {fng && (
                            <div
                                className="absolute bottom-0 left-1/2 h-full w-[2px] bg-slate-800 dark:bg-white origin-bottom transition-transform duration-1000 ease-out z-10"
                                style={{ transform: `rotate(${(parseInt(fng.value) / 100) * 180 - 90}deg)`, height: '100%' }}
                            >
                                <div className="w-1.5 h-1.5 bg-slate-800 dark:bg-white rounded-full absolute bottom-[-1px] left-[-2px]"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Top Gainer 24h */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Flame size={14} className="text-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Top Gainer</span>
                        </div>
                        {globalData?.topGainer?.symbol ? (
                            <>
                                <div className="text-lg font-black text-emerald-500 leading-tight">
                                    {globalData.topGainer.symbol}
                                </div>
                                <div className="text-xs font-mono text-slate-400 mt-0.5">
                                    ${globalData.topGainer.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </div>
                                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded mt-1 tabular-nums">
                                    +{globalData.topGainer.change.toFixed(2)}%
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-400 text-sm">Loading...</div>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full fill-current text-emerald-500">
                            <path d="M0,20 L0,18 Q20,15 35,10 T65,6 T100,2 L100,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* 7. Market Momentum (Gainers vs Losers) */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <ArrowUpDown size={14} className="text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Momentum</span>
                        </div>
                        {globalData ? (
                            <>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp size={12} className="text-emerald-500" />
                                        <span className="text-sm font-black text-emerald-500">{globalData.gainersCount}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold">vs</div>
                                    <div className="flex items-center gap-1">
                                        <TrendingDown size={12} className="text-rose-500" />
                                        <span className="text-sm font-black text-rose-500">{globalData.losersCount}</span>
                                    </div>
                                </div>
                                {/* Ratio bar */}
                                <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-1000"
                                        style={{ width: `${(globalData.gainersCount / Math.max(1, globalData.totalPairs)) * 100}%` }}
                                    />
                                    <div
                                        className="bg-rose-500 h-full transition-all duration-1000"
                                        style={{ width: `${(globalData.losersCount / Math.max(1, globalData.totalPairs)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-bold uppercase">
                                    <span>Bullish</span>
                                    <span>{globalData.totalPairs} pairs</span>
                                    <span>Bearish</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-400 text-sm">Loading...</div>
                        )}
                    </div>
                </div>

            </div>
            {lastUpdated ? (
                <div className="mb-6 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live · Updated {lastUpdated.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Binance /10s · FNG /5min
                </div>
            ) : null}
        </>
    );
}
