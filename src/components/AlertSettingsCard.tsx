'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getAlertSettings, saveAlertSettings, type AlertSettings } from '@/app/dashboard/preferences/alert-actions';

export default function AlertSettingsCard() {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    getAlertSettings().then(result => { if (!active) return; if (result.settings) setSettings(result.settings); else setError(result.error ?? ''); });
    return () => { active = false; };
  }, []);
  const change = async (patch: Partial<AlertSettings>) => {
    if (!settings || busy) return;
    const next = { ...settings, ...patch };
    setBusy(true); setError('');
    const result = await saveAlertSettings(next);
    setBusy(false);
    if (result.error) setError(result.error); else setSettings(next);
  };
  const row = (checked: boolean, onChange: (value: boolean) => void, title: string, body: string, disabled = false) =>
    <label className="flex items-start gap-3 border border-slate-800 p-3">
      <input type="checkbox" className="mt-1" checked={checked} disabled={busy || disabled || !settings} onChange={event => onChange(event.target.checked)} />
      <span><strong className="block">{title}</strong><span className="text-xs text-slate-400">{body}</span></span></label>;
  return <section className="terminal-input-panel"><h2 className="terminal-panel-heading">{copy('Notifikasi email', 'Email notifications')}</h2>
    {!settings && !error && <p role="status" className="flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" />{copy('Memuat…', 'Loading…')}</p>}
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    {settings && <div className="space-y-2">
      {row(settings.emailAlerts, value => void change({ emailAlerts: value }), copy('Status rencana & sisa token', 'Plan status & remaining tokens'),
        copy('Email saat rencana dari analisismu berubah status (terpicu, terisi, TP, SL, batal, kedaluwarsa) dan saat token tinggal 3 atau kurang. Status dihitung dari candle yang sudah tutup, jadi bisa tertunda.', 'Email when a plan from your analyses changes status (triggered, filled, TP, SL, cancelled, expired) and when 3 or fewer tokens are left. Status is computed from closed candles, so it can lag.'))}
      {row(settings.expiryAlerts, value => void change({ expiryAlerts: value }), copy('Pengingat masa aktif (7 hari sebelum berakhir)', 'Plan expiry reminder (7 days before)'),
        copy('Satu email saat masa aktif paketmu tinggal 7 hari.', 'One email when your plan has 7 days left.'), !settings.emailAlerts)}
    </div>}
  </section>;
}
