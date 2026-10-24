'use server';

import { getAdminContext } from '@/lib/authz';
import type { MacroEvent } from '@/lib/macro';

type Result = { success: boolean; error?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function adminListMacroEvents(): Promise<{ success: boolean; events: MacroEvent[]; error?: string }> {
  const admin = await getAdminContext();
  if (!admin) return { success: false, events: [], error: 'Akses ditolak.' };
  const { data, error } = await admin.admin.from('macro_events')
    .select('id,event_at,title,importance,region,note').order('event_at', { ascending: false }).limit(100);
  return error ? { success: false, events: [], error: error.message } : { success: true, events: (data ?? []) as MacroEvent[] };
}

/** eventAtIso must already be UTC (the form converts from WIB). */
export async function createMacroEvent(input: { eventAtIso: string; title: string; importance: number; region: string; note: string }): Promise<Result> {
  const admin = await getAdminContext();
  if (!admin) return { success: false, error: 'Akses ditolak.' };
  const when = new Date(input.eventAtIso);
  const title = String(input.title ?? '').trim(); const region = String(input.region ?? '').trim() || 'US'; const note = String(input.note ?? '').trim();
  if (Number.isNaN(when.getTime())) return { success: false, error: 'Waktu tidak valid.' };
  if (title.length < 2 || title.length > 140) return { success: false, error: 'Judul 2–140 karakter.' };
  if (region.length > 20) return { success: false, error: 'Wilayah maksimal 20 karakter.' };
  if (note.length > 400) return { success: false, error: 'Catatan maksimal 400 karakter.' };
  if (![1, 2, 3].includes(input.importance)) return { success: false, error: 'Tingkat penting 1–3.' };
  const { error } = await admin.admin.from('macro_events').insert({ event_at: when.toISOString(), title, importance: input.importance, region, note: note || null, created_by: admin.user.id });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteMacroEvent(id: string): Promise<Result> {
  const admin = await getAdminContext();
  if (!admin) return { success: false, error: 'Akses ditolak.' };
  if (!UUID.test(id)) return { success: false, error: 'ID tidak valid.' };
  const { error } = await admin.admin.from('macro_events').delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}
