import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/market-derivatives.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', compiled)(mod.exports, require, mod);
const lib = mod.exports;

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

const okxOi = { code: '0', data: [
  { instId: 'BTC-USDT-SWAP', oiUsd: '5100000000' },
  { instId: 'ETH-USDT-SWAP', oiUsd: '2900000000' },
  { instId: 'BTC-USD-SWAP', oiUsd: '999' },
  { instId: 'SOL-USDT-SWAP', oiUsd: '' },
] };
const okxFunding = { code: '0', data: [
  { instId: 'BTC-USDT-SWAP', fundingRate: '0.0001' },
  { instId: 'ETH-USDT-SWAP', fundingRate: '-0.00005' },
] };
const bybit = { retCode: 0, result: { list: [
  { symbol: 'BTCUSDT', fundingRate: '0.0003', openInterestValue: '4000000000' },
  { symbol: 'SOLUSDT', fundingRate: '0.0002', openInterestValue: '600000000' },
  { symbol: 'XRPUSDT', fundingRate: '', openInterestValue: '' },
  { symbol: 'BTC-26DEC25', fundingRate: '', openInterestValue: '1' },
] } };
const binance = [
  { symbol: 'BTCUSDT', lastFundingRate: '0.00005' },
  { symbol: 'DOGEUSDT', lastFundingRate: '0.0001' },
];

function router(routes) {
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    const host = new URL(url).host;
    const body = routes[host] ?? routes[url];
    if (body === undefined) return Response.json({ error: 'blocked' }, { status: 403 });
    const path = new URL(url).pathname;
    const value = typeof body === 'function' ? body(path) : body;
    return value === null ? Response.json({ error: 'blocked' }, { status: 451 }) : Response.json(value);
  };
  return { fetcher, calls };
}

const okxBody = path => path.includes('open-interest') ? okxOi : okxFunding;

test('OKX parsers keep only USDT swaps and convert funding to percent', () => {
  const oi = lib.parseOkxOpenInterest(okxOi);
  assert.deepEqual([...oi.keys()].sort(), ['BTC', 'ETH']);
  assert.equal(oi.get('BTC'), 5100000000);
  const funding = lib.parseOkxFunding(okxFunding);
  near(funding.get('BTC'), 0.01);
  near(funding.get('ETH'), -0.005);
  assert.equal(lib.parseOkxFunding({ code: '51000', data: okxFunding.data }).size, 0);
  assert.equal(lib.parseOkxOpenInterest(null).size, 0);
});

test('Bybit parser ignores empty values and non-USDT contracts', () => {
  const parsed = lib.parseBybitTickers(bybit);
  assert.deepEqual([...parsed.funding.keys()].sort(), ['BTC', 'SOL']);
  assert.deepEqual([...parsed.openInterest.keys()].sort(), ['BTC', 'SOL']);
  near(parsed.funding.get('BTC'), 0.03);
  assert.equal(lib.parseBybitTickers({ retCode: 10001, result: bybit.result }).funding.size, 0);
});

test('Binance and CoinGecko parsers', () => {
  near(lib.parseBinancePremiumIndex(binance).get('DOGE'), 0.01);
  assert.equal(lib.parseBinancePremiumIndex({ code: -1 }).size, 0);
  const caps = lib.parseCoinGeckoMarketCaps([
    { symbol: 'btc', market_cap: 1.6e12 }, { symbol: 'btc', market_cap: 5 }, { symbol: 'zzz', market_cap: null },
  ]);
  assert.equal(caps.get('BTC'), 1.6e12);
  assert.equal(caps.has('ZZZ'), false);
});

test('merge combines exchanges: funding mean, OI and volume summed, one row per coin', () => {
  const snapshot = lib.mergeProviders([
    { source: 'binance', funding: lib.parseBinancePremiumIndex(binance), openInterest: new Map() },
    { source: 'bybit', ...lib.parseBybitTickers(bybit) },
    { source: 'okx', funding: lib.parseOkxFunding(okxFunding), openInterest: lib.parseOkxOpenInterest(okxOi) },
  ]);
  const btc = snapshot.map.get('BTC');
  near(btc.fundingRate, (0.01 + 0.03 + 0.005) / 3);         // mean of OKX, Bybit, Binance
  assert.equal(btc.openInterestUsd, 5100000000 + 4000000000); // OKX + Bybit (Binance has no bulk OI)
  assert.equal(btc.exchanges, 3);
  assert.deepEqual(Object.keys(btc.perExchange).sort(), ['binance', 'bybit', 'okx']);
  assert.equal(snapshot.map.get('SOL').openInterestUsd, 600000000); // only Bybit has SOL
  assert.equal(snapshot.map.get('SOL').exchanges, 1);
  near(snapshot.map.get('DOGE').fundingRate, 0.01); // only Binance has DOGE
  assert.equal(snapshot.map.get('DOGE').openInterestUsd, null);
  assert.deepEqual(snapshot.providers.map(p => p.source), ['okx', 'bybit', 'binance']);
  assert.equal(lib.mergeProviders([]), null);
});

test('Bitget, Gate and MEXC parsers (shapes taken from the live APIs)', () => {
  const bitget = lib.parseBitgetTickers({ code: '00000', data: [
    { symbol: 'BTCUSDT', lastPr: '83969.2', markPrice: '83969.2', fundingRate: '0.000022', holdingAmount: '33124.889', usdtVolume: '1495572652.07' },
    { symbol: 'ETHUSDT', lastPr: '2562.78', markPrice: '2562.78', fundingRate: '-0.000008', holdingAmount: '769716.58', usdtVolume: '1213541660.42' },
    { symbol: 'BTCUSD', fundingRate: '1' },
  ] });
  near(bitget.funding.get('BTC'), 0.0022);
  near(bitget.openInterest.get('BTC'), 33124.889 * 83969.2);
  assert.equal(bitget.volume.get('ETH'), 1213541660.42);
  assert.equal(bitget.funding.has('BTCUSD'), false);
  assert.equal(lib.parseBitgetTickers({ code: '40001' }).funding.size, 0);

  const gate = lib.parseGateTickers([
    { contract: 'BTC_USDT', funding_rate: '0.0001', total_size: '5000000', quanto_multiplier: '0.0001', mark_price: '84000', volume_24h_quote: '2000000000' },
    { contract: 'GP_USDT', funding_rate: '0.00005', total_size: '346258', quanto_multiplier: '100', mark_price: '0.002', volume_24h_quote: '27140' },
    { contract: 'BTC_USD', funding_rate: '1' },
  ]);
  near(gate.funding.get('BTC'), 0.01);
  near(gate.openInterest.get('BTC'), 5000000 * 0.0001 * 84000);
  near(gate.openInterest.get('GP'), 346258 * 100 * 0.002);
  assert.equal(gate.volume.get('BTC'), 2000000000);

  const mexc = lib.parseMexcTickers({ success: true, code: 0, data: [
    { symbol: 'BTC_USDT', fundingRate: 0.000016, amount24: 2068388329.19, holdVol: 431514732 },
    { symbol: 'BTC_USD', fundingRate: 1 },
  ] });
  near(mexc.funding.get('BTC'), 0.0016);
  assert.equal(mexc.volume.get('BTC'), 2068388329.19);
  assert.equal(lib.parseMexcTickers({ success: false }).funding.size, 0);
});

test('Bybit turnover is exposed as volume and 1000x symbols merge into the plain coin', () => {
  const parsed = lib.parseBybitTickers({ retCode: 0, result: { list: [
    { symbol: '1000PEPEUSDT', fundingRate: '0.0001', openInterestValue: '10', turnover24h: '5' },
  ] } });
  assert.equal(parsed.volume.get('PEPE'), 5);
});

test('fetchDerivatives survives geo-blocked providers and returns null when all fail', async () => {
  const onlyBybit = router({ 'api.bybit.com': bybit });
  const snapshot = await lib.fetchDerivatives(onlyBybit.fetcher, 1000);
  assert.deepEqual(snapshot.providers.map(p => p.source), ['bybit']);
  near(snapshot.map.get('BTC').fundingRate, 0.03);

  const none = router({});
  assert.equal(await lib.fetchDerivatives(none.fetcher, 1000), null);

  const throwing = async () => { throw new Error('network down'); };
  assert.equal(await lib.fetchDerivatives(throwing, 1000), null);
});

test('getDerivatives caches for 30s and serves a stale snapshot when providers fail', async () => {
  lib.resetMarketDerivativesCache();
  const ok = router({ 'www.okx.com': okxBody });
  const first = await lib.getDerivatives(ok.fetcher);
  const callsAfterFirst = ok.calls.length;
  assert.ok(first.map.has('BTC'));
  await lib.getDerivatives(ok.fetcher);
  assert.equal(ok.calls.length, callsAfterFirst, 'second call within TTL must not refetch');

  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 60_000;
    const failing = router({});
    const stale = await lib.getDerivatives(failing.fetcher);
    assert.ok(stale && stale.map.has('BTC'), 'stale snapshot reused after TTL when providers fail');
    Date.now = () => realNow() + 10 * 60_000;
    lib.resetMarketDerivativesCache();
    assert.equal(await lib.getDerivatives(failing.fetcher), null);
  } finally {
    Date.now = realNow;
    lib.resetMarketDerivativesCache();
  }
});

test('applyDerivatives never overwrites an existing funding rate and nulls missing OI', () => {
  const snapshot = lib.mergeProviders([{ source: 'okx', funding: lib.parseOkxFunding(okxFunding), openInterest: lib.parseOkxOpenInterest(okxOi) }]);
  const coins = [
    { symbol: 'BTC', fundingRate: null },
    { symbol: 'ETH', fundingRate: 0.5 },
    { symbol: 'ADA', fundingRate: null },
  ];
  lib.applyDerivatives(coins, snapshot);
  near(coins[0].fundingRate, 0.01);
  assert.equal(coins[0].openInterestUsd, 5100000000);
  assert.equal(coins[1].fundingRate, 0.5);
  assert.equal(coins[2].fundingRate, null);
  assert.equal(coins[2].openInterestUsd, null);
  const empty = [{ symbol: 'BTC', fundingRate: null }];
  lib.applyDerivatives(empty, null);
  assert.equal(empty[0].openInterestUsd, null);
});

test('market caps are applied only when missing and cached', async () => {
  lib.resetMarketDerivativesCache();
  const cg = router({ 'api.coingecko.com': [{ symbol: 'btc', market_cap: 1.6e12 }, { symbol: 'eth', market_cap: 3e11 }] });
  const caps = await lib.getMarketCaps(cg.fetcher);
  await lib.getMarketCaps(cg.fetcher);
  assert.equal(cg.calls.length, 1);
  const coins = [{ symbol: 'BTC', fundingRate: null, marketCap: 0 }, { symbol: 'ETH', fundingRate: null, marketCap: 123 }, { symbol: 'ADA', fundingRate: null, marketCap: 0 }];
  lib.applyMarketCaps(coins, caps);
  assert.equal(coins[0].marketCap, 1.6e12);
  assert.equal(coins[1].marketCap, 123);
  assert.equal(coins[2].marketCap, 0);
  lib.applyMarketCaps(coins, null);
  lib.resetMarketDerivativesCache();
});

test('normalizeBase strips 1000x contract multipliers', () => {
  assert.equal(lib.normalizeBase('1000PEPE'), 'PEPE');
  assert.equal(lib.normalizeBase('1000000MOG'), 'MOG');
  assert.equal(lib.normalizeBase('BTC'), 'BTC');
  assert.equal(lib.normalizeBase('1000'), '1000');
});
