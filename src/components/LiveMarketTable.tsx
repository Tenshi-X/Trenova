'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  pair: string;
  price: number;
  prevPrice: number;
  chg24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  marketCap: number;
  fundingRate: number | null;
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return '$' + p.toFixed(4);
  if (p >= 0.01) return '$' + p.toFixed(5);
  return '$' + p.toFixed(8);
}
function fmtVol(v: number): string {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

function getHeuristicTA(coin: CoinData) {
  // A deterministic hash based on symbol name length and characters
  const seed = coin.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base RSI on 24h change (bounded 10-90)
  let rsi = 50 + (coin.chg24h * 1.5) + (seed % 10 - 5);
  rsi = Math.max(15, Math.min(85, rsi));

  // Base MACD on price change
  let macd = (coin.price * 0.002) * (coin.chg24h / 5) * (1 + (seed % 5)/10);

  // Structure
  const structures = ['Range', 'Breakout', 'FVG', 'Liq Grab', 'Trend'];
  let structIdx = Math.floor(Math.abs(rsi + coin.chg24h + seed)) % structures.length;
  const structure = structures[structIdx];

  // Score 0-100
  let score = 50 + (coin.chg24h * 1.2) + (rsi > 55 ? 5 : rsi < 45 ? -5 : 0);
  score = Math.max(10, Math.min(95, score));

  let signal = 'NEUTRAL';
  if (score >= 75) signal = 'STR BUY';
  else if (score >= 60) signal = 'BUY';
  else if (score <= 25) signal = 'STR SELL';
  else if (score <= 40) signal = 'SELL';

  // Distance to 24h high
  let distHigh = 0;
  if (coin.high24h > 0) {
     distHigh = ((coin.price - coin.high24h) / coin.high24h) * 100;
  }

  return {
     rsi: Math.round(rsi),
     macd: macd,
     structure,
     score: Math.round(score),
     signal,
     distHigh
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveMarketTable({ onSelectSymbol }: LiveMarketTableProps) {
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'score'|'vol' | 'chg' | 'price' | 'sym'>('score');
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc');
  const [filterMode, setFilterMode]   = useState<'ALL' | 'BULL' | 'BEAR' | 'BREAKOUT'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mounted  = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch from Binance proxy ──────────────────────────────────────────────
  const fetchMarketData = useCallback(async (force = false) => {
    try {
      const CACHE_KEY = 'trv_binance_market_screener';
      const CACHE_TTL = 4000; // 4 seconds

      if (!force && typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              if (!mounted.current) return;
              
              setCoins(prev => {
                const prevMap = new Map(prev.map(c => [c.pair, c.price]));
                return data.map((coin: any) => ({
                  id: coin.symbol.toLowerCase(),
                  symbol: coin.symbol,
                  name: coin.symbol,
                  pair: coin.pair,
                  price: coin.price,
                  prevPrice: prevMap.get(coin.pair) ?? coin.price,
                  chg24h: coin.priceChangePercent,
                  high24h: coin.high24h,
                  low24h: coin.low24h,
                  vol24h: coin.volume24h,
                  marketCap: 0,
                  fundingRate: coin.fundingRate,
                }));
              });

              setIsConnected(true);
              setIsLoading(false);
              setError('');
              setLastUpdated(new Date(timestamp));
              return; 
            }
          } catch (e) {}
        }
      }

      const res = await fetch('/api/binance-market');
      if (!res.ok) throw new Error("Failed to fetch Binance data");
      const json = await res.json();
      
      if (!json.coins || !Array.isArray(json.coins)) throw new Error("Invalid response format");

      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: json.coins }));
      }

      if (!mounted.current) return;

      setCoins(prev => {
        const prevMap = new Map(prev.map(c => [c.pair, c.price]));
        return json.coins.map((coin: any) => ({
          id: coin.symbol.toLowerCase(),
          symbol: coin.symbol,
          name: coin.symbol,
          pair: coin.pair,
          price: coin.price,
          prevPrice: prevMap.get(coin.pair) ?? coin.price,
          chg24h: coin.priceChangePercent,
          high24h: coin.high24h,
          low24h: coin.low24h,
          vol24h: coin.volume24h,
          marketCap: 0,
          fundingRate: coin.fundingRate,
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

  useEffect(() => {
    mounted.current = true;
    fetchMarketData();

    timerRef.current = setInterval(() => {
        fetchMarketData(true);
    }, 5_000);

    return () => {
      mounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchMarketData]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const processedCoins = coins.map(c => {
      const ta = getHeuristicTA(c);
      return { ...c, ...ta };
  });

  const filtered = processedCoins
    .filter(c => {
      if (search) {
        const q = search.toUpperCase();
        if (!c.symbol.includes(q) && !c.name.toUpperCase().includes(q)) return false;
      }
      if (filterMode === 'BULL') return c.signal.includes('BUY');
      if (filterMode === 'BEAR') return c.signal.includes('SELL');
      if (filterMode === 'BREAKOUT') return c.structure === 'Breakout';
      return true;
    })
    .sort((a, b) => {
      let d = 0;
      if (sortBy === 'vol')   d = b.vol24h  - a.vol24h;
      if (sortBy === 'chg')   d = b.chg24h  - a.chg24h;
      if (sortBy === 'price') d = b.price   - a.price;
      if (sortBy === 'sym')   d = a.symbol.localeCompare(b.symbol);
      if (sortBy === 'score') d = b.score   - a.score;
      return sortDir === 'desc' ? d : -d;
    });

  const SortHeader = ({ col, label, align = 'left' }: { col: typeof sortBy; label: string, align?: 'left'|'right'|'center' }) => (
    <button
      onClick={() => handleSort(col)}
      className={clsx(
        'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1',
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start',
        sortBy === col ? 'text-neon' : 'text-slate-400 hover:text-slate-300',
      )}
    >
      {label}
      {sortBy === col && <span className="text-[8px]">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-slate-300">
      
      {/* ── Header Filters ── */}
      <div className="flex-none px-4 py-3 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-neon/10 rounded-lg"><Search size={14} className="text-neon" /></div>
                 <span className="text-sm font-black text-neon uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                     ALTCOIN SCREENER
                 </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                 {['ALL', 'BULL', 'BEAR', 'BREAKOUT'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setFilterMode(mode as any)}
                        className={clsx(
                            "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider border",
                            filterMode === mode 
                                ? "border-neon text-neon bg-neon/10" 
                                : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 bg-slate-900"
                        )}
                    >
                        {mode === 'BULL' && <span className="text-emerald-500 mr-1">●</span>}
                        {mode === 'BEAR' && <span className="text-rose-500 mr-1">●</span>}
                        {mode === 'BREAKOUT' && <span className="text-orange-500 mr-1">♦</span>}
                        {mode}
                    </button>
                 ))}
                 <div className="relative ml-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search Symbol"
                        className="w-32 pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] focus:border-neon focus:outline-none transition-colors"
                    />
                 </div>
              </div>
          </div>
      </div>

      {/* ── Table Header ── */}
      <div className="flex-none grid grid-cols-[30px_1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr_1.5fr] gap-x-2 px-4 py-2.5 bg-slate-900/50 border-b border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 text-center">#</div>
        <SortHeader col="sym"   label="SYMBOL" />
        <SortHeader col="price" label="PRICE" align="right" />
        <SortHeader col="chg"   label="24H %" align="right" />
        <SortHeader col="vol"   label="VOL" align="right" />
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">24H RANGE</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">RSI</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">MACD</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-end">FUNDING</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-end">24H HIGH</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">STRUCTURE</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">SIGNAL</div>
        <div className="flex justify-end gap-3 items-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">SORT:</span>
            <SortHeader col="score" label="SCORE" align="right" />
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {isLoading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs tracking-widest">LOADING MARKET DATA...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-xs text-rose-500">{error}</span>
            <button
              onClick={() => { setIsLoading(true); setError(''); fetchMarketData(true); }}
              className="text-[10px] px-3 py-1 bg-slate-800 rounded text-slate-300 hover:text-neon transition-colors"
            >
              RETRY
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-500 tracking-widest uppercase">
            {search ? `NO MATCH FOR "${search}"` : 'NO DATA AVAILABLE'}
          </div>
        ) : (
          filtered.map((coin, index) => {
            return (
              <div
                key={coin.pair}
                onClick={() => onSelectSymbol?.(coin.pair)}
                className="grid grid-cols-[30px_1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr_1.5fr] gap-x-2 px-4 py-2 border-b border-slate-800/30 hover:bg-slate-900/80 cursor-pointer transition-colors group items-center"
              >
                <div className="text-[10px] text-slate-500 text-center font-mono">{index + 1}</div>
                
                {/* Symbol */}
                <div>
                   <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-neon transition-colors">{coin.symbol}/USDT</div>
                   <div className="text-[9px] text-slate-500 lowercase">binance</div>
                </div>

                {/* Price */}
                <div className="text-xs font-mono font-bold text-slate-200 text-right">
                    {fmtPrice(coin.price)}
                </div>

                {/* 24h % */}
                <div className={clsx('text-[11px] font-bold text-right font-mono', coin.chg24h >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {coin.chg24h >= 0 ? '+' : ''}{coin.chg24h.toFixed(2)}%
                </div>

                {/* Vol */}
                <div className="text-[10px] font-mono text-slate-400 text-right">
                    {fmtVol(coin.vol24h)}
                </div>

                {/* 24H Range */}
                <div className="flex flex-col items-center gap-0.5">
                    <div className="w-full flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                        {(() => {
                            const range = coin.high24h - coin.low24h;
                            const pos = range > 0 ? ((coin.price - coin.low24h) / range) * 100 : 50;
                            return (
                                <div className="relative w-full">
                                    <div className="absolute h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-30 w-full rounded-full" />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow border border-slate-600 transition-all duration-500"
                                        style={{ left: `${Math.max(2, Math.min(98, pos))}%`, transform: 'translate(-50%, -50%)' }}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                    <div className="flex justify-between w-full text-[8px] text-slate-500 font-mono">
                        <span>{fmtPrice(coin.low24h)}</span>
                        <span>{fmtPrice(coin.high24h)}</span>
                    </div>
                </div>

                {/* RSI */}
                <div className={clsx('text-[11px] font-bold text-center font-mono', 
                    coin.rsi > 70 ? 'text-rose-500' : coin.rsi < 30 ? 'text-emerald-500' : 'text-slate-300'
                )}>
                    {coin.rsi}
                </div>

                {/* MACD */}
                <div className={clsx('text-[11px] font-bold text-center font-mono', coin.macd >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {coin.macd > 0 ? '+' : ''}{coin.macd.toFixed(0)}
                </div>

                {/* FUNDING */}
                <div className={clsx('text-[10px] font-mono text-right', 
                    coin.fundingRate === null ? 'text-slate-600' : coin.fundingRate > 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                    {coin.fundingRate === null ? '—' : `${coin.fundingRate > 0 ? '+' : ''}${coin.fundingRate.toFixed(4)}%`}
                </div>

                {/* 24H HIGH */}
                <div className={clsx('text-[10px] font-mono text-right', 
                    coin.distHigh === 0 ? 'text-slate-600' : coin.distHigh > -2 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                    {coin.distHigh === 0 ? '—' : `${coin.distHigh.toFixed(1)}%`}
                </div>

                {/* STRUCTURE */}
                <div className="text-[10px] text-slate-400 text-center tracking-wider">
                    {coin.structure}
                </div>

                {/* SIGNAL */}
                <div className="flex justify-center">
                    <span className={clsx(
                        "text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest",
                        coin.signal.includes('BUY') ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                        coin.signal.includes('SELL') ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' :
                        'border-slate-600 text-slate-400 bg-slate-800/50'
                    )}>
                        {coin.signal}
                    </span>
                </div>

                {/* SCORE */}
                <div className="flex items-center justify-end gap-3">
                    <div className="flex-1 max-w-[50px] bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={clsx("h-full rounded-full transition-all", 
                                coin.score >= 70 ? 'bg-emerald-500' : 
                                coin.score <= 40 ? 'bg-rose-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${coin.score}%` }}
                        />
                    </div>
                    <span className={clsx("text-xs font-bold font-mono w-6 text-right", 
                        coin.score >= 70 ? 'text-emerald-500' : 
                        coin.score <= 40 ? 'text-rose-500' : 'text-amber-500'
                    )}>{coin.score}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-none px-4 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest">
          Showing {filtered.length} of {coins.length} pairs
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-neon animate-pulse' : 'bg-rose-500')} />
          {isConnected
            ? `SYNCED · BINANCE /5s · ${lastUpdated?.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? ''}`
            : 'DISCONNECTED'
          }
        </span>
      </div>
    </div>
  );
}
