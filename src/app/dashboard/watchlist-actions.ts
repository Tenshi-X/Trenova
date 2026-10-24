'use server';

import { getSessionProfile } from '@/lib/authz';
import type { PlanStatus } from '@/lib/analysis/tracking';

export type ActivePlan = { symbol: string; timeframe: string; direction: 'LONG' | 'SHORT'; status: PlanStatus; analysis_id: string };

/** The user's plans that can still change (waiting for a trigger or retest, or filled), newest first. */
export async function getActivePlans(): Promise<{ plans: ActivePlan[]; error?: string }> {
  const context = await getSessionProfile();
  if (!context) return { plans: [], error: 'Silakan masuk kembali.' };
  const { data, error } = await context.admin.from('plan_tracking')
    .select('analysis_id,symbol,timeframe,direction,status')
    .eq('user_id', context.user.id).eq('final', false).order('created_at', { ascending: false }).limit(60);
  return error ? { plans: [], error: 'Status rencana belum dapat dimuat.' } : { plans: (data ?? []) as ActivePlan[] };
}
