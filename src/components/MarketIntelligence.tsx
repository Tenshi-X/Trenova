'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Activity, Skull, Zap, BarChart } from 'lucide-react';
import clsx from 'clsx';
import { fetchMarketSentiment } from '@/app/dashboard/actions';

export default function MarketIntelligence() {
    const [marketData, setMarketData] = useState<any>(null);
    const [fng, setFng] = useState<any>(null);
    const [btcPrice, setBtcPrice] = useState<number | null>(null);
    const [ethPrice, setEthPrice] = useState<number | null>(null);
    const [btcChange, setBtcChange] = useState<number>(0);
    const [ethChange, setEthChange] = useState<number>(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchGlobalData = useCallback(async () => {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/global');
            const data = await res.json();
            setMarketData(data.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Global Data Error", err);
        }
    }, []);

    const fetchLivePrices = useCallback(async () => {
        try {
            const res = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
            );
            if (!res.ok) { console.warn('CoinGecko price fetch:', res.status); return; }
            const data = await res.json();

            if (data.bitcoin) {
                setBtcPrice(data.bitcoin.usd);
                setBtcChange(data.bitcoin.usd_24h_change ?? 0);
            }
            if (data.ethereum) {
                setEthPrice(data.ethereum.usd);
                setEthChange(data.ethereum.usd_24h_change ?? 0);
            }
        } catch (err) {
            console.error("Live price fetch error", err);
        }
    }, []);

    const fetchSentiment = useCallback(async () => {
        const data = await fetchMarketSentiment();
        if (data) setFng(data);
    }, []);

    useEffect(() => {
        fetchGlobalData();
        fetchLivePrices();
        fetchSentiment();

        const globalTimer = setInterval(fetchGlobalData, 60000);
        const priceTimer  = setInterval(fetchLivePrices, 15000);
        const sentTimer   = setInterval(fetchSentiment, 300000);

        return () => {
            clearInterval(globalTimer);
            clearInterval(priceTimer);
            clearInterval(sentTimer);
        };
    }, [fetchGlobalData, fetchLivePrices, fetchSentiment]);

    const formatCurrency = (val: number) => {
        if (!val) return "$-";
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        return `$${val.toLocaleString()}`;
    };

    const formatCompactNumber = (number: number) => {
        if (!number) return "-";
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 2,
            style: "currency",
            currency: "USD"
        }).format(number);
    };

    const cardBase = "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative h-36";

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-3">

                {/* BTC Price — Binance Live */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <span className="text-orange-500 font-black text-base">₿</span>
                            <span className="text-xs font-bold uppercase tracking-wider">BTC/USDT</span>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                            {btcPrice ? `$${btcPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
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

                {/* ETH Price — Binance Live */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                            <span className="text-indigo-500 font-black text-base">Ξ</span>
                            <span className="text-xs font-bold uppercase tracking-wider">ETH/USDT</span>
                            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                            {ethPrice ? `$${ethPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
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

                {/* Market Cap */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <TrendingUp size={14} className="text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Market Cap</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                            {marketData ? formatCurrency(marketData.total_market_cap.usd) : "Loading..."}
                        </div>
                        <div className={clsx("text-xs font-bold w-fit mt-1 px-1.5 py-0.5 rounded", (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {marketData?.market_cap_change_percentage_24h_usd?.toFixed(2)}%
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={clsx("w-full h-full fill-current", (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            <path d="M0,20 L0,15 Q10,18 20,12 T40,10 T60,14 T80,8 T100,5 L100,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* 24h Volume */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <BarChart size={14} className="text-cyan-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">24h Volume</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                            {marketData ? formatCompactNumber(marketData.total_volume.usd) : "Loading..."}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Global trading volume</p>
                    </div>
                    <div className="absolute bottom-0 right-0 w-20 h-10 opacity-10 flex gap-0.5 items-end px-3 pb-2">
                        <div className="flex-1 bg-cyan-500 h-[40%] rounded-t-sm"></div>
                        <div className="flex-1 bg-cyan-500 h-[70%] rounded-t-sm"></div>
                        <div className="flex-1 bg-cyan-500 h-[50%] rounded-t-sm"></div>
                        <div className="flex-1 bg-cyan-500 h-[100%] rounded-t-sm"></div>
                        <div className="flex-1 bg-cyan-500 h-[60%] rounded-t-sm"></div>
                    </div>
                </div>

                {/* Fear & Greed */}
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

                {/* Altcoin Season */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-36">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Activity size={14} className="text-purple-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Altcoin Season</span>
                        </div>
                        <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #f97316 0%, #cbd5e1 50%, #3b82f6 100%)', opacity: 0.8 }} />
                            {marketData && (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 h-3 w-1 bg-white border border-slate-300 dark:border-slate-600 shadow-md rounded-full transition-all duration-1000"
                                    style={{ left: `${Math.max(5, Math.min(95, 100 - Math.round(marketData.market_cap_percentage.btc * 1.5)))}%` }}
                                ></div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">BTC</span>
                            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
                                {marketData ? `${Math.max(10, Math.min(90, 100 - Math.round(marketData.market_cap_percentage.btc * 1.5)))}` : "--"}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Alts</span>
                            <span className="text-xs font-bold text-slate-500">Season</span>
                        </div>
                    </div>
                </div>

                {/* BTC Dominance */}
                <div className={cardBase}>
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Zap size={14} className="text-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">BTC Dom.</span>
                        </div>
                        <div className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                            {marketData ? `${marketData.market_cap_percentage.btc.toFixed(1)}%` : "Loading..."}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: marketData ? `${marketData.market_cap_percentage.btc}%` : '0%' }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
                            <span>0%</span><span>50%</span><span>100%</span>
                        </div>
                    </div>
                </div>

            </div>
            {lastUpdated ? (
                <div className="mb-6 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live · Updated {lastUpdated.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · BTC/ETH /15s · Global /60s
                </div>
            ) : null}
        </>
    );
}
