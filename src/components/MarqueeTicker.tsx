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

const fallbackCoins: Coin[] = [
    { id: 'bitcoin', symbol: 'btc', current_price: 97420, price_change_percentage_24h: 3.06, image: '' },
    { id: 'ethereum', symbol: 'eth', current_price: 2078.26, price_change_percentage_24h: 4.80, image: '' },
    { id: 'tether', symbol: 'usdt', current_price: 0.999501, price_change_percentage_24h: -0.02, image: '' },
    { id: 'binancecoin', symbol: 'bnb', current_price: 630.14, price_change_percentage_24h: 2.93, image: '' },
    { id: 'ripple', symbol: 'xrp', current_price: 1.38, price_change_percentage_24h: 3.43, image: '' },
    { id: 'usd-coin', symbol: 'usdc', current_price: 0.999805, price_change_percentage_24h: -0.00, image: '' },
    { id: 'solana', symbol: 'sol', current_price: 87.78, price_change_percentage_24h: 5.62, image: '' },
    { id: 'tron', symbol: 'trx', current_price: 0.3108, price_change_percentage_24h: 1.24, image: '' },
    { id: 'cardano', symbol: 'ada', current_price: 0.68, price_change_percentage_24h: 2.15, image: '' },
    { id: 'dogecoin', symbol: 'doge', current_price: 0.172, price_change_percentage_24h: 4.30, image: '' },
    { id: 'avalanche-2', symbol: 'avax', current_price: 25.40, price_change_percentage_24h: 3.88, image: '' },
    { id: 'polkadot', symbol: 'dot', current_price: 5.12, price_change_percentage_24h: 2.76, image: '' },
    { id: 'chainlink', symbol: 'link', current_price: 14.25, price_change_percentage_24h: 5.10, image: '' },
    { id: 'polygon', symbol: 'matic', current_price: 0.38, price_change_percentage_24h: 3.22, image: '' },
    { id: 'litecoin', symbol: 'ltc', current_price: 92.30, price_change_percentage_24h: 1.85, image: '' },
];

export default function MarqueeTicker() {
    const [coins, setCoins] = useState<Coin[]>(fallbackCoins);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchCoins(force = false) {
            try {
                const CACHE_KEY = 'trv_cg_marquee_data';
                const CACHE_TTL = 115000;
                
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

                const res = await fetch(
                    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=24h`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
                        }
                        setCoins(data);
                    }
                }
            } catch {
                // Silently use fallback data - no console error
            } finally {
                setLoading(false);
            }
        }

        fetchCoins();
        
        // Refresh every 120 seconds (reduced frequency to avoid rate limits)
        const interval = setInterval(() => fetchCoins(true), 120000);
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
            {coin.image && <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />}
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
