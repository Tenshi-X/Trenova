import type { SupabaseClient } from '@supabase/supabase-js';
import { parseCandle, TIMEFRAME_MILLIS, TIMEFRAMES, type AnalysisSetup, type Candle, type CandleTimeframe } from './core';
import { FINER_TIMEFRAME, resolveWithFinerCandles, trackPlan, type PlanStatus, type PlanTrack, type Resolution } from './tracking';

// Server-side refresh of plan tracking: loads the candles that closed after each saved analysis and lets the
// pure tracker decide what happened. Nothing here needs a background process; it can run when a user opens
// their history or from the scheduled alert job.

const SPOT_HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com', 'https://api-gcp.binance.com'];
const OKX_HOSTS = ['https://www.okx.com', 'https://aws.okx.com'];
const OKX_BAR: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1Dutc', '1w': '1Wutc' };
const INTERVAL_MS: Record<string, number> = { '1m': 60_000, '5m': 300_000, ...TIMEFRAME_MILLIS };
const STALE_AFTER_MS = 30 * 86_400_000;
const FETCH_TIMEOUT = 3500;

export type AnalysisRow = {
  id: string; user_id: string | null; coin_symbol: string | null; timeframe: string | null;
  created_at: string; analysis_json: unknown;
};

export type TrackingRecord = {
  analysis_id: string; setup_index: number; user_id: string; symbol: string; timeframe: string;
  direction: 'LONG' | 'SHORT'; status: PlanStatus; final: boolean;
  triggered_at: string | null; filled_at: string | null; closed_at: string | null;
  tp1_at: string | null; tp2_at: string | null; r: number | null; ambiguous: boolean;
  stopped_after_tp1: boolean; last_candle_at: string | null; notified_status: string | null; checked_at: string;
};

export type PlanItem = {
  analysisId: string; userId: string; symbol: string; timeframe: string; setupIndex: number;
  setup: AnalysisSetup; asOf: number; waitCandles: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Turns a saved v2 analysis into trackable plans. Older/other formats and bad numbers yield nothing. */
export function planItemsFor(row: AnalysisRow): PlanItem[] {
  const json = row.analysis_json;
  if (!row.user_id || !row.coin_symbol || !isObject(json) || json.version !== 2 || !Array.isArray(json.setups)) return [];
  if (!(TIMEFRAMES as readonly string[]).includes(row.timeframe ?? '')) return [];
  const symbol = row.coin_symbol.toUpperCase();
  if (!/^[A-Z0-9]{2,15}$/.test(symbol)) return [];
  const market = isObject(json.market) ? json.market : null;
  const asOf = Date.parse(String(market?.asOf ?? row.created_at));
  if (!Number.isFinite(asOf)) return [];
  const duration = TIMEFRAME_MILLIS[row.timeframe as CandleTimeframe];
  const expires = typeof json.expiresAt === 'string' ? Date.parse(json.expiresAt) : NaN;
  const derived = Number.isFinite(expires) ? Math.round((expires - asOf) / duration) : 6;
  const waitCandles = Math.min(24, Math.max(1, derived));
  const items: PlanItem[] = [];
  json.setups.slice(0, 4).forEach((raw, setupIndex) => {
    if (!isObject(raw)) return;
    const setup = raw as unknown as AnalysisSetup;
    const numbers = [setup.entryLow, setup.entryHigh, setup.stopLoss, setup.takeProfit1, setup.takeProfit2];
    if ((setup.direction !== 'LONG' && setup.direction !== 'SHORT') || numbers.some(value => typeof value !== 'number' || !(value > 0))) return;
    if (setup.entryLow > setup.entryHigh) return;
    items.push({ analysisId: row.id, userId: row.user_id as string, symbol, timeframe: row.timeframe as string, setupIndex, setup, asOf, waitCandles });
  });
  return items;
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

function closedCandles(rows: unknown[]): Candle[] {
  return rows.map(parseCandle).filter((candle): candle is Candle => candle !== null && candle.closeTime <= Date.now())
    .sort((a, b) => a.openTime - b.openTime);
}

async function binanceSince(symbol: string, interval: string, startTime: number): Promise<Candle[] | null> {
  const all: Candle[] = [];
  let cursor = startTime;
  for (let page = 0; page < 3; page++) {
    let rows: unknown[] | null = null;
    for (const host of SPOT_HOSTS) {
      const data = await getJson(`${host}/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&startTime=${Math.max(0, Math.floor(cursor))}&limit=1000`);
      if (Array.isArray(data)) { rows = data; break; }
    }
    // No host answered: unknown, which is different from "answered, nothing has closed yet".
    if (!rows) return page > 0 ? all : null;
    all.push(...closedCandles(rows));
    if (rows.length < 1000) break;
    const last = rows[rows.length - 1];
    cursor = Number(Array.isArray(last) ? last[0] : NaN) + 1;
    if (!Number.isFinite(cursor)) break;
  }
  return all;
}

// OKX only returns the latest 300 candles per call, so it is accepted only when that covers the whole period.
async function okxSince(symbol: string, interval: string, startTime: number): Promise<Candle[] | null> {
  const bar = OKX_BAR[interval];
  if (!bar) return null;
  const duration = INTERVAL_MS[interval];
  for (const instId of [`${symbol}-USDT`, `${symbol}-USDT-SWAP`]) {
    for (const host of OKX_HOSTS) {
      const body = await getJson(`${host}/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=300`);
      const data = isObject(body) && body.code === '0' && Array.isArray(body.data) ? body.data : null;
      if (!data?.length) continue;
      const candles = closedCandles(data.filter((row): row is unknown[] => Array.isArray(row) && row[8] === '1')
        .map(row => [Number(row[0]), row[1], row[2], row[3], row[4], row[5], Number(row[0]) + duration - 1]));
      if (candles.length && candles[0].openTime <= startTime + duration) return candles.filter(candle => candle.openTime >= startTime);
    }
  }
  return null;
}

/** Closed candles whose open time is at or after startTime. Binance first, OKX as a fallback. */
export async function fetchCandlesSince(symbol: string, interval: string, startTime: number): Promise<Candle[] | null> {
  return (await binanceSince(symbol, interval, startTime)) ?? (await okxSince(symbol, interval, startTime));
}

async function fineResolution(item: PlanItem, window: { from: number; to: number }): Promise<Resolution | null> {
  const finer = FINER_TIMEFRAME[item.timeframe];
  if (!finer) return null;
  const candles = await fetchCandlesSince(item.symbol, finer, window.from);
  if (!candles) return null;
  const inside = candles.filter(candle => candle.openTime >= window.from && candle.closeTime <= window.to);
  const expected = Math.floor((window.to - window.from + 1) / INTERVAL_MS[finer]);
  // A partial window could hide the real order of events, so keep the conservative result instead.
  if (inside.length < expected) return null;
  return resolveWithFinerCandles(item.setup, inside);
}

/** Tracks one plan against candles that closed after the analysis, settling ambiguous candles on a finer timeframe. */
export async function trackItem(item: PlanItem, candles: Candle[], settle = true): Promise<PlanTrack> {
  const after = candles.filter(candle => candle.closeTime > item.asOf);
  const resolutions: Record<number, Resolution> = {};
  let track = trackPlan(item.setup, after, { waitCandles: item.waitCandles, resolutions });
  for (let attempt = 0; settle && attempt < 3 && track.ambiguousWindow; attempt++) {
    const window = track.ambiguousWindow;
    const resolved = await fineResolution(item, window);
    if (!resolved) break;
    resolutions[window.from] = resolved;
    track = trackPlan(item.setup, after, { waitCandles: item.waitCandles, resolutions });
  }
  // Positions that never reach TP2 or the stop are closed out of tracking after a month.
  if (!track.final && Date.now() - item.asOf > STALE_AFTER_MS && track.status !== 'WAITING_TRIGGER' && track.status !== 'WAITING_RETEST') {
    track = { ...track, final: true, closedAt: track.closedAt ?? track.lastCandleTime };
  }
  return track;
}

const iso = (value: number | null) => value === null ? null : new Date(value).toISOString();

export function toRecord(item: PlanItem, track: PlanTrack, notifiedStatus: string | null): TrackingRecord {
  return { analysis_id: item.analysisId, setup_index: item.setupIndex, user_id: item.userId, symbol: item.symbol,
    timeframe: item.timeframe, direction: item.setup.direction, status: track.status, final: track.final,
    triggered_at: iso(track.triggeredAt), filled_at: iso(track.filledAt), closed_at: iso(track.closedAt),
    tp1_at: iso(track.tp1At), tp2_at: iso(track.tp2At), r: track.r, ambiguous: track.ambiguous,
    stopped_after_tp1: track.stoppedAfterTp1, last_candle_at: iso(track.lastCandleTime), notified_status: notifiedStatus,
    checked_at: new Date().toISOString() };
}

export type RefreshResult = { records: Array<TrackingRecord & { previous_status: string | null }>; unavailable: number; deferred: number };

type Existing = { analysis_id: string; setup_index: number; status: string; final: boolean; notified_status: string | null };

async function inBatches<T>(items: T[], size: number, work: (item: T) => Promise<void>, deadline: number) {
  for (let i = 0; i < items.length && Date.now() < deadline; i += size) {
    await Promise.all(items.slice(i, i + size).map(work));
  }
}

/**
 * Recomputes tracking for the given analyses and stores it. Final plans are skipped. Work stops when the time
 * budget is used up; the remaining plans are reported as `deferred` and picked up by the next call.
 */
export async function refreshPlanTracking(admin: SupabaseClient, rows: AnalysisRow[],
  options: { budgetMs?: number; maxGroups?: number } = {}): Promise<RefreshResult> {
  const deadline = Date.now() + (options.budgetMs ?? 8000);
  const items = rows.flatMap(planItemsFor);
  const result: RefreshResult = { records: [], unavailable: 0, deferred: 0 };
  if (!items.length) return result;
  const { data: existingRows } = await admin.from('plan_tracking').select('analysis_id,setup_index,status,final,notified_status')
    .in('analysis_id', [...new Set(items.map(item => item.analysisId))]);
  const existing = new Map((existingRows as Existing[] | null ?? []).map(row => [`${row.analysis_id}:${row.setup_index}`, row]));
  const pending = items.filter(item => !existing.get(`${item.analysisId}:${item.setupIndex}`)?.final);
  const groups = new Map<string, PlanItem[]>();
  for (const item of pending) {
    const key = `${item.symbol}|${item.timeframe}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const entries = [...groups.entries()];
  const allowed = entries.slice(0, options.maxGroups ?? 16);
  const records: RefreshResult['records'] = [];
  await inBatches(allowed, 4, async ([key, list]) => {
    const [symbol, timeframe] = key.split('|');
    const duration = TIMEFRAME_MILLIS[timeframe as CandleTimeframe];
    const start = Math.min(...list.map(item => item.asOf)) - duration;
    const candles = await fetchCandlesSince(symbol, timeframe, start);
    if (!candles) { result.unavailable += list.length; return; }
    for (const item of list) {
      const prior = existing.get(`${item.analysisId}:${item.setupIndex}`);
      const track = await trackItem(item, candles);
      records.push({ ...toRecord(item, track, prior?.notified_status ?? null), previous_status: prior?.status ?? null });
    }
  }, deadline);
  const handled = new Set(records.map(record => `${record.analysis_id}:${record.setup_index}`));
  const notHandled = pending.filter(item => !handled.has(`${item.analysisId}:${item.setupIndex}`)).length;
  result.deferred = Math.max(0, notHandled - result.unavailable);
  if (records.length) {
    // notified_status is only written by the alert job, so it is left out of the update.
    const payload = records.map(record => {
      const copy: Record<string, unknown> = { ...record };
      delete copy.previous_status; delete copy.notified_status;
      return copy;
    });
    const { error } = await admin.from('plan_tracking').upsert(payload, { onConflict: 'analysis_id,setup_index' });
    if (error) console.error('Plan tracking save failed', error);
  }
  result.records = records;
  return result;
}
