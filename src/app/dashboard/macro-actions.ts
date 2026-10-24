'use server';

import { getSessionProfile } from '@/lib/authz';
import type { MacroEvent } from '@/lib/macro';

/** Upcoming and just-passed macro events entered by the admin (read-only for users). */
export async function listMacroEvents(): Promise<{ events: MacroEvent[]; error?: string }> {
  const context = await getSessionProfile();
  if (!context) return { events: [], error: 'Silakan masuk kembali.' };
  const since = new Date(Date.now() - 6 * 3_600_000).toISOString();
  const { data, error } = await context.admin.from('macro_events')
    .select('id,event_at,title,importance,region,note').gte('event_at', since).order('event_at', { ascending: true }).limit(40);
  return error ? { events: [], error: 'Kalender belum dapat dimuat.' } : { events: (data ?? []) as MacroEvent[] };
}
