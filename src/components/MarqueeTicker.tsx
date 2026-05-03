'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Coin = {
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
};

const fallbackCoins: Coin[] = [
    { symbol: 'BTC', current_price: 97420, price_change_percentage_24h: 3.06 },
    { symbol: 'ETH', current_price: 2078.26, price_change_percentage_24h: 4.80 },
    { symbol: 'BNB', current_price: 630.14, price_change_percentage_24h: 2.93 },
    { symbol: 'XRP', current_price: 1.38, price_change_percentage_24h: 3.43 },
    { symbol: 'SOL', current_price: 87.78, price_change_percentage_24h: 5.62 },
    { symbol: 'DOGE', current_price: 0.172, price_change_percentage_24h: 4.30 },
    { symbol: 'ADA', current_price: 0.68, price_change_percentage_24h: 2.15 },
    { symbol: 'TRX', current_price: 0.3108, price_change_percentage_24h: 1.24 },
    { symbol: 'AVAX', current_price: 25.40, price_change_percentage_24h: 3.88 },
    { symbol: 'DOT', current_price: 5.12, price_change_percentage_24h: 2.76 },
    { symbol: 'LINK', current_price: 14.25, price_change_percentage_24h: 5.10 },
    { symbol: 'LTC', current_price: 92.30, price_change_percentage_24h: 1.85 },
    { symbol: 'MATIC', current_price: 0.38, price_change_percentage_24h: 3.22 },
    { symbol: 'SHIB', current_price: 0.0000145, price_change_percentage_24h: 2.55 },
    { symbol: 'UNI', current_price: 6.80, price_change_percentage_24h: 3.91 },
];

export default function MarqueeTicker() {
    const [coins, setCoins] = useState<Coin[]>(fallbackCoins);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchCoins(force = false) {
            try {
                const CACHE_KEY = 'trv_binance_marquee_data';
                const CACHE_TTL = 30000; // 30 seconds
                
                if (!force && typeof window !== 'undefined') {
                    const cached = localStorage.getItem(CACHE_KEY);
                    if (cached) {
                        try {
                            const { timestamp, data } = JSON.parse(cached);
                            if (Date.now() - timestamp < CACHE_TTL) {
                                setCoins(data);
                                setLoading(false);
                                return;
                            }
                        } catch(e) {}
                    }
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const res = await fetch('/api/binance-market', { signal: controller.signal });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const json = await res.json();
                    if (json.coins && json.coins.length > 0) {
                        // Take top 30 by volume
                        const mapped: Coin[] = json.coins.slice(0, 30).map((c: any) => ({
                            symbol: c.symbol,
                            current_price: c.price,
                            price_change_percentage_24h: c.priceChangePercent,
                        }));

                        if (typeof window !== 'undefined') {
                            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: mapped }));
                        }
                        setCoins(mapped);
                    }
                }
            } catch {
                // Silently use fallback data
            } finally {
                setLoading(false);
            }
        }

        fetchCoins();
        
        // Refresh every 30 seconds
        const interval = setInterval(() => fetchCoins(true), 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || coins.length === 0) return null;

    return (
        <div className="w-full overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800 py-2">
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 180s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
            <div className="flex w-max animate-marquee">
                {/* First set of coins */}
                <div className="flex gap-8 px-4 items-center">
                    {coins.map((coin) => (
                        <TickerItem key={coin.symbol} coin={coin} />
                    ))}
                </div>
                {/* Duplicate set for seamless scrolling */}
                <div className="flex gap-8 px-4 items-center">
                    {coins.map((coin) => (
                        <TickerItem key={`${coin.symbol}-duplicate`} coin={coin} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TickerItem({ coin }: { coin: Coin }) {
    const isBullish = (coin.price_change_percentage_24h || 0) >= 0;

    return (
        <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase">
                {coin.symbol}
            </span>
            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                ${(coin.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
            <div className={`flex items-center text-xs font-bold ${isBullish ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isBullish ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
            </div>
        </div>
    );
}
