'use client';

import { useEffect, useState } from 'react';

type MarketCoin = { symbol: string; price: number; priceChangePercent: number; volume24h: number; fundingRate: number | null };
type Snapshot = { coins: MarketCoin[]; source: string; timestamp: number };

export default function LiveMarketTable({ onSelectSymbol, onAnalyzeSymbol }: {
  onSelectSymbol?: (symbol: string) => void; onAnalyzeSymbol?: (symbol: string) => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'volume24h' | 'priceChangePercent' | 'price'>('volume24h');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch('/api/binance-market', { signal: controller.signal });
        if (!response.ok) throw new Error('Data pasar belum tersedia.');
        const payload: Snapshot = await response.json();
        if (active) { setSnapshot(payload); setError(''); }
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Data pasar belum tersedia.');
      }
    };
    void load(); const timer = setInterval(load, 10000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, []);
  const rows = (snapshot?.coins ?? []).filter((coin) => coin.symbol.includes(search.toUpperCase())).sort((a,b) => b[sort] - a[sort]);
  return <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 text-foreground h-full overflow-auto">
    <div className="flex flex-wrap justify-between gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari koin" className="rounded-lg border bg-transparent p-2" />
      <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border bg-white dark:bg-slate-900 p-2"><option value="volume24h">Volume terbesar</option><option value="priceChangePercent">Perubahan terbesar</option><option value="price">Harga terbesar</option></select></div>
    {snapshot && <p className="text-xs text-slate-500">Sumber: {snapshot.source} · diperbarui {new Date(snapshot.timestamp).toLocaleTimeString('id-ID')}. Harga sumber alternatif dapat memakai USD.</p>}
    {error && <p role="status" className="text-amber-600">{error} {snapshot ? 'Angka di bawah berasal dari pembaruan terakhir.' : ''}</p>}
    <div className="overflow-auto"><table className="w-full text-sm text-left min-w-[640px]"><thead className="text-xs text-slate-500"><tr><th className="p-2">Koin</th><th>Harga</th><th>24 jam</th><th>Volume</th><th>Funding</th><th>Aksi</th></tr></thead>
      <tbody>{rows.map((coin) => <tr key={coin.symbol} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3 font-bold">{coin.symbol}</td>
        <td>${coin.price.toLocaleString('en-US', { maximumFractionDigits: 8 })}</td><td className={coin.priceChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{coin.priceChangePercent.toFixed(2)}%</td>
        <td>${coin.volume24h.toLocaleString('en-US', { notation: 'compact' })}</td><td>{coin.fundingRate === null ? 'Tidak tersedia' : `${coin.fundingRate.toFixed(4)}%`}</td>
        <td><div className="flex gap-2"><button onClick={() => onSelectSymbol?.(`${coin.symbol}USDT`)} className="rounded border px-2 py-1">Chart</button><button onClick={() => onAnalyzeSymbol?.(coin.symbol)} className="rounded bg-neon px-2 py-1 font-bold text-white">Analisis</button></div></td></tr>)}</tbody>
    </table></div>
    {!snapshot && !error && <p className="text-slate-500">Memuat data pasar…</p>}
  </section>;
}
