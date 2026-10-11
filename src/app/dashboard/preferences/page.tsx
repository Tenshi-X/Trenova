'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getPreferences, savePreferences, type UserPreset } from './actions';

export default function PreferencesPage() {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await getPreferences();
      if (result.error) throw new Error(result.error);
      setPresets(result.presets ?? []); setWatchlist(result.watchlist ?? []); setReady(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load preferences.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function save(nextPresets: UserPreset[], nextWatchlist: string[]) {
    if (busy || !ready) return;
    setBusy(true); setError('');
    try {
      const result = await savePreferences(nextPresets, nextWatchlist);
      if (result.error) throw new Error(result.error);
      setPresets(nextPresets); setWatchlist(nextWatchlist);
    } catch (error) {
      setError(error instanceof Error ? error.message : copy('Perubahan gagal disimpan.', 'Could not save changes.'));
    } finally { setBusy(false); }
  }
  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="terminal-workspace-heading"><div><h1>{copy('Preferensi', 'Preferences')}</h1>
      <p>{copy('Kelola preset analisis dan koin favorit.', 'Manage analysis presets and favorite coins.')}</p></div></div>
    <p className="text-sm text-slate-400">{copy('Simpan preset baru atau tambahkan koin favorit melalui panel Analisis AI di dashboard.', 'Save new presets or add favorite coins from the dashboard AI Analysis panel.')} <Link href="/dashboard" className="text-neon underline">Dashboard ↗</Link></p>
    {loading && <p role="status" className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{copy('Memuat preferensi…', 'Loading preferences…')}</p>}
    {error && <div role="alert" className="border border-rose-500/30 p-3 text-rose-400"><p>{error}</p>
      {!ready && <button type="button" disabled={loading} onClick={load} className="terminal-story-button mt-2">{copy('Coba lagi', 'Try again')}</button>}</div>}
    {ready && <>
      <section className="terminal-input-panel"><h2 className="terminal-panel-heading">{copy('Preset tersimpan', 'Saved presets')} · {presets.length}/5</h2>
        {!presets.length && <p className="text-slate-400">{copy('Belum ada preset pribadi.', 'No personal presets yet.')}</p>}
        <div className="space-y-2">{presets.map((preset, index) => <div key={`${preset.name}-${index}`} className="flex justify-between items-center gap-4 border border-slate-800 p-3">
          <div className="min-w-0"><strong className="text-neon break-words">{preset.name}</strong><p className="text-xs text-slate-400">{preset.timeframe} · {preset.tradingStyle} · {preset.targetRR}</p></div>
          <button type="button" disabled={busy} className="terminal-icon-button" aria-label={copy(`Hapus preset ${preset.name}`, `Delete preset ${preset.name}`)} onClick={() => void save(presets.filter((_, i) => i !== index), watchlist)}><Trash2 size={16} /></button>
        </div>)}</div>
      </section>
      <section className="terminal-input-panel"><h2 className="terminal-panel-heading">{copy('Koin favorit', 'Favorite coins')} · {watchlist.length}/20</h2>
        {!watchlist.length && <p className="text-slate-400">{copy('Belum ada koin favorit.', 'No favorite coins yet.')}</p>}
        <div className="flex flex-wrap gap-3">{watchlist.map(symbol => <div key={symbol} className="flex items-center gap-3 border border-slate-800 pl-3 text-neon"><Star size={14} /><span>{symbol}</span>
          <button type="button" disabled={busy} className="terminal-icon-button" aria-label={copy(`Hapus favorit ${symbol}`, `Remove favorite ${symbol}`)} onClick={() => void save(presets, watchlist.filter(value => value !== symbol))}><Trash2 size={14} /></button>
        </div>)}</div>
      </section>
    </>}
  </div>;
}
