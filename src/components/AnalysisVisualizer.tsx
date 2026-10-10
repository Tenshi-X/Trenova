'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export default function AnalysisVisualizer({ markdown, coinName }: {
  markdown: string; coinName: string; instant?: boolean;
}) {
  const data = useMemo(() => {
    try { return record(JSON.parse(markdown.match(/\{[\s\S]*\}/)?.[0] || markdown)); }
    catch { return null; }
  }, [markdown]);
  if (!data) return <div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{markdown}</ReactMarkdown></div>;
  const verdict = String(data.verdict || data.decision || 'WAIT');
  const reason = String(data.alasan || data.main_reason || data.summary || 'Arsip analisis.');
  const rawSetups = Array.isArray(data.setup) ? data.setup : Array.isArray(data.plans) ? data.plans : [];
  return <div className="space-y-4 text-foreground">
    <p className="text-xs text-slate-500">{coinName} · Arsip format lama</p>
    <h2 className="text-2xl font-black">{verdict}</h2><p>{reason}</p>
    {rawSetups.map((raw, index) => {
      const setup = record(raw);
      return <div key={index} className="rounded-lg border p-4 space-y-2 text-sm">
        <b>{String(setup.arah || setup.direction || verdict)} · Setup {index + 1}</b>
        <p>Entry: {String(setup.entry || setup.entry_zone || '—')}</p>
        <p>Stop: {String(setup.sl || setup.stop_loss || '—')}</p>
        <p>Target: {[setup.tp1 || setup.take_profit_1, setup.tp2 || setup.take_profit_2, setup.tp3 || setup.take_profit_3].filter(Boolean).map(String).join(' · ') || '—'}</p>
      </div>;
    })}
    <p className="text-xs text-slate-500">Level dalam arsip ini berasal dari alur analisis lama.</p>
  </div>;
}
