'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Star, TrendingUp, TrendingDown, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface CoinData {
  symbol: string;
  price: number;
  prevPrice: number;
  chg24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  priceDir: 'up' | 'dn' | '';
  history: number[];
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

const QUOTE_ASSETS = ['USDT', 'USDC', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB'];

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

// Simple sparkline SVG
function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
  if (data.length < 2) return <div className="w-16 h-6" />;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const W = 64, H = 24, pd = 2;
  const pts = data
    .map((v, i) => {
      const x = pd + (i / (data.length - 1)) * (W - pd * 2);
      const y = H - pd - ((v - mn) / rng) * (H - pd * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={isUp ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LiveMarketTable({ onSelectSymbol }: LiveMarketTableProps) {
  const [coins, setCoins] = useState<Map<string, CoinData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'dn'>>(new Map());
  const [pairCount, setPairCount] = useState(0);
  const [updatesPerSec, setUpdatesPerSec] = useState(0);

  const wsPoolRef = useRef<WebSocket[]>([]);
  const pendingRef = useRef<Map<string, 'up' | 'dn'>>(new Map());
  const updSecRef = useRef(0);
  const pairsRef = useRef<string[]>([]);

  // Fetch all pairs from Binance
  const fetchPairs = useCallback(async (quote: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      if (!res.ok) throw new Error('Failed to fetch exchange info');
      const json = await res.json();
      const pairs: string[] = json.symbols
        .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === quote)
        .map((s: any) => s.symbol as string);
      pairsRef.current = pairs;
      setPairCount(pairs.length);
      return pairs;
    } catch (e) {
      console.error('Exchange info fetch failed:', e);
      // Fallback top 20 USDT pairs
      const fallback = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','AVAXUSDT','TRXUSDT','BCHUSDT','DOTUSDT','LINKUSDT','LTCUSDT','ATOMUSDT','UNIUSDT','XLMUSDT','NEARUSDT','AAVEUSDT','FTMUSDT','INJUSDT'];
      pairsRef.current = fallback;
      setPairCount(fallback.length);
      return fallback;
    }
  }, []);

  // Connect WebSocket pool
  const connect = useCallback((pairs: string[]) => {
    // Close existing
    wsPoolRef.current.forEach(ws => { try { ws.close(); } catch (e) {} });
    wsPoolRef.current = [];

    const CHUNK = 180;
    const chunks: string[][] = [];
    for (let i = 0; i < pairs.length; i += CHUNK) {
      chunks.push(pairs.slice(i, i + CHUNK));
    }

    let connectedCount = 0;

    chunks.forEach(chunk => {
      const streams = chunk.map(p => p.toLowerCase() + '@ticker').join('/');
      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        connectedCount++;
        if (connectedCount === chunks.length) {
          setIsConnected(true);
          setIsLoading(false);
        }
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const d = msg.data;
          if (!d || !d.s) return;

          const sym = d.s;
          const np = parseFloat(d.c);
          const prevCoin = setCoins(prev => {
            const pp = prev.get(sym)?.price || np;
            const history = [...(prev.get(sym)?.history || [])];
            history.push(np);
            if (history.length > 24) history.shift();

            const next = new Map(prev);
            next.set(sym, {
              symbol: sym,
              price: np,
              prevPrice: pp,
              chg24h: parseFloat(d.P),
              high24h: parseFloat(d.h),
              low24h: parseFloat(d.l),
              vol24h: parseFloat(d.v) * np,
              priceDir: np > pp ? 'up' : np < pp ? 'dn' : '',
              history,
            });
            return next;
          });

          // Track flash
          const pp = 0; // we handle via state above
          if (np !== pp) {
            pendingRef.current.set(sym, np > pp ? 'up' : 'dn');
          }
          updSecRef.current++;
        } catch (e) {}
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        connectedCount = Math.max(0, connectedCount - 1);
        if (connectedCount === 0) {
          setIsConnected(false);
          // Reconnect after 3s
          setTimeout(() => {
            if (pairsRef.current.length > 0) connect(pairsRef.current);
          }, 3000);
        }
      };

      wsPoolRef.current.push(ws);
    });
  }, []);

  // Init
  useEffect(() => {
    let mounted = true;
    fetchPairs(quoteFilter).then(pairs => {
      if (mounted) connect(pairs);
    });

    // UPS counter
    const upsTimer = setInterval(() => {
      setUpdatesPerSec(updSecRef.current);
      updSecRef.current = 0;
    }, 1000);

    // Flash apply loop
    const flashTimer = setInterval(() => {
      if (pendingRef.current.size > 0) {
        setFlashMap(new Map(pendingRef.current));
        pendingRef.current.clear();
        setTimeout(() => setFlashMap(new Map()), 400);
      }
    }, 100);

    return () => {
      mounted = false;
      clearInterval(upsTimer);
      clearInterval(flashTimer);
      wsPoolRef.current.forEach(ws => { try { ws.close(); } catch (e) {} });
    };
  }, [quoteFilter, fetchPairs, connect]);

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
  const filtered = [...coins.values()]
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
              Live Market
            </span>
            {/* Connection Status */}
            <span className={clsx(
              'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
              isConnected
                ? 'bg-emerald-500/10 text-emerald-500'
                : isLoading
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-rose-500/10 text-rose-500'
            )}>
              {isConnected ? (
                <><Wifi size={10} /> LIVE</>
              ) : isLoading ? (
                <><Loader2 size={10} className="animate-spin" /> CONNECTING</>
              ) : (
                <><WifiOff size={10} /> OFFLINE</>
              )}
            </span>
            {isConnected && (
              <span className="text-[10px] text-slate-400 font-mono">
                {pairCount} pairs · {updatesPerSec}/s
              </span>
            )}
          </div>

          {/* Quote Filter */}
          <div className="flex items-center gap-1">
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
              title="Show Favorites"
            >
              ★
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
            placeholder="Search coin... BTC, ETH, SOL"
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon/50 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex-none grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-2 px-3 py-2 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
        <div className="w-5" />
        <SortHeader col="sym" label="Pair" />
        <div className="hidden sm:block"><SortHeader col="price" label="Price" /></div>
        <SortHeader col="chg" label="24h%" />
        <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400">High</div>
        <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400">Low</div>
        <SortHeader col="vol" label="Volume" />
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs">Connecting to Binance WebSocket...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-xs text-rose-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-400">
            {search ? `No results for "${search}"` : 'No data yet'}
          </div>
        ) : (
          filtered.map(coin => {
            const base = getBase(coin.symbol);
            const quote = getQuote(coin.symbol);
            const isUp = coin.chg24h >= 0;
            const isFav = favorites.has(coin.symbol);
            const flash = flashMap.get(coin.symbol);

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectSymbol?.(coin.symbol)}
                className={clsx(
                  'grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-x-2 px-3 py-2 border-b border-slate-50 dark:border-slate-800/50',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group',
                  flash === 'up' && 'bg-emerald-50 dark:bg-emerald-950/20',
                  flash === 'dn' && 'bg-rose-50 dark:bg-rose-950/20',
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
                  {/* Sparkline — hidden on mobile */}
                  <div className="hidden sm:block opacity-70">
                    <Sparkline data={coin.history} isUp={isUp} />
                  </div>
                </div>

                {/* Price */}
                <div className={clsx(
                  'hidden sm:block text-xs font-mono font-semibold tabular-nums text-right',
                  flash === 'up' ? 'text-emerald-500' : flash === 'dn' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
                )}>
                  {fmtPrice(coin.price)}
                </div>

                {/* 24h Change */}
                <div className={clsx(
                  'text-xs font-bold text-right tabular-nums',
                  isUp ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {isUp ? '+' : ''}{coin.chg24h.toFixed(2)}%
                </div>

                {/* High */}
                <div className="hidden md:block text-[10px] font-mono text-emerald-500 text-right tabular-nums">
                  {fmtPrice(coin.high24h)}
                </div>

                {/* Low */}
                <div className="hidden md:block text-[10px] font-mono text-rose-500 text-right tabular-nums">
                  {fmtPrice(coin.low24h)}
                </div>

                {/* Volume */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right tabular-nums font-mono">
                  {fmtVol(coin.vol24h)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-none px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Showing {filtered.length} / {coins.size} pairs
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
          Binance Real-time Feed
        </span>
      </div>
    </div>
  );
}
