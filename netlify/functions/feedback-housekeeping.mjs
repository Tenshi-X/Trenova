/**
 * Netlify Scheduled Function — housekeeping feedback bulanan.
 *
 * Fungsi ini hanya "pemicu": seluruh logika tetap di
 * src/lib/feedback-housekeeping.ts yang diakses via endpoint internal
 * POST /api/cron/feedback-housekeeping (diproteksi header x-cron-secret).
 *
 * Env yang dibutuhkan: CRON_SECRET.
 * URL situs disediakan otomatis oleh Netlify (process.env.URL).
 */

async function runFeedbackHousekeeping() {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    const message = 'Missing site URL or CRON_SECRET — feedback housekeeping skipped.';
    console.error(message);
    return new Response(message, { status: 500 });
  }

  const response = await fetch(`${siteUrl}/api/cron/feedback-housekeeping`, {
    method: 'POST',
    headers: { 'x-cron-secret': secret },
  });

  const body = await response.text();
  console.log(`Feedback housekeeping → HTTP ${response.status} ${body}`);

  return new Response(body, {
    status: response.status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Setiap tanggal 1, pukul 00:00 UTC.
 */
export default runFeedbackHousekeeping;

export const config = {
  schedule: '@monthly',
};