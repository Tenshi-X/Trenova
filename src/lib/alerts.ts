import type { PlanStatus } from './analysis/tracking';

// Pure rules and wording for the e-mail alerts: which status changes are worth an e-mail, when a reminder is due,
// and the text of each e-mail. No I/O here, so every rule can be tested.

const RANK: Record<PlanStatus, number> = { WAITING_TRIGGER: 0, WAITING_RETEST: 1, FILLED: 2, TP1: 3, TP2: 4, SL: 4, CANCELLED: 4, EXPIRED: 4 };
export const BACKLOG_MS = 3 * 3_600_000;
export const EXPIRY_WARNING_DAYS = 7;
export const LOW_QUOTA_THRESHOLD = 3;

export type AlertRow = {
  analysis_id: string; setup_index: number; user_id: string; symbol: string; timeframe: string; direction: 'LONG' | 'SHORT';
  status: PlanStatus; notified_status: string | null; r: number | null;
  triggered_at: string | null; filled_at: string | null; closed_at: string | null; created_at: string;
};

const isStatus = (value: unknown): value is PlanStatus => typeof value === 'string' && value in RANK;

/** 'send' = e-mail it, 'silent' = old news (mark it as handled without e-mail), 'skip' = nothing new. */
export function alertDecision(row: AlertRow): 'send' | 'silent' | 'skip' {
  if (row.status === 'WAITING_TRIGGER') return 'skip';
  const previous = isStatus(row.notified_status) ? RANK[row.notified_status] : -1;
  if (RANK[row.status] <= previous && row.notified_status !== null) return 'skip';
  if (row.notified_status === row.status) return 'skip';
  if (row.notified_status === null) {
    // A plan first seen long after its event (the very first run, or a plan nobody opened) should not produce a stale e-mail.
    const eventAt = Date.parse(row.closed_at ?? row.filled_at ?? row.triggered_at ?? row.created_at);
    if (Number.isFinite(eventAt) && Date.parse(row.created_at) - eventAt > BACKLOG_MS) return 'silent';
  }
  return 'send';
}

export function expiryDue(subscriptionEndAt: string | null, markerFor: string | null, now = Date.now()): boolean {
  if (!subscriptionEndAt) return false;
  const end = Date.parse(subscriptionEndAt);
  if (!Number.isFinite(end) || end <= now || end - now > EXPIRY_WARNING_DAYS * 86_400_000) return false;
  return !(markerFor && Date.parse(markerFor) === end);
}

/** `reset` = quota is healthy again, so the "already reminded" marker should be cleared. */
export function lowQuotaState(limit: number | null, used: number | null, markerLimit: number | null): 'send' | 'reset' | 'skip' {
  const cap = limit ?? 0;
  if (cap <= 0) return 'skip';
  const remaining = cap - (used ?? 0);
  if (remaining > LOW_QUOTA_THRESHOLD) return markerLimit === null ? 'skip' : 'reset';
  if (remaining < 0) return 'skip';
  return markerLimit === cap ? 'skip' : 'send';
}

const esc = (value: string) => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
const wib = (iso: string | null) => iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '';

const LINES: Record<string, (row: AlertRow) => string> = {
  WAITING_RETEST: () => 'Pemicu terpenuhi. Tunggu harga kembali (retest) ke zona entry; belum waktunya masuk.',
  FILLED: () => 'Harga menyentuh zona entry. Rencana dianggap terisi; pastikan stop loss terpasang.',
  TP1: row => `TP1 tercapai${row.r !== null ? ` (sekitar ${row.r.toFixed(2)}R jika seluruh posisi keluar di TP1)` : ''}.`,
  TP2: () => 'TP2 tercapai.',
  SL: () => 'Stop loss tersentuh. Rencana gagal (-1R).',
  CANCELLED: () => 'Rencana batal karena syarat pembatalan terjadi sebelum entry.',
  EXPIRED: () => 'Rencana kedaluwarsa tanpa terisi.',
};
const TIME_OF: Record<string, (row: AlertRow) => string | null> = {
  WAITING_RETEST: row => row.triggered_at, FILLED: row => row.filled_at, TP1: row => row.closed_at ?? row.filled_at,
  TP2: row => row.closed_at, SL: row => row.closed_at, CANCELLED: row => row.closed_at, EXPIRED: row => row.closed_at,
};

export function buildPlanDigest(rows: AlertRow[], siteUrl: string): { subject: string; html: string } {
  const items = rows.map(row => {
    const text = (LINES[row.status] ?? (() => row.status))(row);
    const time = wib((TIME_OF[row.status] ?? (() => null))(row));
    return `<li style="margin-bottom:8px;"><strong>${esc(row.symbol)} ${esc(row.direction)} ${esc(row.timeframe)}</strong>: ${esc(text)}${time ? ` <span style="color:#666;">(${time})</span>` : ''}</li>`;
  }).join('');
  const subject = rows.length === 1 ? `Trenova: ${rows[0].symbol} ${rows[0].direction}, status rencana berubah` : `Trenova: ${rows.length} rencana berubah status`;
  const html = `<p>Halo, ada perubahan pada rencana trading dari analisismu:</p><ul style="padding-left:18px;">${items}</ul>`
    + `<p>Status dihitung dari candle yang sudah tutup, jadi bisa tertunda dibanding harga langsung. Detail ada di <a href="${esc(siteUrl)}/dashboard/history">riwayat analisis</a>.</p>`
    + `<p style="font-size:12px;color:#666;">Ini bukan saran investasi. Matikan notifikasi ini kapan saja di halaman Preferensi.</p>`;
  return { subject, html };
}

export function buildExpiryEmail(endAt: string, siteUrl: string, now = Date.now()): { subject: string; html: string } {
  const days = Math.max(1, Math.ceil((Date.parse(endAt) - now) / 86_400_000));
  return { subject: `Trenova: masa aktif tersisa ${days} hari`,
    html: `<p>Halo, masa aktif paket Trenova-mu berakhir pada <strong>${wib(endAt)}</strong> (sekitar ${days} hari lagi).</p>`
      + `<p>Perpanjang sebelum itu agar akses analisis tidak terputus. Info paket: <a href="${esc(siteUrl)}/#pricing">${esc(siteUrl)}/#pricing</a>.</p>`
      + `<p style="font-size:12px;color:#666;">Matikan pengingat ini di halaman Preferensi.</p>` };
}

export function buildLowQuotaEmail(remaining: number, limit: number, siteUrl: string): { subject: string; html: string } {
  return { subject: `Trenova: sisa ${remaining} token analisis`,
    html: `<p>Halo, token analisismu tinggal <strong>${remaining}</strong> dari ${limit}.</p>`
      + `<p>Tambah token atau perpanjang paket di <a href="${esc(siteUrl)}/#pricing">${esc(siteUrl)}/#pricing</a>. Scanner watchlist tetap gratis dan tidak memakai token.</p>`
      + `<p style="font-size:12px;color:#666;">Matikan pengingat ini di halaman Preferensi.</p>` };
}
