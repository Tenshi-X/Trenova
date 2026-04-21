'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Star, TrendingUp, TrendingDown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoinData {
  symbol: string;
  price: number;
  prevPrice: number;
  chg24h: number;
  high24h: number;
  low24h: number;
  vol24h: number; // quoteVolume in USDT
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const QUOTE_ASSETS = ['USDT', 'USDC', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB'];
const MAX_PAIRS = 50;

function getBase(sym: string) {
  for (const q of QUOTE_ASSETS) if (sym.endsWith(q)) return sym.slice(0, -q.length);
  return sym;
}
function getQuote(sym: string) {
  for (const q of QUOTE_ASSETS) if (sym.endsWith(q)) return q;
  return '';
}
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
  // Use a plain object map for O(1) updates without growing history arrays
  const [coins, setCoins]           = useState<Map<string, CoinData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [quoteFilter, setQuoteFilter] = useState<'USDT' | 'BTC'>('USDT');
  const [sortBy, setSortBy]         = useState<'vol' | 'chg' | 'price' | 'sym'>('vol');
  const [sortDir, setSortDir]       = useState<'desc' | 'asc'>('desc');
  const [favorites, setFavorites]   = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage?.getItem('trv_lm_favs') || '[]')); }
    catch { return new Set(); }
  });
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  // Flash colours — kept as a ref so we don't cause re-renders from within WS handler
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'dn'>>(new Map());
  const pendingFlash = useRef<Map<string, 'up' | 'dn'>>(new Map());

  const wsRef    = useRef<WebSocket | null>(null);
  const pairsRef = useRef<string[]>([]);
  const mounted  = useRef(true);

  // ── Step 1: Fetch top-N pairs by quoteVolume (ONE REST call) ─────────────
  const fetchTopPairs = useCallback(async (quote: string): Promise<string[]> => {
    try {
      // Full ticker includes priceChangePercent — no MINI here
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error('REST failed');
      const raw: any[] = await res.json();

      // Filter by quote asset, sort by quoteVolume desc, take top N
      const top = raw
        .filter(t => t.symbol.endsWith(quote))
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, MAX_PAIRS);

      // Seed initial state so table shows immediately
      const initial = new Map<string, CoinData>();
      for (const t of top) {
        initial.set(t.symbol, {
          symbol:    t.symbol,
          price:     parseFloat(t.lastPrice),
          prevPrice: parseFloat(t.lastPrice),
          chg24h:    parseFloat(t.priceChangePercent),  // ← no more NaN
          high24h:   parseFloat(t.highPrice),
          low24h:    parseFloat(t.lowPrice),
          vol24h:    parseFloat(t.quoteVolume),
        });
      }
      if (mounted.current) {
        setCoins(initial);
        setIsLoading(false);
      }

      return top.map(t => t.symbol as string);
    } catch {
      // Hardcoded fallback so the UI is never empty
      const fallback = [
        'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
        'DOGEUSDT','ADAUSDT','AVAXUSDT','TRXUSDT','BCHUSDT',
        'DOTUSDT','LINKUSDT','LTCUSDT','ATOMUSDT','UNIUSDT',
        'XLMUSDT','NEARUSDT','AAVEUSDT','FTMUSDT','INJUSDT',
      ];
      if (mounted.current) setIsLoading(false);
      return fallback;
    }
  }, []);

  // ── Step 2: Open a single WebSocket for those N pairs ────────────────────
  //   Each message OVERWRITES the coin entry — NO history array growing
  const openWS = useCallback((pairs: string[]) => {
    // Close any existing socket first
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent auto-reconnect race
      wsRef.current.close();
      wsRef.current = null;
    }

    const streams = pairs
      .map(p => p.toLowerCase() + '@ticker')
      .join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mounted.current) setIsConnected(true);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d   = msg.data;
        if (!d?.s) return;

        const np = parseFloat(d.c);          // current price
        const chg = parseFloat(d.P);         // 24h % — full ticker always has this
        const high = parseFloat(d.h);
        const low  = parseFloat(d.l);
        const vol  = parseFloat(d.q);        // quoteVolume in USDT

        // OVERWRITE: create a new Map with all previous entries, replacing just this one
        setCoins(prev => {
          const pp = prev.get(d.s)?.price ?? np;
          const next = new Map(prev);         // shallow copy — O(N) but only 50 entries
          next.set(d.s, {
            symbol:    d.s,
            price:     np,
            prevPrice: pp,
            chg24h:    chg,
            high24h:   high,
            low24h:    low,
            vol24h:    vol,
          });
          return next;
        });

        // Queue flash without causing an extra re-render inside WS handler
        const pp0 = 0; // handled in setCoins above; just use direction from ws data
        if (np !== 0) {
          pendingFlash.current.set(d.s, parseFloat(d.p) >= 0 ? 'up' : 'dn');
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onerror = () => {
      if (mounted.current) setIsConnected(false);
    };

    ws.onclose = () => {
      if (!mounted.current) return;
      setIsConnected(false);
      // Reconnect after 3 s
      setTimeout(() => {
        if (mounted.current && pairsRef.current.length > 0) {
          openWS(pairsRef.current);
        }
      }, 3000);
    };
  }, []);

  // ── Initialise / reinitialise on quote filter change ─────────────────────
  useEffect(() => {
    mounted.current = true;
    setIsLoading(true);
    setError('');
    setCoins(new Map());
    setIsConnected(false);

    fetchTopPairs(quoteFilter).then(pairs => {
      if (!mounted.current) return;
      pairsRef.current = pairs;
      openWS(pairs);
    });

    // Flush pending flash colours every 120 ms (independent of WS frequency)
    const flashInterval = setInterval(() => {
      if (!mounted.current || pendingFlash.current.size === 0) return;
      setFlashMap(new Map(pendingFlash.current));
      pendingFlash.current.clear();
      setTimeout(() => { if (mounted.current) setFlashMap(new Map()); }, 350);
    }, 120);

    return () => {
      mounted.current = false;
      clearInterval(flashInterval);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [quoteFilter, fetchTopPairs, openWS]);

  // ── Sort / filter (derived — no extra state) ──────────────────────────────
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

  const filtered = [...coins.values()]
    .filter(c => {
      if (showFavsOnly && !favorites.has(c.symbol)) return false;
      if (search) return c.symbol.includes(search.toUpperCase());
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
                <><Loader2 size={9} className="animate-spin" /> Connecting</>
              ) : (
                <><WifiOff size={9} /> Offline</>
              )}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1">
            {(['USDT', 'BTC'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuoteFilter(q)}
                className={clsx(
                  'text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all',
                  quoteFilter === q
                    ? 'bg-neon text-white dark:text-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >{q}</button>
            ))}
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
        {isLoading && coins.size === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs">Memuat Top {MAX_PAIRS} market…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-xs text-rose-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-400">
            {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada data'}
          </div>
        ) : (
          filtered.map(coin => {
            const base  = getBase(coin.symbol);
            const quote = getQuote(coin.symbol);
            const isUp  = coin.chg24h >= 0;
            const isFav = favorites.has(coin.symbol);
            const flash = flashMap.get(coin.symbol);

            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectSymbol?.(coin.symbol)}
                className={clsx(
                  'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2.5',
                  'border-b border-slate-50 dark:border-slate-800/50',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group',
                  flash === 'up' && 'bg-emerald-50 dark:bg-emerald-950/20',
                  flash === 'dn' && 'bg-rose-50 dark:bg-rose-950/20',
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
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{base}</div>
                    <div className="text-[9px] text-slate-400 leading-none mt-0.5">{quote}</div>
                  </div>
                </div>

                {/* Price */}
                <div className={clsx(
                  'hidden sm:block text-xs font-mono font-semibold tabular-nums text-right transition-colors',
                  flash === 'up' ? 'text-emerald-500'
                    : flash === 'dn' ? 'text-rose-500'
                      : 'text-slate-700 dark:text-slate-300',
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
          Menampilkan {filtered.length} dari {coins.size} pair teratas
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
          {isConnected ? 'Binance WebSocket · Real-time' : 'Reconnecting…'}
        </span>
      </div>
    </div>
  );
}
