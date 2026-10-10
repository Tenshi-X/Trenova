import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as core from '../src/lib/analysis/core.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/analysis/market.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function marketModule({ primaryBlocked = false, allBlocked = false, stale = false, missingCandle = false } = {}) {
  const urls = [];
  const warnings = [];
  const now = Date.now();
  const mockFetch = async url => {
    urls.push(url);
    const parsed = new URL(url);
    if (allBlocked || (primaryBlocked && parsed.host === 'data-api.binance.vision')) {
      return Response.json({ code: 0, msg: 'Unavailable' }, { status: 451 });
    }
    if (parsed.pathname === '/api/v3/ticker/24hr') {
      return Response.json({ lastPrice: '100', closeTime: now - (stale ? 600000 : 1000),
        priceChangePercent: '2', quoteVolume: '1000000' });
    }
    if (parsed.pathname === '/api/v3/klines') {
      const duration = core.TIMEFRAME_MILLIS[parsed.searchParams.get('interval')];
      const currentOpen = Math.floor(now / duration) * duration;
      const rows = Array.from({ length: 60 }, (_, i) => {
        const open = currentOpen - (59 - i) * duration;
        return [open, '99', '102', '98', '100', '10', open + duration - 1];
      });
      // Include the current unfinished candle, as Binance does in a real response.
      if (missingCandle) rows.splice(40, 1);
      return Response.json(rows);
    }
    // Optional derivatives and sentiment can be unavailable without blocking the analysis.
    return Response.json({ error: 'Unavailable' }, { status: 503 });
  };
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'console', compiled)(
    name => name === './core' ? core : require(name), compiledModule, compiledModule.exports,
    mockFetch, { warn: (...args) => warnings.push(args) });
  return { ...compiledModule.exports, urls, warnings };
}

test('BTC BNB XRP work on the public-data host for every supported timeframe', async () => {
  for (const symbol of ['BTC', 'BNB', 'XRP']) {
    for (const timeframe of core.TIMEFRAMES) {
      const provider = marketModule();
      const snapshot = await provider.getMarketSnapshot(symbol, timeframe);
      assert.ok(snapshot, `${symbol} ${timeframe}`);
      assert.equal(snapshot.symbol, symbol);
      assert.equal(snapshot.timeframe, timeframe);
      assert.equal(snapshot.price, 100);
      assert.ok(snapshot.recentCandles.every(candle => candle.closeTime <= Date.now()));
      assert.equal(snapshot.fundingRate, null);
      assert.equal(snapshot.openInterestUsd, null);
      assert.equal(snapshot.fearGreed, null);
      assert.ok(provider.urls.filter(url => new URL(url).pathname.startsWith('/api/v3/'))
        .every(url => new URL(url).host === 'data-api.binance.vision'));
      assert.ok(provider.urls.some(url => url.includes(`symbol=${symbol}USDT&interval=${timeframe}`)));
      assert.deepEqual(provider.warnings, []);
    }
  }
});

test('general API fallback works when the dedicated public host is temporarily unavailable', async () => {
  const provider = marketModule({ primaryBlocked: true });
  assert.ok(await provider.getMarketSnapshot('BTC', '1d'));
  assert.ok(provider.urls.some(url => new URL(url).host === 'api.binance.com'));
});

test('stale prices and gaps in candles are still rejected', async () => {
  for (const options of [{ stale: true }, { missingCandle: true }]) {
    const provider = marketModule(options);
    assert.equal(await provider.getMarketSnapshot('BTC', '1d'), null);
  }
});

test('provider outages return no snapshot and record diagnostics instead of making up data', async () => {
  const provider = marketModule({ allBlocked: true });
  assert.equal(await provider.getMarketSnapshot('BTC', '1d'), null);
  assert.equal(provider.warnings.length, 1);
  assert.deepEqual(provider.warnings[0][1], {
    symbol: 'BTC', timeframe: '1d', tickerAvailable: false, candlesAvailable: false,
  });
});

test('confirmation supports higher timeframes including weekly and only uses complete closed candles', async () => {
  for (const timeframe of [...new Set(Object.values(core.CONFIRMATION_TIMEFRAME))]) {
    const provider = marketModule();
    const confirmation = await provider.getTrendConfirmation('BTC', timeframe);
    assert.ok(confirmation); assert.equal(confirmation.timeframe, timeframe);
    assert.equal(confirmation.trend, 'neutral');
    assert.ok(new Date(confirmation.asOf).getTime() <= Date.now());
  }
  for (const options of [{ missingCandle: true }, { allBlocked: true }]) {
    assert.equal(await marketModule(options).getTrendConfirmation('BTC', '4h'), null);
  }
});
