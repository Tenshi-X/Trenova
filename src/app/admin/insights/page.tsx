'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInsights, setReportStatus, updateAnalysisControl } from './actions';

type InsightData = Awaited<ReturnType<typeof getInsights>>;

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null);
  const [message, setMessage] = useState('');
  const load = () => { void getInsights().then(setData); };
  useEffect(load, []);
  const summary = data && 'summary' in data ? data.summary : null;
  return <main className="max-w-6xl mx-auto p-6 space-y-8 text-foreground">
    <Link href="/admin" className="text-neon text-sm">← Panel admin</Link>
    <h1 className="text-3xl font-black">Pemakaian & laporan</h1>
    {message && <p role="status">{message}</p>}
    {data && 'error' in data && <p className="text-rose-500">{data.error}</p>}
    {summary && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {([['total_runs','Analisis'],['failed_runs','Gagal'],['total_cost_idr','Biaya Gemini tercatat (Rp)'],['unknown_cost_runs','Biaya belum diketahui'],['total_quota_remaining','Sisa kuota aktif'],['total_input_tokens','Token masuk'],['total_output_tokens','Token keluar'],['open_reports','Laporan baru']] as const)
        .map(([key,label]) => <div key={key} className="rounded-xl border p-4"><p className="text-sm text-slate-500">{label}</p><strong className="text-2xl">{Number(summary[key] || 0).toLocaleString('id-ID')}</strong></div>)}
    </div>}
    {data && 'control' in data && data.control && <form key={data.control.updated_at} className="rounded-xl border p-5 space-y-3" onSubmit={async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      const result = await updateAnalysisControl(form.get('enabled') === 'on', Number(form.get('rollout')),
        String(form.get('evaluators')).split(/[\s,]+/).filter(Boolean), form.get('quality') === 'on');
      setMessage(result.error || 'Pengaturan rilis tersimpan.'); load();
    }}>
      <h2 className="text-xl font-bold">Rilis analisis bertahap</h2>
      <p className="text-sm text-slate-500">Aktifkan akun evaluasi dahulu. Buka rilis pengguna setelah contoh lama dan baru dinilai serta biaya setiap contoh memenuhi batas.</p>
      <p className="text-sm">{data.control.disabled_reason || 'Analisis aktif'} · batas Rp500, kurs pengaman minimal Rp20.000/US$</p>
      <label className="flex gap-2"><input name="enabled" type="checkbox" defaultChecked={data.control.enabled} />Aktifkan analisis</label>
      <label className="block">Persentase pengguna (0–100)<input name="rollout" type="number" min="0" max="100" defaultValue={data.control.rollout_percent} className="ml-2 rounded border bg-transparent p-2" /></label>
      <label className="block">ID akun evaluasi<textarea name="evaluators" defaultValue={(data.control.evaluation_user_ids ?? []).join('\n')} className="block w-full rounded border bg-transparent p-2" /></label>
      <label className="flex gap-2"><input name="quality" type="checkbox" />Contoh evaluasi menunjukkan kualitas membaik dan setiap contoh memenuhi batas biaya</label>
      <button className="rounded-lg bg-neon px-4 py-2 font-bold text-white">Simpan rilis</button>
    </form>}
    <section><h2 className="text-xl font-bold mb-3">Laporan pengguna</h2>
      <div className="space-y-2">{data && 'reports' in data && data.reports?.map((report) => <div key={report.id} className="rounded-lg border p-3 flex flex-wrap justify-between gap-2 text-sm">
        <div><b>{report.status}</b> · {new Date(report.created_at).toLocaleString('id-ID')}<p>{report.reason}</p><p className="text-xs text-slate-500">Analisis {report.analysis_id}</p></div>
        <div className="flex gap-2">{(['reviewed','resolved'] as const).map((status) => <button key={status} onClick={async () => { await setReportStatus(report.id,status); load(); }} className="rounded border px-3 py-1">{status}</button>)}</div>
      </div>)}</div>
    </section>
    <section><h2 className="text-xl font-bold mb-3">Perubahan admin terbaru</h2>
      <div className="space-y-1 text-sm">{data && 'audit' in data && data.audit?.map((event) => <p key={event.id} className="border-b p-2">{new Date(event.created_at).toLocaleString('id-ID')} · {event.action} · {event.target}</p>)}</div>
    </section>
  </main>;
}
