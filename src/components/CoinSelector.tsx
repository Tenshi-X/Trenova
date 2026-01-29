'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

export type Coin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
};

interface CoinSelectorProps {
    selectedCoinId: string;
    onSelect: (coin: Coin) => void;
}

import { useLanguage } from '@/context/LanguageContext';

export default function CoinSelector({ selectedCoinId, onSelect }: CoinSelectorProps) {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [displayedCoins, setDisplayedCoins] = useState<Coin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [search, setSearch] = useState('');
    const { t } = useLanguage();
    
    // 1. Initial Load: Fetch Top 100 Coins
    useEffect(() => {
        async function fetchTopCoins() {
            setLoading(true);
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`);
                if (res.ok) {
                    const data = await res.json();
                    setCoins(data);
                    setDisplayedCoins(data);
                }
            } catch (e) {
                console.error("Coin fetch error", e);
            } finally {
                setLoading(false);
            }
        }
        fetchTopCoins();
    }, []);

    // 2. Search Logic (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length >= 2) {
                setSearching(true);
                try {
                    // A. Search for Coin IDs
                    const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${search}`);
                    if (!searchRes.ok) throw new Error("Search failed");
                    const searchData = await searchRes.json();
                    
                    // Take top 10 results
                    const topCoins = searchData.coins.slice(0, 50);
                    const coinIds = topCoins.map((c: any) => c.id).join(',');

                    if (coinIds) {
                        // B. Fetch Market Data for these IDs
                        const marketRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false`);
                        if (marketRes.ok) {
                            const marketData = await marketRes.json();
                            setDisplayedCoins(marketData);
                        }
                    } else {
                        setDisplayedCoins([]);
                    }

                } catch (e) {
                    console.error("Search API Error", e);
                } finally {
                    setSearching(false);
                }
            } else {
                // Return to local filter of top 100 or full list
                if (search.length === 0) {
                    setDisplayedCoins(coins);
                } else {
                     // Local filter for 1 char
                     const filtered = coins.filter(c => 
                        c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.symbol.toLowerCase().includes(search.toLowerCase())
                    );
                    setDisplayedCoins(filtered);
                }
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [search, coins]);


    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-colors">
            
            {/* Search Bar */}
            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder={t('coin_search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all"
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                         <Loader2 className="animate-spin text-neon" size={16} />
                    </div>
                )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 mb-4 px-1">
                {t('coin_search_disclaimer')}
            </p>

            {/* Horizontal Scroll List */}
            {loading ? (
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                    <Loader2 className="animate-spin" size={20} /> {t('coin_loading')}
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {displayedCoins.length > 0 ? displayedCoins.map(coin => {
                        const isSelected = selectedCoinId === coin.id;
                        const isBullish = (coin.price_change_percentage_24h || 0) >= 0;

                        return (
                            <button
                                key={coin.id}
                                onClick={() => onSelect(coin)}
                                className={clsx(
                                    "flex flex-col items-start min-w-[140px] p-3 rounded-2xl border transition-all snap-start text-left relative overflow-hidden group",
                                    isSelected 
                                        ? "bg-emerald-500 dark:bg-neon border-emerald-500 dark:border-neon text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 dark:shadow-neon/20" 
                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md dark:shadow-none"
                                )}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                                </div>
                                
                                <span className={clsx("font-bold text-sm truncate w-full", isSelected ? "text-white dark:text-slate-950" : "text-slate-800 dark:text-slate-200")}>
                                    {coin.name}
                                </span>
                                <span className={clsx("text-xs font-mono uppercase opacity-70 mb-1")}>
                                    {coin.symbol}
                                </span>

                                <div className={clsx("mt-auto flex items-center gap-1 text-[10px] font-bold", isBullish ? "text-emerald-500" : "text-rose-500")}>
                                    {isBullish ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {coin.price_change_percentage_24h ? Math.abs(coin.price_change_percentage_24h).toFixed(2) : "0.00"}%
                                </div>
                            </button>
                        );
                    }) : (
                        <div className="w-full text-center py-4 text-slate-400 text-sm">
                            {searching ? t('searching_global') : `${t('coin_no_match')} "${search}"`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

}
