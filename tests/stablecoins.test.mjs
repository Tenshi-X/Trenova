import test from 'node:test';
import assert from 'node:assert/strict';
import { isStablecoin, STABLECOIN_SYMBOLS } from '../src/lib/analysis/core.ts';

test('stablecoins are recognised regardless of case and spacing, other coins are not', () => {
  for (const symbol of ['USDT', 'usdc', ' dai ', 'FDUSD', 'PyUSD', 'USDe']) assert.equal(isStablecoin(symbol), true, symbol);
  for (const symbol of ['BTC', 'ETH', 'SOL', 'USDC2X', 'PAXG', 'XAUT', '']) assert.equal(isStablecoin(symbol), false, symbol);
  assert.equal(new Set(STABLECOIN_SYMBOLS).size, STABLECOIN_SYMBOLS.length);
  assert.ok(STABLECOIN_SYMBOLS.every(symbol => symbol === symbol.toUpperCase()));
});
