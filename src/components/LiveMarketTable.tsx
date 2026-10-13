'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import MarketOverview from '@/components/MarketOverview';
import { CATEGORY_DEFS } from '@/lib/market-categories';

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
  rsi: number | null;
  macdHist: number | null;
  structure: string | null;
  rating: string | null;
  score: number | null;
  chg1h: number | null;
  chg4h: number | null;
  chg12h: number | null;
  exchanges: number | null;
  group: 'crypto' | 'tradfi';
}

interface LiveMarketTableProps {
  onSelectSymbol?: (symbol: string) => void;
}

type MarketSnapshot = {
  coins: Array<{ symbol: string; pair?: string; price: number; priceChangePercent: number;
    high24h: number; low24h: number; volume24h: number; fundingRate: number | null;
    openInterestUsd?: number | null; marketCap?: number; rsi?: number | null; macdHist?: number | null;
    structure?: string | null; rating?: string | null; score?: number | null;
    change1h?: number | null; change4h?: number | null; change12h?: number | null; exchanges?: number; group?: string }>;
  categories?: Record<string, string[]>;
  source?: string;
  timestamp?: number;
};

// Column layout shared by the header and every row (15 columns).
const ROW_GRID = 'grid-cols-[30px_1.5fr_1fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr_1fr_1.5fr]';
const TABLE_MIN_W = 'min-w-[1480px]';

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

function fmtRangeEnd(value: number): string {
  return value >= 1000 ? Math.round(value).toLocaleString('en-US') : fmtPrice(value);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveMarketTable({ onSelectSymbol }: LiveMarketTableProps) {
  const { t, language } = useLanguage();
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'score'|'vol' | 'chg' | 'price' | 'sym' | 'mcap' | 'oi' | 'fund'>('score');
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc');
  const [filterMode, setFilterMode]   = useState<'ALL' | 'BULL' | 'BEAR' | 'BREAKOUT'>('ALL');
  const [source, setSource] = useState('');
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState<string>('crypto');
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
          rsi: coin.rsi ?? null,
          macdHist: coin.macdHist ?? null,
          structure: coin.structure ?? null,
          rating: coin.rating ?? null,
          score: coin.score ?? null,
          chg1h: coin.change1h ?? null,
          chg4h: coin.change4h ?? null,
          chg12h: coin.change12h ?? null,
          exchanges: coin.exchanges ?? null,
          group: coin.group === 'tradfi' ? 'tradfi' as const : 'crypto' as const,
        }));
      });

      setIsLoading(false);
      setError('');
      setSource(json.source ?? 'binance');
      setCategories(json.categories ?? {});
    } catch {
      if (controller.signal.aborted) return;
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

  const processedCoins = coins.map(c => ({
      ...c,
      // Distance of the current price from the 24h high (real data, not an estimate).
      distHigh: c.high24h > 0 ? ((c.price - c.high24h) / c.high24h) * 100 : 0,
  }));

  const categoryTabs = [
    { id: 'all', label: 'All', count: coins.length },
    { id: 'crypto', label: 'Crypto', count: coins.filter((c) => c.group === 'crypto').length },
    ...(coins.some((c) => c.group === 'tradfi') ? [{ id: 'tradfi', label: 'TradFi', count: coins.filter((c) => c.group === 'tradfi').length }] : []),
    ...CATEGORY_DEFS.flatMap((def) => (categories[def.id]?.length ? [{ id: def.id, label: def.label, count: categories[def.id].length }] : [])),
  ];

  // If the chosen category vanished (e.g. CoinGecko is down), fall back to Crypto instead of showing an empty table.
  const activeCategory = categoryTabs.some((tab) => tab.id === category) ? category : 'crypto';

  const filtered = processedCoins
    .filter(c => {
      if (search) {
        const q = search.toUpperCase();
        if (!c.symbol.includes(q) && !c.name.toUpperCase().includes(q)) return false;
      }
      if (activeCategory === 'crypto' && c.group !== 'crypto') return false;
      if (activeCategory === 'tradfi' && c.group !== 'tradfi') return false;
      if (activeCategory !== 'all' && activeCategory !== 'crypto' && activeCategory !== 'tradfi'
        && !(c.group === 'crypto' && categories[activeCategory]?.includes(c.symbol))) return false;
      if (filterMode === 'BULL') return (c.rating ?? '').includes('BULL');
      if (filterMode === 'BEAR') return (c.rating ?? '').includes('BEAR');
      if (filterMode === 'BREAKOUT') return c.structure === 'Breakout';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'mcap' || sortBy === 'oi' || sortBy === 'fund' || sortBy === 'score') {
        const pick = (c: typeof a) => sortBy === 'mcap' ? (c.marketCap > 0 ? c.marketCap : null)
          : sortBy === 'oi' ? c.openInterestUsd : sortBy === 'score' ? c.score : c.fundingRate;
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
      return sortDir === 'desc' ? d : -d;
    });

  const sortHeader = (col: typeof sortBy, label: string, align: 'left'|'right'|'center' = 'left', title?: string) => (
    <button
      title={title}
      onClick={() => handleSort(col)}
      type="button"
      aria-label={`${label}: ${sortBy === col ? sortDir : 'sort'}`}
      className={clsx(
        'text-[11px] font-semibold uppercase tracking-wide transition-colors flex items-center gap-1 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-teal-400',
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start',
        sortBy === col ? 'text-neon' : 'text-slate-400 hover:text-slate-300',
      )}
    >
      {label}
      {sortBy === col && <span className="text-xs">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
    <MarketOverview
      coins={coins.filter((c) => c.group === 'crypto').map((c) => ({ symbol: c.symbol, price: c.price, chg24h: c.chg24h, chg1h: c.chg1h, chg4h: c.chg4h, chg12h: c.chg12h, vol24h: c.vol24h, openInterestUsd: c.openInterestUsd }))}
      language={language}
      onSelectSymbol={(symbol) => onSelectSymbol?.(symbol)}
    />
    <div className="flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-slate-300 [--color-neon:#2dd4bf]" style={{ height: 'min(760px, calc(100vh - 160px))', minHeight: '420px' }}>

      {/* ── Header Filters ── */}
      <div className="flex-none px-4 py-3 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-neon/10 rounded-lg"><Search size={14} className="text-neon" /></div>
                 <span className="text-base font-semibold text-slate-100 tracking-tight">
                     Altcoin Screener
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
                            "px-3 py-1.5 rounded text-xs font-bold uppercase transition-all tracking-wider border cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-teal-400",
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
                        className="w-40 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs focus:border-neon focus:outline-none transition-colors"
                    />
                 </div>
                 <button type="button" onClick={() => void fetchMarketData()} disabled={isRefreshing}
                   aria-label={language === 'id' ? 'Perbarui pasar' : 'Refresh market'}
                   className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-neon cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-teal-400 disabled:opacity-50 disabled:cursor-wait">
                   <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                 </button>
              </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Kategori">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                onClick={() => setCategory(tab.id)}
                className={clsx(
                  'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-400',
                  activeCategory === tab.id ? 'border-neon text-neon bg-neon/10' : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-900',
                )}
              >
                {tab.label} <span className="text-slate-500 font-normal">{tab.count}</span>
              </button>
            ))}
          </div>
          {error && coins.length > 0 && <p role="status" className="text-xs text-amber-400 mt-2">{t('market_load_fail')} · {language === 'id' ? 'Menampilkan pembaruan terakhir.' : 'Showing the last update.'}</p>}
      </div>

      <div className="flex-1 overflow-auto">
      {/* ── Table Header ── */}
      <div className={`sticky top-0 z-10 ${TABLE_MIN_W} grid ${ROW_GRID} gap-x-3 px-5 py-3 bg-slate-900 border-b border-slate-800`}>
        <div className="text-xs font-bold text-slate-500 text-center">#</div>
        {sortHeader('sym', 'SYMBOL')}
        {sortHeader('price', 'PRICE', 'right')}
        {sortHeader('chg', '24H %', 'right')}
        {sortHeader('vol', 'VOL', 'right')}
        {sortHeader('mcap', 'MCAP', 'right', 'Market cap (CoinGecko)')}
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-center">24H RANGE</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-center" title="RSI 14, candle 1 jam">RSI</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-center" title="MACD histogram (12/26/9) candle 1 jam, dalam % dari harga">MACD</div>
        {sortHeader('fund', 'FUNDING', 'right', 'Funding rate futures perpetual, rata-rata antar exchange')}
        {sortHeader('oi', 'OI', 'right', 'Open interest (USD), dijumlah dari exchange yang aktif')}
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-end">24H HIGH</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-center" title="Breakout/Breakdown: harga 1 jam menembus high/low 20 candle terakhir">STRUCTURE</div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex justify-center" title="Rating teknikal sederhana dari RSI, MACD, dan EMA20 (candle 1 jam)">RATING 1H</div>
        <div className="flex justify-end gap-3 items-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide">SORT:</span>
            {sortHeader('score', 'SCORE', 'right')}
        </div>
      </div>

      {/* ── Rows ── */}
      <div className={`${TABLE_MIN_W} pb-10`} aria-busy={isLoading}>
        {isLoading && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
            <Loader2 className="animate-spin text-neon" size={24} />
            <span className="text-xs">{t('market_loading')}</span>
          </div>
        ) : error && coins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span role="status" className="text-xs text-rose-500">{t('market_load_fail')}</span>
            <button
              onClick={() => { setIsLoading(true); void fetchMarketData(); }}
              disabled={isRefreshing}
              className="text-xs px-3 py-1 bg-slate-800 rounded text-slate-300 hover:text-neon transition-colors"
            >
              {t('market_retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-slate-500">
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
                className={`w-full text-left grid ${ROW_GRID} gap-x-3 px-5 py-3.5 border-b border-slate-800/40 hover:bg-slate-900/80 focus-visible:bg-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-400 active:bg-slate-800 cursor-pointer transition-colors group items-center`}
              >
                <div className="text-xs text-slate-500 text-center tabular-nums">{index + 1}</div>

                {/* Symbol */}
                <div className="flex items-center gap-3 min-w-0">
                   <div className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200">{coin.symbol.slice(0, 2)}</div>
                   <div className="min-w-0">
                     <div className="text-sm font-semibold text-slate-100 group-hover:text-neon transition-colors truncate">{coin.symbol}<span className="text-slate-500 font-normal">/{source === 'binance' || source === 'okx' ? 'USDT' : 'USD'}</span></div>
                     <div className="text-[11px] text-slate-500 whitespace-nowrap">Perp · {coin.exchanges && coin.exchanges > 1 ? `${coin.exchanges} exch.` : source.toUpperCase()}</div>
                   </div>
                </div>

                {/* Price */}
                <div className="text-sm tabular-nums font-semibold text-slate-100 text-right">
                    {fmtPrice(coin.price)}
                </div>

                {/* 24h % */}
                <div className={clsx('text-[13px] font-semibold text-right tabular-nums', coin.chg24h >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {coin.chg24h >= 0 ? '+' : ''}{coin.chg24h.toFixed(2)}%
                </div>

                {/* Vol */}
                <div className="text-[13px] tabular-nums text-slate-400 text-right">
                    {fmtVol(coin.vol24h)}
                </div>

                {/* Market cap */}
                <div className={clsx('text-[13px] tabular-nums text-right', coin.marketCap > 0 ? 'text-slate-400' : 'text-slate-600')}>
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
                    <div className="flex justify-between w-full text-[10px] text-slate-500 tabular-nums">
                        <span>{fmtRangeEnd(coin.low24h)}</span>
                        <span>{fmtRangeEnd(coin.high24h)}</span>
                    </div>
                </div>

                {/* RSI */}
                <div className={clsx('text-[13px] font-semibold text-center tabular-nums',
                    coin.rsi === null ? 'text-slate-600' : coin.rsi > 70 ? 'text-rose-500' : coin.rsi < 30 ? 'text-emerald-500' : 'text-slate-300'
                )}>
                    {coin.rsi === null ? '—' : coin.rsi.toFixed(0)}
                </div>

                {/* MACD */}
                <div className={clsx('text-[13px] font-semibold text-center tabular-nums', coin.macdHist === null ? 'text-slate-600' : coin.macdHist >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {coin.macdHist === null ? '—' : `${coin.macdHist > 0 ? '+' : ''}${((coin.macdHist / coin.price) * 100).toFixed(3)}%`}
                </div>

                {/* FUNDING */}
                <div className={clsx('text-[13px] tabular-nums text-right',
                    coin.fundingRate === null ? 'text-slate-600' : coin.fundingRate > 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                    {coin.fundingRate === null ? '—' : `${coin.fundingRate > 0 ? '+' : ''}${coin.fundingRate.toFixed(4)}%`}
                </div>

                {/* OPEN INTEREST */}
                <div className={clsx('text-[13px] tabular-nums text-right', coin.openInterestUsd === null ? 'text-slate-600' : 'text-slate-400')}>
                    {coin.openInterestUsd === null ? '—' : fmtVol(coin.openInterestUsd)}
                </div>

                {/* 24H HIGH */}
                <div className={clsx('text-[13px] tabular-nums text-right',
                    coin.distHigh === 0 ? 'text-slate-600' : coin.distHigh > -2 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                    {coin.distHigh === 0 ? '—' : `${coin.distHigh.toFixed(1)}%`}
                </div>

                {/* STRUCTURE */}
                <div className="text-xs text-slate-400 text-center">
                    {coin.structure ?? '—'}
                </div>

                {/* SIGNAL */}
                <div className="flex justify-center">
                    <span className={clsx(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                        (coin.rating ?? '').includes('BULL') ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                        (coin.rating ?? '').includes('BEAR') ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' :
                        'border-slate-600 text-slate-400 bg-slate-800/50'
                    )}>
                        {coin.rating ?? '—'}
                    </span>
                </div>

                {/* SCORE */}
                <div className="flex items-center justify-end gap-3">
                    <div className="flex-1 max-w-[50px] bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={clsx("h-full rounded-full transition-all",
                                coin.score === null ? 'bg-slate-700' : coin.score >= 70 ? 'bg-emerald-500' :
                                coin.score <= 40 ? 'bg-rose-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${coin.score ?? 0}%` }}
                        />
                    </div>
                    <span className={clsx("text-sm font-semibold tabular-nums w-7 text-right",
                        coin.score === null ? 'text-slate-600' : coin.score >= 70 ? 'text-emerald-500' :
                        coin.score <= 40 ? 'text-rose-500' : 'text-amber-500'
                    )}>{coin.score ?? '—'}</span>
                </div>

              </button>
            );
          })
        )}
      </div>
      </div>

    </div>
    </div>
  );
}
