'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activateOrder, getCatalogAdmin, savePlan, savePreset, verifyLegacyPending, type Plan, type Preset } from './actions';

const input = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-sm text-foreground';
const labels: Record<string,string> = { code:'Kode',title_id:'Nama paket (Indonesia)',title_en:'Nama paket (Inggris)',
  checkout_url:'Tautan toko',duration_days:'Masa aktif (hari)',analysis_quota:'Kuota analisis',price_idr:'Harga (Rp)',sort_order:'Urutan tampil',
  name_id:'Nama preset (Indonesia)',name_en:'Nama preset (Inggris)',trading_style:'Gaya trading',timeframe:'Timeframe',
  risk_tolerance:'Tingkat risiko',strategy_focus:'Fokus strategi',indicator_pref:'Indikator',target_rr:'Rasio risiko/imbal hasil' };

export default function CatalogPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState({ userId: '', planCode: '', reference: '', paid: 0 });
  const reload = async () => {
    const result = await getCatalogAdmin();
    if (result.error) setMessage(result.error);
    else { setPlans(result.plans ?? []); setPresets(result.presets ?? []); }
  };
  useEffect(() => {
    getCatalogAdmin().then((result) => {
      if (result.error) setMessage(result.error);
      else { setPlans(result.plans ?? []); setPresets(result.presets ?? []); }
    });
  }, []);
  const updatePlan = (key: keyof Plan, value: unknown) => setEditing((prior) => prior ? { ...prior, [key]: value } : prior);
  const updatePreset = (key: keyof Preset, value: unknown) => setEditingPreset((prior) => prior ? { ...prior, [key]: value } : prior);
  return <main className="max-w-6xl mx-auto p-6 space-y-8 text-foreground">
    <Link href="/admin" className="text-sm text-neon">← Panel admin</Link>
    <h1 className="text-3xl font-black">Katalog dan aktivasi</h1>
    {message && <p role="status" className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">{message}</p>}

    <section className="space-y-4">
      <div className="flex justify-between"><h2 className="text-xl font-bold">Paket</h2>
        <button onClick={() => setEditing({ code: '', title_id: '', title_en: '', duration_days: 30, analysis_quota: 50, price_idr: 0,
          checkout_url: '', active: false, sort_order: 100, allowed_presets: [], features: {} })} className="text-neon">Tambah paket</button></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{plans.map((plan) => <button key={plan.code} onClick={() => setEditing(plan)}
        className="rounded-xl border border-slate-300 dark:border-slate-700 p-4 text-left hover:border-neon">
        <strong>{plan.title_id} · {plan.analysis_quota} analisis</strong>
        <p className="text-sm">{plan.duration_days} hari · Rp{plan.price_idr.toLocaleString('id-ID')}</p>
        <p className="text-xs">{plan.active ? 'Tayang' : 'Disembunyikan'} · {plan.code}</p>
      </button>)}</div>
      {editing && <form className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3" onSubmit={async (event) => {
        event.preventDefault(); const result = await savePlan(editing); setMessage(result.success ? 'Paket tersimpan.' : result.error || 'Gagal.');
        if (result.success) { setEditing(null); await reload(); }
      }}>
        {(['code', 'title_id', 'title_en', 'checkout_url'] as const).map((key) => <label key={key} className="text-sm">{labels[key]}<input className={input} value={editing[key]} onChange={(event) => updatePlan(key, event.target.value)} required /></label>)}
        {(['duration_days', 'analysis_quota', 'price_idr', 'sort_order'] as const).map((key) => <label key={key} className="text-sm">{labels[key]}<input type="number" className={input} value={editing[key]} onChange={(event) => updatePlan(key, Number(event.target.value))} required /></label>)}
        <label className="text-sm">Preset yang diizinkan (kode, pisahkan koma)<input className={input} value={editing.allowed_presets.join(', ')} onChange={(event) => updatePlan('allowed_presets', event.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
        <fieldset className="sm:col-span-2 flex flex-wrap gap-4 text-sm"><legend className="font-semibold">Fitur paket</legend>
          {([['image_upload','Unggah chart'],['history','Riwayat'],['outcome_check','Periksa target/stop']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={editing.features?.[key] !== false} onChange={(event) => updatePlan('features', { ...editing.features, [key]: event.target.checked })} />{label}
          </label>)}
        </fieldset>
        <label className="flex items-center gap-2"><input type="checkbox" checked={editing.active} onChange={(event) => updatePlan('active', event.target.checked)} /> Tayang</label>
        <div className="sm:col-span-2 flex gap-3"><button className="rounded-lg bg-neon px-5 py-2 font-bold text-white">Simpan paket</button><button type="button" onClick={() => setEditing(null)}>Batal</button></div>
      </form>}
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-bold">Preset analisis</h2>
      <button className="text-sm text-neon" onClick={() => setEditingPreset({ code: '', name_id: '', name_en: '',
        trading_style: 'intraday', timeframe: '1h', risk_tolerance: 'Medium Risk', strategy_focus: 'All-Round',
        indicator_pref: 'Default', target_rr: '1:2', enabled: true })}>Tambah preset</button>
      <div className="flex flex-wrap gap-2">{presets.map((preset) => <button key={preset.code} onClick={() => setEditingPreset(preset)} className="rounded-lg border p-3">{preset.name_id} · {preset.enabled ? 'Aktif' : 'Nonaktif'}</button>)}</div>
      {editingPreset && <form className="rounded-xl border p-4 grid sm:grid-cols-2 gap-3" onSubmit={async (event) => {
        event.preventDefault(); const result = await savePreset(editingPreset); setMessage(result.success ? 'Preset tersimpan.' : result.error || 'Gagal.');
        if (result.success) { setEditingPreset(null); await reload(); }
      }}>
        {(['code', 'name_id', 'name_en'] as const).map((key) => <label key={key}>{labels[key]}<input className={input} value={editingPreset[key]} onChange={(event) => updatePreset(key, event.target.value)} /></label>)}
        {([['trading_style', ['scalping','intraday','swing']], ['timeframe', ['15m','30m','1h','4h','1d']],
          ['risk_tolerance', ['Low Risk','Medium Risk','High Risk']], ['strategy_focus', ['All-Round','Breakout','Trend Following','Mean Reversion']],
          ['indicator_pref', ['Default','Price Action Only','Momentum','Moving Averages']], ['target_rr', ['1:2','1:3','1:4']]] as [keyof Preset,string[]][]).map(([key, values]) => <label key={key}>{labels[key]}<select className={input} value={String(editingPreset[key])} onChange={(event) => updatePreset(key, event.target.value)}>{values.map((value) => <option key={value}>{value}</option>)}</select></label>)}
        <label className="flex gap-2"><input type="checkbox" checked={editingPreset.enabled} onChange={(event) => updatePreset('enabled', event.target.checked)} /> Aktif</label>
        <div className="sm:col-span-2 flex gap-3"><button className="rounded-lg bg-neon px-5 py-2 font-bold text-white">Simpan preset</button><button type="button" onClick={() => setEditingPreset(null)}>Batal</button></div>
      </form>}
    </section>

    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Aktivasi pesanan toko</h2>
      <p className="text-sm text-slate-500">Catat nomor pesanan asli. Nomor yang sama hanya bisa dipakai sekali.</p>
      <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (event) => {
        event.preventDefault(); const result = await activateOrder(order.userId, order.planCode, order.reference, order.paid);
        setMessage(result.success ? 'Pesanan diaktifkan.' : result.error || 'Aktivasi gagal.');
        if (result.success) setOrder({ userId: '', planCode: '', reference: '', paid: 0 });
      }}>
        <label>ID pengguna<input className={input} value={order.userId} onChange={(event) => setOrder({ ...order, userId: event.target.value })} required /></label>
        <label>Paket<select className={input} value={order.planCode} onChange={(event) => setOrder({ ...order, planCode: event.target.value })} required><option value="">Pilih paket</option>{plans.filter((plan) => plan.active).map((plan) => <option key={plan.code} value={plan.code}>{plan.title_id} · {plan.analysis_quota} · Rp{plan.price_idr.toLocaleString('id-ID')}</option>)}</select></label>
        <label>Nomor pesanan<input className={input} value={order.reference} onChange={(event) => setOrder({ ...order, reference: event.target.value })} required /></label>
        <label>Nominal dibayar<input type="number" min="0" className={input} value={order.paid} onChange={(event) => setOrder({ ...order, paid: Number(event.target.value) })} required /></label>
        <button className="rounded-lg bg-neon px-5 py-2 font-bold text-white sm:col-span-2">Aktifkan</button>
      </form>
    </section>
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-bold">Verifikasi akun lama yang tertunda</h2>
      <p className="text-sm text-slate-500">Gunakan bukti pesanan asli untuk mengesahkan masa aktif lama. Sisa kuota tetap sesuai profil; masa aktif dimulai ketika pengguna masuk.</p>
      <form className="grid sm:grid-cols-3 gap-3" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const result = await verifyLegacyPending(String(form.get('userId')), String(form.get('orderReference')), Number(form.get('days')));
        setMessage(result.error || 'Hak lama terverifikasi.');
      }}>
        <label>ID pengguna<input name="userId" className={input} required /></label>
        <label>Nomor pesanan asli<input name="orderReference" className={input} required /></label>
        <label>Masa aktif (hari)<input name="days" type="number" min="1" max="3650" className={input} required /></label>
        <button className="rounded-lg bg-neon px-4 py-2 font-bold text-white sm:col-span-3">Verifikasi hak lama</button>
      </form>
    </section>
  </main>;
}
