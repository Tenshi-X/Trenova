'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Skull, BarChart, Flame, ArrowUpDown, Settings, X, Check, Activity, Snowflake, Percent } from 'lucide-react';
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
  bnbPrice: number;
  bnbChange24h: number;
  xrpPrice: number;
  xrpChange24h: number;
  dogePrice: number;
  dogeChange24h: number;
  avgFundingRate: number;
  topGainer: { symbol: string; change: number; price: number; volume: number };
  topLoser: { symbol: string; change: number; price: number; volume: number };
  gainersCount: number;
  losersCount: number;
  totalPairs: number;
}

const WIDGET_OPTIONS = [
    { id: 'btc', label: 'BTC/USDT Live Price' },
    { id: 'eth', label: 'ETH/USDT Live Price' },
    { id: 'sol', label: 'SOL/USDT Live Price' },
    { id: 'bnb', label: 'BNB/USDT Live Price' },
    { id: 'xrp', label: 'XRP/USDT Live Price' },
    { id: 'doge', label: 'DOGE/USDT Live Price' },
    { id: 'volume', label: '24h Global Volume' },
    { id: 'fng', label: 'Fear & Greed Index' },
    { id: 'gainer', label: 'Top Gainer (24h)' },
    { id: 'loser', label: 'Top Loser (24h)' },
    { id: 'momentum', label: 'Market Momentum' },
    { id: 'ethbtc', label: 'ETH/BTC Ratio' },
    { id: 'funding', label: 'Avg Funding Rate (Top 50)' },
];

const DEFAULT_WIDGETS = ['btc', 'eth', 'sol', 'volume', 'fng', 'gainer', 'momentum'];

export default function MarketIntelligence() {
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [fng, setFng] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    // Customization state
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>(DEFAULT_WIDGETS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempSelection, setTempSelection] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('trv_market_widgets');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length === 7) {
                        setSelectedWidgets(parsed);
                    }
                } catch (e) {}
            }
        }
    }, []);

    const fetchBinanceData = useCallback(async (force = false) => {
        try {
            const CACHE_KEY = 'trv_binance_global_data_v2';
            const CACHE_TTL = 9000;

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
                bnbPrice: json.global?.bnbPrice || 0,
                bnbChange24h: json.global?.bnbChange24h || 0,
                xrpPrice: json.global?.xrpPrice || 0,
                xrpChange24h: json.global?.xrpChange24h || 0,
                dogePrice: json.global?.dogePrice || 0,
                dogeChange24h: json.global?.dogeChange24h || 0,
                avgFundingRate: json.global?.avgFundingRate || 0,
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
            const CACHE_TTL = 300000;

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

    const handleSaveWidgets = () => {
        if (tempSelection.length === 7) {
            setSelectedWidgets(tempSelection);
            if (typeof window !== 'undefined') {
                localStorage.setItem('trv_market_widgets', JSON.stringify(tempSelection));
            }
            setIsSettingsOpen(false);
        }
    };

    const toggleWidgetSelection = (id: string) => {
        setTempSelection(prev => {
            if (prev.includes(id)) {
                return prev.filter(w => w !== id);
            } else if (prev.length < 7) {
                return [...prev, id];
            }
            return prev;
        });
    };

    const cardBase = "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative h-36";

    // Helper for rendering Coin Price Widgets
    const renderCoinWidget = (symbol: string, icon: string, color: string, price: number, change: number) => {
        const isUp = change >= 0;
        return (
            <div key={symbol} className={cardBase}>
                <div className="z-10">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                        <span className={`text-${color}-500 font-black text-base`}>{icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{symbol}/USDT</span>
                        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                    </div>
                    <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                        {price ? `$${price.toLocaleString('en', { minimumFractionDigits: symbol === 'DOGE' || symbol === 'XRP' ? 4 : 2, maximumFractionDigits: symbol === 'DOGE' || symbol === 'XRP' ? 4 : 2 })}` : "—"}
                    </div>
                    <div className={clsx("text-xs font-bold w-fit mt-1 px-1.5 py-0.5 rounded tabular-nums", isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                        {isUp ? '+' : ''}{change.toFixed(2)}%
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={clsx("w-full h-full fill-current", isUp ? "text-emerald-500" : "text-rose-500")}>
                        <path d={isUp ? "M0,20 L0,12 Q25,14 40,8 T70,10 T100,4 L100,20 Z" : "M0,20 L0,4 Q25,10 40,14 T70,10 T100,16 L100,20 Z"} />
                    </svg>
                </div>
            </div>
        );
    };

    const renderWidget = (id: string) => {
        switch (id) {
            case 'btc': return renderCoinWidget('BTC', '₿', 'orange', globalData?.btcPrice || 0, globalData?.btcChange24h || 0);
            case 'eth': return renderCoinWidget('ETH', 'Ξ', 'indigo', globalData?.ethPrice || 0, globalData?.ethChange24h || 0);
            case 'sol': return renderCoinWidget('SOL', '◎', 'purple', globalData?.solPrice || 0, globalData?.solChange24h || 0);
            case 'bnb': return renderCoinWidget('BNB', '🔶', 'yellow', globalData?.bnbPrice || 0, globalData?.bnbChange24h || 0);
            case 'xrp': return renderCoinWidget('XRP', '✕', 'slate', globalData?.xrpPrice || 0, globalData?.xrpChange24h || 0);
            case 'doge': return renderCoinWidget('DOGE', 'Ð', 'yellow', globalData?.dogePrice || 0, globalData?.dogeChange24h || 0);
            
            case 'volume':
                return (
                    <div key={id} className={cardBase}>
                        <div className="z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <BarChart size={14} className="text-cyan-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">24h Volume</span>
                            </div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                                {globalData ? formatCompactNumber(globalData.totalVolume24h) : "Loading..."}
                            </div>
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
                );
            case 'fng':
                return (
                    <div key={id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between h-36">
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
                );
            case 'gainer':
                return (
                    <div key={id} className={cardBase}>
                        <div className="z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Flame size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Top Gainer</span>
                            </div>
                            {globalData?.topGainer?.symbol ? (
                                <>
                                    <div className="text-lg font-black text-emerald-500 leading-tight truncate">
                                        {globalData.topGainer.symbol}
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                                        ${globalData.topGainer.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded mt-1 tabular-nums">
                                        +{globalData.topGainer.change.toFixed(2)}%
                                    </div>
                                </>
                            ) : <div className="text-slate-400 text-sm">Loading...</div>}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full fill-current text-emerald-500">
                                <path d="M0,20 L0,18 Q20,15 35,10 T65,6 T100,2 L100,20 Z" />
                            </svg>
                        </div>
                    </div>
                );
            case 'loser':
                return (
                    <div key={id} className={cardBase}>
                        <div className="z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Snowflake size={14} className="text-rose-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Top Loser</span>
                            </div>
                            {globalData?.topLoser?.symbol ? (
                                <>
                                    <div className="text-lg font-black text-rose-500 leading-tight truncate">
                                        {globalData.topLoser.symbol}
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                                        ${globalData.topLoser.price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <div className="text-xs font-bold text-rose-500 bg-rose-500/10 w-fit px-1.5 py-0.5 rounded mt-1 tabular-nums">
                                        {globalData.topLoser.change.toFixed(2)}%
                                    </div>
                                </>
                            ) : <div className="text-slate-400 text-sm">Loading...</div>}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-10 pointer-events-none">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full fill-current text-rose-500">
                                <path d="M0,20 L0,4 Q20,10 35,14 T65,18 T100,20 L100,20 Z" />
                            </svg>
                        </div>
                    </div>
                );
            case 'momentum':
                return (
                    <div key={id} className={cardBase}>
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
                            ) : <div className="text-slate-400 text-sm">Loading...</div>}
                        </div>
                    </div>
                );
            case 'ethbtc':
                const ratio = globalData?.ethPrice && globalData?.btcPrice ? (globalData.ethPrice / globalData.btcPrice) : 0;
                return (
                    <div key={id} className={cardBase}>
                        <div className="z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Percent size={14} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">ETH/BTC Ratio</span>
                            </div>
                            <div className="text-base font-black text-slate-800 dark:text-slate-100 tabular-nums leading-tight">
                                {ratio > 0 ? ratio.toFixed(5) : "—"}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2 font-medium">
                                Indicates Altcoin Season strength vs Bitcoin.
                            </div>
                        </div>
                    </div>
                );
            case 'funding':
                return (
                    <div key={id} className={cardBase}>
                        <div className="z-10">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Activity size={14} className="text-fuchsia-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Avg Funding</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <div className={clsx("text-xl font-black tabular-nums leading-tight", 
                                    (globalData?.avgFundingRate || 0) > 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {globalData?.avgFundingRate ? (globalData.avgFundingRate > 0 ? "+" : "") + globalData.avgFundingRate.toFixed(4) : "—"}%
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2 font-medium leading-snug">
                                {(globalData?.avgFundingRate || 0) > 0.01 
                                    ? "Market leans heavily LONG." 
                                    : (globalData?.avgFundingRate || 0) < 0 
                                    ? "Market leans heavily SHORT." 
                                    : "Neutral leverage positioning."}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative">
            <div className="flex justify-end mb-2 absolute -top-8 right-0 z-10">
                <button 
                    onClick={() => {
                        setTempSelection(selectedWidgets);
                        setIsSettingsOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-xs font-bold"
                >
                    <Settings size={12} />
                    Customize
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-3">
                {selectedWidgets.map(id => renderWidget(id))}
            </div>

            {lastUpdated ? (
                <div className="mb-6 text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live · Updated {lastUpdated.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Binance /10s · FNG /5min
                </div>
            ) : null}

            {/* Customization Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Customize</h3>
                                <p className="text-xs text-slate-500">Select exactly 7 widgets to display on your dashboard.</p>
                            </div>
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-400">Available Widgets</span>
                                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", 
                                    tempSelection.length === 7 ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                                )}>
                                    {tempSelection.length} / 7 Selected
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {WIDGET_OPTIONS.map((widget) => {
                                    const isSelected = tempSelection.includes(widget.id);
                                    const isDisabled = !isSelected && tempSelection.length >= 7;
                                    
                                    return (
                                        <button
                                            key={widget.id}
                                            onClick={() => toggleWidgetSelection(widget.id)}
                                            disabled={isDisabled}
                                            className={clsx(
                                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                                isSelected 
                                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                                    : isDisabled 
                                                        ? "border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed" 
                                                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                                            )}
                                        >
                                            <div className={clsx("w-4 h-4 rounded flex items-center justify-center border", 
                                                isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"
                                            )}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className="text-sm font-bold">{widget.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 shrink-0">
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveWidgets}
                                disabled={tempSelection.length !== 7}
                                className={clsx(
                                    "px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2",
                                    tempSelection.length === 7 
                                        ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                <Check size={16} />
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
