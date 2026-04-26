'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Star, TrendingUp, TrendingDown, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  prevPrice: number;
  chg24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  marketCap: number;
  image: string;
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MAX_PAIRS = 50;

function fmtPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return '$' + p.toFixed(4);
  if (p >= 0.01) return '$' + p.toFixed(5);
  return '$' + p.toFixed(8);
}
function fmtVol(v: number): string {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveMarketTable({ onSelectSymbol }: LiveMarketTableProps) {
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'vol' | 'chg' | 'price' | 'sym'>('vol');
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc');
  const [favorites, setFavorites]     = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage?.getItem('trv_lm_favs') || '[]')); }
    catch { return new Set(); }
  });
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mounted  = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch top coins ───────────────────────────────────────────────────────
  const fetchMarketData = useCallback(async (force = false) => {
    try {
      const CACHE_KEY = 'trv_cg_market_data';
      const CACHE_TTL = 25000; // 25 seconds to be safe before 30s interval

      if (!force && typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              if (!mounted.current) return;
              
              setCoins(prev => {
                const prevMap = new Map(prev.map(c => [c.id, c.price]));
                return data.map((coin: any) => ({
                  id: coin.id,
                  symbol: (coin.symbol as string).toUpperCase(),
                  name: coin.name,
                  price: coin.current_price ?? 0,
                  prevPrice: prevMap.get(coin.id) ?? coin.current_price ?? 0,
                  chg24h: coin.price_change_percentage_24h ?? 0,
                  high24h: coin.high_24h ?? 0,
                  low24h: coin.low_24h ?? 0,
                  vol24h: coin.total_volume ?? 0,
                  marketCap: coin.market_cap ?? 0,
                  image: coin.image ?? '',
                }));
              });

              setIsConnected(true);
              setIsLoading(false);
              setError('');
              setLastUpdated(new Date(timestamp));
              return; // Skip API call
            }
          } catch (e) {
            // Ignore parse error
          }
        }
      }

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=${MAX_PAIRS}&page=1&sparkline=false&price_change_percentage=24h`,
        { signal: AbortSignal.timeout(15_000) }
      );
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
      const data: any[] = await res.json();

      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }

      if (!mounted.current) return;

      setCoins(prev => {
        const prevMap = new Map(prev.map(c => [c.id, c.price]));
        return data.map(coin => ({
          id: coin.id,
          symbol: (coin.symbol as string).toUpperCase(),
          name: coin.name,
          price: coin.current_price ?? 0,
          prevPrice: prevMap.get(coin.id) ?? coin.current_price ?? 0,
          chg24h: coin.price_change_percentage_24h ?? 0,
          high24h: coin.high_24h ?? 0,
          low24h: coin.low_24h ?? 0,
          vol24h: coin.total_volume ?? 0,
          marketCap: coin.market_cap ?? 0,
          image: coin.image ?? '',
        }));
      });

      setIsConnected(true);
      setIsLoading(false);
      setError('');
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!mounted.current) return;
      console.error('Market data fetch error:', err);
      setIsConnected(false);
      if (coins.length === 0) {
        setError('Gagal memuat data. Coba lagi...');
      }
      setIsLoading(false);
    }
  }, [coins.length]);

  // ── Auto-refresh every 30s ────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;
    fetchMarketData();

    timerRef.current = setInterval(() => fetchMarketData(true), 30_000);

    return () => {
      mounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchMarketData]);

  // ── Sort / filter ─────────────────────────────────────────────────────────
  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const toggleFavorite = (sym: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(sym) ? next.delete(sym) : next.add(sym);
      try { localStorage.setItem('trv_lm_favs', JSON.stringify([...next])); } catch { }
      return next;
    });
  };

  const filtered = [...coins]
    .filter(c => {
      if (showFavsOnly && !favorites.has(c.symbol)) return false;
      if (search) {
        const q = search.toUpperCase();
        return c.symbol.includes(q) || c.name.toUpperCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let d = 0;
      if (sortBy === 'vol')   d = b.vol24h  - a.vol24h;
      if (sortBy === 'chg')   d = b.chg24h  - a.chg24h;
      if (sortBy === 'price') d = b.price   - a.price;
      if (sortBy === 'sym')   d = a.symbol.localeCompare(b.symbol);
      return sortDir === 'desc' ? d : -d;
    });

  const SortHeader = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className={clsx(
        'text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1',
        sortBy === col ? 'text-neon' : 'text-slate-400 hover:text-slate-300',
      )}
    >
      {label}
      {sortBy === col && <span className="text-[8px]">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-none px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 flex-wrap">

          {/* Title + status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Top {MAX_PAIRS} Market
            </span>
            <span className={clsx(
              'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
              isConnected
                ? 'bg-emerald-500/10 text-emerald-500'
                : isLoading
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-rose-500/10 text-rose-500',
            )}>
              {isConnected ? (
                <><Wifi size={9} /> LIVE</>
              ) : isLoading ? (
                <><Loader2 size={9} className="animate-spin" /> Loading</>
              ) : (
                <><WifiOff size={9} /> Offline</>
              )}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchMarketData(true)}
              title="Refresh data"
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-neon"
            >
              <RefreshCw size={11} />
            </button>
            <button
              onClick={() => setShowFavsOnly(f => !f)}
              title="Tampilkan Favorit"
              className={clsx(
                'text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all',
                showFavsOnly
                  ? 'bg-amber-400/20 text-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500',
              )}
            >★</button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-2 relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari koin... BTC, ETH, SOL"
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon/50 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* ── Table Header ── */}
      <div className="flex-none grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
        <div className="w-5" />
        <SortHeader col="sym"   label="Pair"  />
        <div className="hidden sm:block"><SortHeader col="price" label="Harga" /></div>
        <SortHeader col="chg"   label="24h%"  />
        <div className="hidden md:block"><SortHeader col="vol" label="Vol" /></div>
        <div className="w-3" />
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs">Memuat Top {MAX_PAIRS} market…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-xs text-rose-400">{error}</span>
            <button
              onClick={() => { setIsLoading(true); setError(''); fetchMarketData(); }}
              className="text-xs text-neon hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-400">
            {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada data'}
          </div>
        ) : (
          filtered.map(coin => {
            const isUp  = coin.chg24h >= 0;
            const isFav = favorites.has(coin.symbol);
            const priceFlash = coin.price > coin.prevPrice ? 'up' : coin.price < coin.prevPrice ? 'dn' : null;

            return (
              <div
                key={coin.id}
                onClick={() => onSelectSymbol?.(coin.symbol + 'USDT')}
                className={clsx(
                  'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2.5',
                  'border-b border-slate-50 dark:border-slate-800/50',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group',
                )}
              >
                {/* ★ Fav */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(coin.symbol); }}
                  className={clsx(
                    'w-5 text-center text-xs transition-colors',
                    isFav ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700 group-hover:text-slate-400',
                  )}
                >★</button>

                {/* Pair name */}
                <div className="flex items-center gap-2 min-w-0">
                  {coin.image && (
                    <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" loading="lazy" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{coin.symbol}</div>
                    <div className="text-[9px] text-slate-400 leading-none mt-0.5 truncate max-w-[80px]">{coin.name}</div>
                  </div>
                </div>

                {/* Price */}
                <div className={clsx(
                  'hidden sm:block text-xs font-mono font-semibold tabular-nums text-right transition-colors',
                  'text-slate-700 dark:text-slate-300',
                )}>
                  {fmtPrice(coin.price)}
                </div>

                {/* 24h % */}
                <div className={clsx(
                  'text-xs font-bold text-right tabular-nums flex items-center justify-end gap-0.5',
                  isUp ? 'text-emerald-500' : 'text-rose-500',
                )}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{coin.chg24h.toFixed(2)}%
                </div>

                {/* Volume */}
                <div className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 text-right tabular-nums font-mono">
                  {fmtVol(coin.vol24h)}
                </div>

                {/* Arrow */}
                <div className="text-slate-300 dark:text-slate-700 group-hover:text-neon text-xs transition-colors">›</div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-none px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Menampilkan {filtered.length} dari {coins.length} pair teratas
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
          {isConnected
            ? `Live Data · Updated ${lastUpdated?.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) ?? ''}`
            : 'Reconnecting…'
          }
        </span>
      </div>
    </div>
  );
}
