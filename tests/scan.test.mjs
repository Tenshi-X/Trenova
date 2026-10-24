import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './fixtures/load-ts.mjs';
import { technicalMarket } from './fixtures/analysis.mjs';
import { rankScan, toScanRow, isScanRow } from '../src/lib/scan.ts';

const row = (symbol, status, score, distance = 1) => ({ symbol, price: 1, change24h: 0, rsi: 50, trend: 'bullish', direction: 'LONG', entryType: 'PULLBACK',
  score, grade: 'MEDIUM', status, entryLow: 1, entryHigh: 1, stopLoss: 1, takeProfit1: 2, riskReward: 2, distanceToEntryPct: distance });

test('ranking puts READY first, then score, then the nearer entry, and failures last', () => {
  const input = [{ symbol: 'ERR', error: 'no_data' }, row('B', 'WATCH', 90), row('A', 'READY', 60), row('C', 'READY', 75), row('D', 'READY', 75, 0.2), row('E', 'NO_TRADE', 99)];
  const ranked = rankScan(input);
  assert.deepEqual(ranked.map(item => item.symbol), ['D', 'C', 'A', 'B', 'E', 'ERR']);
  assert.equal(input[0].symbol, 'ERR'); // input untouched
  assert.equal(isScanRow(ranked[0]), true);
  assert.equal(isScanRow(ranked[5]), false);
});

const { buildTechnicalAnalysis } = loadTs('lib/analysis/report.ts');
const core = loadTs('lib/analysis/core.ts');
const input = core.parseAnalysisInput({ requestKey: '11111111-1111-4111-8111-111111111111', symbol: 'BTC', language: 'id', tradingStyle: 'intraday',
  timeframe: '1h', riskTolerance: 'Medium Risk', strategyFocus: 'All-Round', indicatorPref: 'Default', targetRR: '1:2' });

test('a technical report becomes a scored scan row with a computed reward/risk', () => {
  const report = buildTechnicalAnalysis(input, { ...technicalMarket });
  const out = toScanRow(report, { ...technicalMarket });
  assert.ok(out);
  assert.equal(out.symbol, 'BTC');
  assert.ok(out.score >= 0 && out.score <= 100);
  assert.ok(['READY', 'WATCH', 'NO_TRADE'].includes(out.status));
  assert.ok(out.riskReward > 0);
  assert.equal(toScanRow({ ...report, setups: [] }, technicalMarket), null);
});

const rows = (market, { loggedIn = true, active = true } = {}) => loadTs('app/api/dashboard/scan/route.ts', { overrides: {
  '@/lib/authz': { getSessionProfile: async () => loggedIn ? { user: { id: `scan-user-${Math.random()}` }, profile: { role: 'user',
    subscription_end_at: new Date(Date.now() + (active ? 86400000 : -86400000)).toISOString() }, admin: {} } : null,
    isActiveSubscriber: (profile) => new Date(profile.subscription_end_at) > new Date() },
  '@/lib/analysis/market': { getMarketSnapshot: async (symbol) => market(symbol) },
} }).GET;

const call = (GET, query) => GET(new Request(`http://localhost/api/dashboard/scan?${query}`));

test('scan route requires an active session, skips stablecoins and reports coins without data', async () => {
  const market = (symbol) => symbol === 'NODATA' ? null : { ...technicalMarket, symbol };
  assert.equal((await call(rows(market, { loggedIn: false }), 'symbols=BTC')).status, 401);
  assert.equal((await call(rows(market, { active: false }), 'symbols=BTC')).status, 403);
  const GET = rows(market);
  assert.equal((await call(GET, 'symbols=USDT,usdc')).status, 400);
  assert.equal((await call(GET, 'symbols=')).status, 400);
  const response = await call(GET, 'symbols=BTC,ETH,NODATA,USDT,BTC,../x,A1,B2,C3,D4&tf=1h');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.results.length, 5); // de-duplicated, invalid and stablecoin removed, capped at five
  assert.equal(body.results.find(item => item.symbol === 'NODATA').error, 'no_data');
  assert.ok(body.results.find(item => item.symbol === 'BTC').score >= 0);
  assert.equal(body.timeframe, '1h');
  const odd = await (await call(GET, 'symbols=BTC&tf=weird&rr=9:9')).json();
  assert.equal(odd.timeframe, '4h'); assert.equal(odd.targetRR, '1:2');
});
