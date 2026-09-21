import { NextResponse } from 'next/server';
import { runFeedbackHousekeeping } from '@/lib/feedback-housekeeping';

/**
 * POST /api/cron/feedback-housekeeping
 *
 * Membersihkan lampiran gambar feedback yang sudah lewat masa simpan
 * (+ file yatim di Storage).
 *
 * Proteksi: header `x-cron-secret` (atau `Authorization: Bearer <secret>`)
 * harus sama dengan env CRON_SECRET. Jadwal bulanan dipanggil oleh
 * netlify/functions/feedback-housekeeping.mjs.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers.get('x-cron-secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const provided = headerSecret || bearer || '';

  return provided.length > 0 && provided === secret;
}

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, message: 'CRON_SECRET is not configured on the server.' },
      { status: 500 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const outcome = await runFeedbackHousekeeping();

  if (!outcome.success) {
    return NextResponse.json(
      { success: false, message: outcome.error || 'Housekeeping failed' },
      { status: 500 }
    );
  }

  console.log('Feedback housekeeping completed:', outcome.result);
  return NextResponse.json({ success: true, message: 'Housekeeping completed', result: outcome.result });
}
