import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { runPlanAlerts } from '@/lib/alerts-service';

/**
 * POST /api/cron/plan-alerts
 * Updates plan tracking and sends e-mail alerts (plan status, plan expiry H-7, low tokens).
 * Protected by the CRON_SECRET header, like the feedback housekeeping job. Called hourly by
 * netlify/functions/plan-alerts.mjs, which repeats the call while `remaining` is true.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return provided.length > 0 && provided === secret;
}

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ success: false, message: 'CRON_SECRET is not configured on the server.' }, { status: 500 });
  if (!isAuthorized(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ success: false, message: 'Database is not configured.' }, { status: 500 });
  try {
    return NextResponse.json({ success: true, ...(await runPlanAlerts(admin, { budgetMs: 8000 })) });
  } catch (error) {
    console.error('Plan alerts failed', error);
    return NextResponse.json({ success: false, message: 'Plan alerts failed.' }, { status: 500 });
  }
}
