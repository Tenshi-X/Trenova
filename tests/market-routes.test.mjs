import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './fixtures/load-ts.mjs';

const get = (path) => new Request(`http://localhost${path}`, { headers: { 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` } });
const jsonResponse = (data, ok = true) => ({ ok, json: async () => data });

function withFetch(handler, action) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => handler(String(url));
  return Promise.resolve(action()).finally(() => { globalThis.fetch = original; });
}

test('depth route returns a sorted book from Binance and rejects bad symbols', () => withFetch(
  (url) => url.includes('/api/v3/depth') ? jsonResponse({ bids: [['99', '2'], ['99.5', '1']], asks: [['100', '3'], ['101', '1']] }) : jsonResponse(null, false),
  async () => {
    const { GET } = loadTs('app/api/market/depth/route.ts');
    const ok = await GET(get('/api/market/depth?symbol=btcusdt'));
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.symbol, 'BTC'); assert.equal(body.source, 'binance'); assert.equal(body.bids[0].price, 99.5);
    assert.equal((await GET(get('/api/market/depth?symbol=../etc'))).status, 400);
    assert.equal((await GET(get('/api/market/depth'))).status, 400);
  }));

test('depth route falls back to OKX and reports 404 when no provider has the pair', async () => {
  await withFetch((url) => url.includes('okx.com') ? jsonResponse({ code: '0', data: [{ bids: [['9', '1', '0', '1']], asks: [['10', '1', '0', '1']] }] }) : jsonResponse(null, false), async () => {
    const { GET } = loadTs('app/api/market/depth/route.ts');
    const response = await GET(get('/api/market/depth?symbol=NEWCOIN'));
    assert.equal((await response.json()).source, 'okx');
  });
  await withFetch(() => jsonResponse(null, false), async () => {
    const { GET } = loadTs('app/api/market/depth/route.ts');
    assert.equal((await GET(get('/api/market/depth?symbol=NOPE'))).status, 404);
  });
});

test('trades route maps buyer-maker rows to sells, newest first, with OKX fallback', async () => {
  await withFetch((url) => url.includes('aggTrades') ? jsonResponse([{ a: 1, p: '100', q: '1', T: 1000, m: false }, { a: 2, p: '101', q: '2', T: 2000, m: true }]) : jsonResponse(null, false), async () => {
    const { GET } = loadTs('app/api/market/trades/route.ts');
    const body = await (await GET(get('/api/market/trades?symbol=ETH'))).json();
    assert.deepEqual(body.trades.map(t => [t.id, t.side]), [['2', 'sell'], ['1', 'buy']]);
  });
  await withFetch((url) => url.includes('okx.com') ? jsonResponse({ data: [{ tradeId: 'x', px: '5', sz: '2', side: 'buy', ts: '10' }, { tradeId: 'bad', px: '0', sz: '1', side: 'buy', ts: '9' }] }) : jsonResponse(null, false), async () => {
    const { GET } = loadTs('app/api/market/trades/route.ts');
    const body = await (await GET(get('/api/market/trades?symbol=ZZZ'))).json();
    assert.equal(body.source, 'okx'); assert.equal(body.trades.length, 1);
  });
});

test('derivatives route reports which series are available and caches successful answers', async () => {
  let calls = 0;
  await withFetch((url) => {
    calls++;
    if (url.includes('fundingRate')) return jsonResponse([{ fundingRate: '0.0001', fundingTime: 1000 }]);
    if (url.includes('openInterestHist')) return jsonResponse([{ sumOpenInterestValue: '500', timestamp: 1000 }]);
    return jsonResponse(null, false);
  }, async () => {
    const { GET } = loadTs('app/api/market/derivs/route.ts');
    const body = await (await GET(get('/api/market/derivs?symbol=SOL&period=1h'))).json();
    assert.deepEqual(body.available, { funding: true, openInterest: true, longShort: false, taker: false });
    assert.equal(body.fundingSource, 'binance');
    const before = calls;
    await GET(get('/api/market/derivs?symbol=SOL&period=1h'));
    assert.equal(calls, before); // served from cache
    const odd = await (await GET(get('/api/market/derivs?symbol=SOL&period=weird'))).json();
    assert.equal(odd.period, '1h');
  });
});

test('public market routes rate-limit a single client', async () => {
  await withFetch(() => jsonResponse(null, false), async () => {
    const { GET } = loadTs('app/api/market/derivs/route.ts');
    const request = () => new Request('http://localhost/api/market/derivs?symbol=BTC', { headers: { 'x-forwarded-for': '203.0.113.9' } });
    let limitedAt = null;
    for (let i = 1; i <= 40; i++) { if ((await GET(request())).status === 429) { limitedAt = i; break; } }
    assert.ok(limitedAt && limitedAt <= 31, `limited at ${limitedAt}`);
  });
});
