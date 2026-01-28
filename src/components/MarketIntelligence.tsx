'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Skull, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function MarketIntelligence() {
    const [marketData, setMarketData] = useState<any>(null);
    const [fng, setFng] = useState<any>(null);

    useEffect(() => {
        // Fetch CoinGecko Global
        fetch('https://api.coingecko.com/api/v3/global')
            .then(res => res.json())
            .then(data => setMarketData(data.data))
            .catch(err => console.error("Global Data Error", err));

        // Fetch Fear & Greed
        fetch('https://api.alternative.me/fng/?limit=1')
            .then(res => res.json())
            .then(data => setFng(data.data[0]))
            .catch(err => console.error("FNG Error", err));
    }, []);

    const formatCurrency = (val: number) => {
        if (!val) return "$-";
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
            {/* Market Cap */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase">Market Cap</span>
                </div>
                <div className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-200">
                    {marketData ? formatCurrency(marketData.total_market_cap.usd) : "Loading..."}
                </div>
                <div className={clsx("text-xs font-bold", (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {marketData?.market_cap_change_percentage_24h_usd?.toFixed(2)}%
                </div>
                 {/* Mini Chart Placeholder */}
                 <div className="h-8 mt-2 opacity-50">
                    <svg viewBox="0 0 100 20" className={clsx("w-full h-full stroke-2 fill-none", (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? "stroke-emerald-500" : "stroke-rose-500")}>
                        <path d="M0,15 Q25,5 50,10 T100,5" />
                    </svg>
                 </div>
            </div>

            {/* Fear & Greed */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Skull size={16} />
                    <span className="text-xs font-bold uppercase">Fear & Greed</span>
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-200">
                        {fng ? fng.value : "--"}
                    </div>
                </div>
                {fng && (
                     <div className="flex flex-col gap-1 mt-1">
                        <span className={clsx("text-xs font-bold", parseInt(fng.value) > 50 ? "text-emerald-500" : "text-orange-500")}>{fng.value_classification}</span>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                            <div 
                                className={clsx("h-full rounded-full transition-all duration-1000", 
                                    parseInt(fng.value) < 25 ? "bg-rose-500" :
                                    parseInt(fng.value) < 45 ? "bg-orange-500" :
                                    parseInt(fng.value) < 55 ? "bg-yellow-500" :
                                    "bg-emerald-500"
                                )} 
                                style={{width: `${fng.value}%`}} 
                            />
                        </div>
                     </div>
                )}
            </div>

            {/* Altcoin Season (Mocked for now as per complexity constraints) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase">Altcoin Season</span>
                </div>
                <div className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-200">
                     {marketData ? `${Math.max(10, Math.min(90, 100 - Math.round(marketData.market_cap_percentage.btc * 1.5)))}/100` : "--"}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                    <span>Bitcoin</span>
                    <span>Altcoin</span>
                </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-1 rounded-full overflow-hidden flex">
                      <div className="h-full bg-orange-400" style={{width: marketData ? `${marketData.market_cap_percentage.btc}%` : '50%'}} />
                      <div className="h-full bg-blue-500 flex-1" />
                 </div>
            </div>


        </div>
    );
}
