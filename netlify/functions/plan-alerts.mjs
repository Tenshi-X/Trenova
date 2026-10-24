/**
 * Netlify Scheduled Function — alert email rencana trading (hourly).
 *
 * Hanya pemicu: logika ada di src/lib/alerts-service.ts, diakses lewat
 * POST /api/cron/plan-alerts (header x-cron-secret). Setiap panggilan dibatasi
 * waktu, jadi fungsi ini mengulang selama server melaporkan masih ada pekerjaan.
 *
 * Env yang dibutuhkan: CRON_SECRET, EMAIL_USER, EMAIL_APP_PASSWORD.
 */

const MAX_ROUNDS = 4;

async function runPlanAlerts() {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!siteUrl || !secret) {
    const message = 'Missing site URL or CRON_SECRET — plan alerts skipped.';
    console.error(message);
    return new Response(message, { status: 500 });
  }
  let last = { status: 200, text: '' };
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const response = await fetch(`${siteUrl}/api/cron/plan-alerts`, { method: 'POST', headers: { 'x-cron-secret': secret } });
    const text = await response.text();
    console.log(`Plan alerts round ${round} → HTTP ${response.status} ${text}`);
    last = { status: response.status, text };
    if (!response.ok) break;
    let remaining = false;
    try { remaining = JSON.parse(text).remaining === true; } catch { /* not JSON: stop */ }
    if (!remaining) break;
  }
  return new Response(last.text, { status: last.status, headers: { 'content-type': 'application/json' } });
}

export default runPlanAlerts;

export const config = {
  schedule: '@hourly',
};
