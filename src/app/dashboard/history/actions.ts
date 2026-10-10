'use server';

import { getSessionProfile } from '@/lib/authz';
import type { AnalysisV2, Candle, Timeframe } from '@/lib/analysis/core';
import { parseCandle, TIMEFRAMES } from '@/lib/analysis/core';
import { evaluateSetupOutcome } from '@/lib/analysis/outcome';

export type HistoryRow = {
  id: string; created_at: string; analysis_json: unknown; coin_symbol: string | null;
  coin_name: string | null; schema_version: number | null; user_note: string | null;
  outcome_json: unknown; timeframe: string | null;
};

export async function listHistory(page = 1, search = '') {
  const context = await getSessionProfile();
  if (!context) return { rows: [] as HistoryRow[], total: 0, error: 'Silakan masuk kembali.' };
  if (context.profile.enabled_features?.history === false) return { rows: [] as HistoryRow[], total: 0, error: 'Riwayat tidak tersedia pada paket ini.' };
  const safePage = Math.max(1, Math.min(10000, Math.floor(page)));
  const term = search.trim().replace(/[%(),]/g, ' ').slice(0, 60);
  let query = context.admin.from('analysis_results')
    .select('id,created_at,analysis_json,coin_symbol,coin_name,schema_version,user_note,outcome_json,timeframe', { count: 'exact' })
    .eq('user_id', context.user.id).order('created_at', { ascending: false })
    .range((safePage - 1) * 10, safePage * 10 - 1);
  if (term) query = query.or(`coin_name.ilike.%${term}%,coin_symbol.ilike.%${term}%,user_note.ilike.%${term}%`);
  const { data, count, error } = await query;
  return { rows: (data ?? []) as HistoryRow[], total: count ?? 0, error: error?.message };
}

export async function saveHistoryNote(id: string, note: string) {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  if (context.profile.enabled_features?.history === false) return { error: 'Riwayat tidak tersedia pada paket ini.' };
  if (note.length > 1000) return { error: 'Catatan maksimal 1000 karakter.' };
  const { data, error } = await context.admin.from('analysis_results').update({ user_note: note.trim() })
    .eq('id', id).eq('user_id', context.user.id).select('id').single();
  return error || !data ? { error: 'Riwayat tidak ditemukan.' } : { success: true };
}

export async function reportHistory(id: string, reason: string) {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  if (context.profile.enabled_features?.history === false) return { error: 'Riwayat tidak tersedia pada paket ini.' };
  const clean = reason.trim().slice(0, 500);
  if (clean.length < 10) return { error: 'Jelaskan masalah minimal 10 karakter.' };
  const { data: owned } = await context.admin.from('analysis_results').select('id')
    .eq('id', id).eq('user_id', context.user.id).single();
  if (!owned) return { error: 'Riwayat tidak ditemukan.' };
  const { error } = await context.admin.from('analysis_reports').upsert({
    analysis_id: id, user_id: context.user.id, reason: clean, status: 'new',
  }, { onConflict: 'analysis_id,user_id' });
  return error ? { error: error.message } : { success: true };
}

export async function checkHistoryOutcome(id: string) {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  if (context.profile.enabled_features?.history === false || context.profile.enabled_features?.outcome_check === false)
    return { error: 'Pemeriksaan target tidak tersedia pada paket ini.' };
  const { data: row } = await context.admin.from('analysis_results')
    .select('id,analysis_json,coin_symbol,created_at,timeframe')
    .eq('id', id).eq('user_id', context.user.id).single();
  if (!row || row.analysis_json?.version !== 2 || !row.coin_symbol
    || !TIMEFRAMES.includes(row.timeframe as Timeframe)) return { error: 'Analisis ini belum mendukung pemeriksaan hasil.' };
  const analysis = row.analysis_json as AnalysisV2;
  if (analysis.verdict === 'WAIT' || !analysis.setups.length) return { error: 'Hasil WAIT tidak memiliki setup transaksi.' };
  const startTime = new Date(row.created_at).getTime();
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(row.coin_symbol.toUpperCase())}USDT&interval=${row.timeframe}&startTime=${startTime}&limit=1000`;
  let candles: Candle[] = [];
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Provider unavailable');
    const raw: unknown = await response.json();
    if (!Array.isArray(raw)) throw new Error('Invalid candles');
    candles = raw.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now());
  } catch { return { error: 'Data candle belum tersedia. Coba lagi nanti.' }; }
  if (!candles.length) return { error: 'Belum ada candle tertutup sejak analisis.' };
  const outcomes = analysis.setups.map((setup) => evaluateSetupOutcome(setup, candles));
  const result = { outcomes, checked_at: new Date().toISOString(), candles_checked: candles.length,
    truncated: candles.length === 1000 };
  await context.admin.from('analysis_results').update({ outcome_json: result })
    .eq('id', id).eq('user_id', context.user.id);
  return { result };
}
