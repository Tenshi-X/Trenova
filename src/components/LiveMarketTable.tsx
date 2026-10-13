'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';

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
  openInterestUsd: number | null;
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

type MarketSnapshot = {
  coins: Array<{ symbol: string; pair?: string; price: number; priceChangePercent: number;
    high24h: number; low24h: number; volume24h: number; fundingRate: number | null;
    openInterestUsd?: number | null; marketCap?: number }>;
  source?: string;
  timestamp?: number;
};

// Column layout shared by the header and every row (15 columns).
const ROW_GRID = 'grid-cols-[30px_1.5fr_1fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr_1fr_1.5fr]';
const TABLE_MIN_W = 'min-w-[1300px]';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return '$' + p.toFixed(4);
  if (p >= 0.01) return '$' + p.toFixed(5);
  return '$' + p.toFixed(8);
}
function fmtVol(v: number): string {
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
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
  const macd = (coin.price * 0.002) * (coin.chg24h / 5) * (1 + (seed % 5)/10);

  // Structure
  const structures = ['Range', 'Breakout', 'FVG', 'Liq Grab', 'Trend'];
  const structIdx = Math.floor(Math.abs(rsi + coin.chg24h + seed)) % structures.length;
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
  const { t, language } = useLanguage();
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'score'|'vol' | 'chg' | 'price' | 'sym' | 'mcap' | 'oi' | 'fund'>('score');
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc');
  const [filterMode, setFilterMode]   = useState<'ALL' | 'BULL' | 'BEAR' | 'BREAKOUT'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [source, setSource] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/binance-market', { signal: controller.signal });
      if (!res.ok) throw new Error('Market unavailable');
      const json: MarketSnapshot = await res.json();
      if (!Array.isArray(json.coins) || !json.coins.length) throw new Error('Invalid market snapshot');
      if (controller.signal.aborted) return;

      setCoins(prev => {
        const prevMap = new Map(prev.map(c => [c.symbol, c.price]));
        return json.coins.map(coin => ({
          id: coin.symbol.toLowerCase(),
          symbol: coin.symbol,
          name: coin.symbol,
          pair: coin.pair || `${coin.symbol}USDT`,
          price: coin.price,
          prevPrice: prevMap.get(coin.symbol) ?? coin.price,
          chg24h: coin.priceChangePercent,
          high24h: coin.high24h,
          low24h: coin.low24h,
          vol24h: coin.volume24h,
          marketCap: coin.marketCap ?? 0,
          fundingRate: coin.fundingRate ?? null,
          openInterestUsd: coin.openInterestUsd ?? null,
        }));
      });

      setIsConnected(true);
      setIsLoading(false);
      setError('');
      setSource(json.source ?? 'binance');
      setLastUpdated(new Date(json.timestamp ?? Date.now()));
    } catch {
      if (controller.signal.aborted) return;
      setIsConnected(false);
      setError('unavailable');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    void fetchMarketData();
    const timer = setInterval(() => void fetchMarketData(), 5_000);

    return () => {
      clearInterval(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [fetchMarketData]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir(col === 'sym' ? 'asc' : 'desc'); }
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
      if (sortBy === 'mcap' || sortBy === 'oi' || sortBy === 'fund') {
        const pick = (c: typeof a) => sortBy === 'mcap' ? (c.marketCap > 0 ? c.marketCap : null)
          : sortBy === 'oi' ? c.openInterestUsd : c.fundingRate;
        const av = pick(a);
        const bv = pick(b);
        if (av === null && bv === null) return 0;
        if (av === null) return 1; // missing data always sorts last
        if (bv === null) return -1;
        return sortDir === 'desc' ? bv - av : av - bv;
      }
      let d = 0;
      if (sortBy === 'vol')   d = b.vol24h  - a.vol24h;
      if (sortBy === 'chg')   d = b.chg24h  - a.chg24h;
      if (sortBy === 'price') d = b.price   - a.price;
      if (sortBy === 'sym')   d = b.symbol.localeCompare(a.symbol);
      if (sortBy === 'score') d = b.score   - a.score;
      return sortDir === 'desc' ? d : -d;
    });

  const sortHeader = (col: typeof sortBy, label: string, align: 'left'|'right'|'center' = 'left', title?: string) => (
    <button
      title={title}
      onClick={() => handleSort(col)}
      type="button"
      aria-label={`${label}: ${sortBy === col ? sortDir : 'sort'}`}
      className={clsx(
        'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-teal-400',
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start',
        sortBy === col ? 'text-neon' : 'text-slate-400 hover:text-slate-300',
      )}
    >
      {label}
      {sortBy === col && <span className="text-[8px]">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-slate-300 [--color-neon:#2dd4bf]">

      {/* ── Header Filters ── */}
      <div className="flex-none px-4 py-3 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-neon/10 rounded-lg"><Search size={14} className="text-neon" /></div>
                 <span className="text-sm font-black text-neon uppercase tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                     ALTCOIN SCREENER
                 </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pb-1">
                 {['ALL', 'BULL', 'BEAR', 'BREAKOUT'].map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={filterMode === mode}
                        onClick={() => setFilterMode(mode as typeof filterMode)}
                        className={clsx(
                            "px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all tracking-wider border cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-teal-400",
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
                        aria-label={t('market_search_ph')}
                        placeholder={t('market_search_ph')}
                        className="w-32 pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] focus:border-neon focus:outline-none transition-colors"
                    />
                 </div>
                 <button type="button" onClick={() => void fetchMarketData()} disabled={isRefreshing}
                   aria-label={language === 'id' ? 'Perbarui pasar' : 'Refresh market'}
                   className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-neon cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-teal-400 disabled:opacity-50 disabled:cursor-wait">
                   <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                 </button>
              </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {language === 'id' ? 'RSI, MACD, struktur, sinyal, dan skor adalah estimasi screener dari perubahan 24 jam.' : 'RSI, MACD, structure, signals, and scores are screener estimates based on 24h changes.'}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {language === 'id' ? 'Funding dan OI adalah data futures publik (OKX/Bybit/Binance), bukan agregat seluruh exchange. Kolom bertanda — berarti datanya belum tersedia.' : 'Funding and OI are public futures data (OKX/Bybit/Binance), not an all-exchange aggregate. A — means the data is not available yet.'}
          </p>
          {error && coins.length > 0 && <p role="status" className="text-xs text-amber-400 mt-2">{t('market_load_fail')} · {language === 'id' ? 'Menampilkan pembaruan terakhir.' : 'Showing the last update.'}</p>}
      </div>

      <div className="flex-1 overflow-auto">
      {/* ── Table Header ── */}
      <div className={`sticky top-0 z-10 ${TABLE_MIN_W} grid ${ROW_GRID} gap-x-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800`}>
        <div className="text-[10px] font-bold text-slate-500 text-center">#</div>
        {sortHeader('sym', 'SYMBOL')}
        {sortHeader('price', 'PRICE', 'right')}
        {sortHeader('chg', '24H %', 'right')}
        {sortHeader('vol', 'VOL', 'right')}
        {sortHeader('mcap', 'MCAP', 'right', 'Market cap (CoinGecko)')}
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">24H RANGE</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">RSI</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">MACD</div>
        {sortHeader('fund', 'FUNDING', 'right', 'Funding rate futures perpetual')}
        {sortHeader('oi', 'OI', 'right', 'Open interest (USD) dari OKX/Bybit, bukan agregat seluruh exchange')}
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-end">24H HIGH</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">STRUCTURE</div>
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-center">SIGNAL</div>
        <div className="flex justify-end gap-3 items-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">SORT:</span>
            {sortHeader('score', 'SCORE', 'right')}
        </div>
      </div>

      {/* ── Rows ── */}
      <div className={`${TABLE_MIN_W} pb-10`} aria-busy={isLoading}>
        {isLoading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs tracking-widest">{t('market_loading')}</span>
          </div>
        ) : error && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span role="status" className="text-xs text-rose-500">{t('market_load_fail')}</span>
            <button
              onClick={() => { setIsLoading(true); void fetchMarketData(); }}
              disabled={isRefreshing}
              className="text-[10px] px-3 py-1 bg-slate-800 rounded text-slate-300 hover:text-neon transition-colors"
            >
              {t('market_retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-xs text-slate-500 tracking-widest uppercase">
            {search ? `${t('market_no_match')} "${search}"` : t('market_no_data')}
          </div>
        ) : (
          filtered.map((coin, index) => {
            return (
              <button
                type="button"
                key={coin.pair}
                onClick={() => onSelectSymbol?.(coin.pair)}
                aria-label={`${coin.symbol}: ${language === 'id' ? 'buka chart' : 'open chart'}`}
                className={`w-full text-left grid ${ROW_GRID} gap-x-2 px-4 py-2 border-b border-slate-800/30 hover:bg-slate-900/80 focus-visible:bg-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-400 active:bg-slate-800 cursor-pointer transition-colors group items-center`}
              >
                <div className="text-[10px] text-slate-500 text-center font-mono">{index + 1}</div>

                {/* Symbol */}
                <div>
                   <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-neon transition-colors">{coin.symbol}/{source === 'binance' ? 'USDT' : 'USD'}</div>
                   <div className="text-[9px] text-slate-500 lowercase">{source}</div>
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

                {/* Market cap */}
                <div className={clsx('text-[10px] font-mono text-right', coin.marketCap > 0 ? 'text-slate-400' : 'text-slate-600')}>
                    {coin.marketCap > 0 ? fmtVol(coin.marketCap) : '—'}
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

                {/* OPEN INTEREST */}
                <div className={clsx('text-[10px] font-mono text-right', coin.openInterestUsd === null ? 'text-slate-600' : 'text-slate-400')}>
                    {coin.openInterestUsd === null ? '—' : fmtVol(coin.openInterestUsd)}
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

              </button>
            );
          })
        )}
      </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-none px-4 py-2 border-t border-slate-800/80 bg-slate-950 flex flex-wrap gap-2 items-center justify-between">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest">
          {t('market_showing')} {filtered.length} {t('market_of')} {coins.length} pairs
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-neon animate-pulse' : 'bg-rose-500')} />
          {isConnected
            ? `${t('market_synced')} ${source.toUpperCase()} /5s · ${lastUpdated?.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? ''} WIB`
            : t('market_disconnected')
          }
        </span>
      </div>
    </div>
  );
}
