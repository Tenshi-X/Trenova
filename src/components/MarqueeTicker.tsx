'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Coin = {
    id: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    image: string;
};

export default function MarqueeTicker() {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCoins() {
            try {
                // Fetch top 30 coins for the ticker
                const res = await fetch(
                    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=24h`
                );
                if (res.ok) {
                    const data = await res.json();
                    setCoins(data);
                }
            } catch (error) {
                console.error('Failed to fetch ticker data', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCoins();
        
        // Refresh every 60 seconds
        const interval = setInterval(fetchCoins, 60000);
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
                        <TickerItem key={coin.id} coin={coin} />
                    ))}
                </div>
                {/* Duplicate set for seamless scrolling */}
                <div className="flex gap-8 px-4 items-center">
                    {coins.map((coin) => (
                        <TickerItem key={`${coin.id}-duplicate`} coin={coin} />
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
            <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
            <span className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase">
                {coin.symbol}
            </span>
            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
            <div className={`flex items-center text-xs font-bold ${isBullish ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isBullish ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
            </div>
        </div>
    );
}
