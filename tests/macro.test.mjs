import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './fixtures/load-ts.mjs';

const macro = loadTs('lib/macro.ts');
const day = 86400;

test('stablecoin and TVL series are parsed defensively and changes computed', () => {
  const rows = Array.from({ length: 40 }, (_, i) => ({ date: String(1_700_000_000 + i * day), totalCirculatingUSD: { peggedUSD: 100 + i } }));
  const series = macro.parseStablecoinSupply(rows);
  assert.equal(series.latest, 139); assert.equal(series.change7dPct, Math.round((139 / 132 - 1) * 10000) / 100);
  assert.equal(macro.parseStablecoinSupply({}), null); assert.equal(macro.parseStablecoinSupply([{ date: 'x' }]), null);
  assert.equal(macro.parseTvl([{ date: 1_700_000_000, tvl: 5 }, { date: 1_700_086_400, tvl: 6 }]).latest, 6);
  assert.equal(macro.parseTvl(null), null);
});

test('Indodax tickers and the IDR premium', () => {
  const tickers = macro.parseIndodaxTickers({ tickers: { btc_idr: { last: '1600000000' }, usdt_idr: { last: '16000' }, bad_idr: { last: 'x' } } });
  assert.deepEqual(Object.keys(tickers).sort(), ['btc_idr', 'usdt_idr']);
  const premium = macro.idrPremium('BTC', tickers, 100_000);
  assert.equal(premium.premiumPct, 0);
  assert.equal(macro.idrPremium('BTC', tickers, 98_000).premiumPct, 2.04);
  assert.equal(macro.idrPremium('ETH', tickers, 3000), null);
  assert.deepEqual(macro.parseIndodaxTickers(null), {});
});

test('macro route fails soft and validates kind', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, json: async () => null });
  try {
    const { GET } = loadTs('app/api/market/macro/route.ts');
    const req = (q) => new Request(`http://localhost/api/market/macro?kind=${q}`, { headers: { 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}` } });
    for (const kind of ['stable', 'tvl', 'idr']) assert.deepEqual(await (await GET(req(kind))).json(), { available: false });
    assert.equal((await GET(req('nope'))).status, 400);
    globalThis.fetch = async (url) => String(url).includes('indodax') ? { ok: true, json: async () => ({ tickers: { btc_idr: { last: '1600000000' }, usdt_idr: { last: '16000' } } }) }
      : { ok: true, json: async () => ({ price: '100000' }) };
    const body = await (await GET(req('idr'))).json();
    assert.equal(body.available, true); assert.equal(body.rows[0].symbol, 'BTC'); assert.equal(body.rows[0].premiumPct, 0);
  } finally { globalThis.fetch = original; }
});
