'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Star, TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import clsx from 'clsx';

interface CoinData {
  symbol: string;
  price: number;
  chg24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

const QUOTE_ASSETS = ['USDT', 'USDC', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB'];
const POLL_INTERVAL = 30_000; // 30 seconds
const MAX_PAIRS = 50;

function getBase(sym: string) {
  for (const q of QUOTE_ASSETS) {
    if (sym.endsWith(q)) return sym.slice(0, sym.length - q.length);
  }
  return sym;
}
function getQuote(sym: string) {
  for (const q of QUOTE_ASSETS) {
    if (sym.endsWith(q)) return q;
  }
  return '';
}

function fmtPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return '$' + p.toFixed(4);
  if (p >= 0.01) return '$' + p.toFixed(5);
  return '$' + p.toFixed(8);
}

function fmtVol(v: number): string {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

function formatCountdown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return s > 0 ? `${s}s` : 'now';
}

export default function LiveMarketTable({ onSelectSymbol }: LiveMarketTableProps) {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [quoteFilter, setQuoteFilter] = useState<'USDT' | 'BTC'>('USDT');
  const [sortBy, setSortBy] = useState<'vol' | 'chg' | 'price' | 'sym'>('vol');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage?.getItem('trv_lm_favs') || '[]'));
    } catch { return new Set(); }
  });
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  const nextPollRef = useRef<number>(Date.now() + POLL_INTERVAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Fetch top 50 pairs from Binance 24hr ticker (single REST call, no WebSocket)
  const fetchMarket = useCallback(async (quote: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?type=MINI`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!res.ok) throw new Error('Gagal memuat data market');
      const raw: any[] = await res.json();

      // Filter by quote, sort by quoteVolume desc, take top MAX_PAIRS
      const filtered = raw
        .filter((t) => t.symbol.endsWith(quote))
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, MAX_PAIRS)
        .map((t): CoinData => ({
          symbol: t.symbol,
          price: parseFloat(t.lastPrice),
          chg24h: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          vol24h: parseFloat(t.quoteVolume),
        }));

      if (mountedRef.current) {
        setCoins(filtered);
        setLastUpdated(new Date());
        setError('');
      }
    } catch (e: any) {
      if (mountedRef.current) setError('Gagal memuat data. Coba lagi nanti.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const scheduleNext = useCallback((quote: string) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    nextPollRef.current = Date.now() + POLL_INTERVAL;
    pollTimerRef.current = setTimeout(async () => {
      await fetchMarket(quote);
      scheduleNext(quote);
    }, POLL_INTERVAL);
  }, [fetchMarket]);

  // On quote filter change: fetch immediately + schedule polling
  useEffect(() => {
    mountedRef.current = true;
    setCoins([]);
    setIsLoading(true);

    fetchMarket(quoteFilter).then(() => {
      if (mountedRef.current) scheduleNext(quoteFilter);
    });

    // Countdown tick
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      const remaining = nextPollRef.current - Date.now();
      setCountdown(Math.max(0, remaining));
    }, 1000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [quoteFilter, fetchMarket, scheduleNext]);

  const handleManualRefresh = () => {
    if (isLoading) return;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    fetchMarket(quoteFilter).then(() => {
      if (mountedRef.current) scheduleNext(quoteFilter);
    });
  };

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const toggleFavorite = (sym: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      try { localStorage.setItem('trv_lm_favs', JSON.stringify([...next])); } catch (e) {}
      return next;
    });
  };

  // Filter + sort
  const filtered = [...coins]
    .filter(c => {
      if (showFavsOnly && !favorites.has(c.symbol)) return false;
      if (search) return c.symbol.includes(search.toUpperCase());
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'vol') diff = b.vol24h - a.vol24h;
      else if (sortBy === 'chg') diff = b.chg24h - a.chg24h;
      else if (sortBy === 'price') diff = b.price - a.price;
      else if (sortBy === 'sym') diff = a.symbol.localeCompare(b.symbol);
      return sortDir === 'desc' ? diff : -diff;
    });

  const SortHeader = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className={clsx(
        'text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1',
        sortBy === col ? 'text-neon' : 'text-slate-400 hover:text-slate-300'
      )}
    >
      {label}
      {sortBy === col && <span className="text-[8px]">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Top {MAX_PAIRS} Market
            </span>
            {/* Status badge */}
            <span className={clsx(
              'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
              isLoading
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500'
            )}>
              {isLoading ? (
                <><RefreshCw size={9} className="animate-spin" /> Memuat</>
              ) : (
                <><Clock size={9} /> Refresh {formatCountdown(countdown)}</>
              )}
            </span>
            {lastUpdated && !isLoading && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Quote Filter */}
            {(['USDT', 'BTC'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuoteFilter(q)}
                className={clsx(
                  'text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all',
                  quoteFilter === q
                    ? 'bg-neon text-white dark:text-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => setShowFavsOnly(f => !f)}
              className={clsx(
                'text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all',
                showFavsOnly
                  ? 'bg-amber-400/20 text-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500'
              )}
              title="Tampilkan Favorit"
            >
              ★
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-neon transition-all disabled:opacity-40"
              title="Refresh sekarang"
            >
              <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
            </button>
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

      {/* Table Header */}
      <div className="flex-none grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
        <div className="w-5" />
        <SortHeader col="sym" label="Pair" />
        <div className="hidden sm:block"><SortHeader col="price" label="Harga" /></div>
        <SortHeader col="chg" label="24h%" />
        <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400">Vol</div>
        <div className="w-4" />
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
            <RefreshCw className="animate-spin text-neon" size={24} />
            <span className="text-xs">Memuat Top {MAX_PAIRS} market...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-xs text-rose-400">{error}</span>
            <button onClick={handleManualRefresh} className="text-xs text-neon underline">Coba lagi</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-400">
            {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada data'}
          </div>
        ) : (
          filtered.map(coin => {
            const base = getBase(coin.symbol);
            const quote = getQuote(coin.symbol);
            const isUp = coin.chg24h >= 0;
            const isFav = favorites.has(coin.symbol);

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectSymbol?.(coin.symbol)}
                className={clsx(
                  'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2.5 border-b border-slate-50 dark:border-slate-800/50',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group',
                )}
              >
                {/* Fav */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(coin.symbol); }}
                  className={clsx(
                    'w-5 text-center text-xs transition-colors',
                    isFav ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700 group-hover:text-slate-400'
                  )}
                >
                  ★
                </button>

                {/* Pair */}
                <div className="flex items-center gap-2 min-w-0">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{base}</div>
                    <div className="text-[9px] text-slate-400 leading-none mt-0.5">{quote}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="hidden sm:block text-xs font-mono font-semibold tabular-nums text-right text-slate-700 dark:text-slate-300">
                  {fmtPrice(coin.price)}
                </div>

                {/* 24h Change */}
                <div className={clsx(
                  'text-xs font-bold text-right tabular-nums flex items-center gap-0.5',
                  isUp ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{coin.chg24h.toFixed(2)}%
                </div>

                {/* Volume */}
                <div className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 text-right tabular-nums font-mono">
                  {fmtVol(coin.vol24h)}
                </div>

                {/* Arrow */}
                <div className="text-slate-300 dark:text-slate-700 group-hover:text-neon transition-colors text-xs">›</div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-none px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Menampilkan {filtered.length} dari {coins.length} pair teratas
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock size={9} />
          Auto-refresh setiap 30 detik · Binance REST
        </span>
      </div>
    </div>
  );
}
