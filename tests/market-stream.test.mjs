import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOrderBook, bookMetrics, unwrapStream, parseAggTrade, largeTradeThreshold, parseForceOrder, pushBounded } from '../src/lib/market-stream.ts';
import { allowRequest, resetRateLimits, clientKey } from '../src/lib/rate-limit.ts';

const raw = { bids: [['99.9', '5'], ['99.8', '10'], ['99.95', '2']], asks: [['100.1', '4'], ['100.0', '1'], ['100.2', '20']] };

test('order book is sorted, validated and rejects crossed or empty books', () => {
  const book = parseOrderBook(raw);
  assert.equal(book.bids[0].price, 99.95);
  assert.equal(book.asks[0].price, 100);
  assert.equal(parseOrderBook({ bids: [], asks: [['1', '1']] }), null);
  assert.equal(parseOrderBook({ bids: [['101', '1']], asks: [['100', '1']] }), null);
  assert.equal(parseOrderBook(null), null);
  assert.equal(parseOrderBook({ bids: [['x', '1'], ['-1', '2']], asks: [['1', '0']] }), null);
});

test('book metrics: spread, cumulative size, imbalance and walls', () => {
  const metrics = bookMetrics(parseOrderBook(raw));
  assert.equal(metrics.bestBid, 99.95);
  assert.ok(Math.abs(metrics.spread - 0.05) < 1e-9);
  assert.equal(metrics.bidVolume, 17);
  assert.equal(metrics.askVolume, 25);
  assert.ok(Math.abs(metrics.imbalancePct - (17 - 25) / 42 * 100) < 1e-9);
  assert.equal(metrics.bids[2].cumulative, 17);
  assert.equal(metrics.maxCumulative, 25);
  assert.deepEqual(metrics.askWall, { price: 100.2, qty: 20 });
  assert.equal(bookMetrics(parseOrderBook(raw), 1).bidVolume, 2);
});

test('stream frames and aggregated trades parse, with buyer-maker meaning a sell', () => {
  assert.deepEqual(unwrapStream('{"stream":"btcusdt@aggTrade","data":{"a":1}}'), { stream: 'btcusdt@aggTrade', data: { a: 1 } });
  assert.equal(unwrapStream('not json'), null);
  assert.equal(unwrapStream('{"foo":1}'), null);
  const sell = parseAggTrade({ a: 7, p: '100.5', q: '2', T: 1700000000000, m: true });
  assert.deepEqual(sell, { id: '7', price: 100.5, qty: 2, usd: 201, time: 1700000000000, side: 'sell' });
  assert.equal(parseAggTrade({ a: 8, p: '100', q: '1', T: 1, m: false }).side, 'buy');
  assert.equal(parseAggTrade({ p: '0', q: '1', T: 1, a: 1 }), null);
  assert.equal(parseAggTrade({ p: '1', q: '1', T: 1 }), null);
});

test('large-trade threshold uses the top decile above a floor', () => {
  assert.equal(largeTradeThreshold([]), 10000);
  const trades = Array.from({ length: 100 }, (_, i) => ({ id: String(i), price: 1, qty: i + 1, usd: (i + 1) * 1000, time: i, side: 'buy' }));
  assert.equal(largeTradeThreshold(trades), 91000);
  assert.equal(largeTradeThreshold(trades, 200000), 200000);
});

test('liquidations: a SELL order closes a long, a BUY order closes a short', () => {
  const event = { e: 'forceOrder', o: { s: 'BTCUSDT', S: 'SELL', ap: '60000', z: '0.5', T: 1700000000000 } };
  const long = parseForceOrder(event);
  assert.equal(long.side, 'LONG'); assert.equal(long.usd, 30000); assert.equal(long.symbol, 'BTCUSDT');
  assert.equal(parseForceOrder({ o: { s: 'ETHUSDT', S: 'BUY', p: '2000', q: '3', T: 5 } }).side, 'SHORT');
  assert.equal(parseForceOrder({ o: { s: 'ETHUSDT', S: 'HOLD', p: '2000', q: '3', T: 5 } }), null);
  assert.equal(parseForceOrder({}), null);
});

test('bounded lists keep newest first and ignore duplicate ids', () => {
  let list = [];
  list = pushBounded(list, [{ id: 'a' }, { id: 'b' }], 3);
  assert.deepEqual(list.map(item => item.id), ['b', 'a']);
  list = pushBounded(list, [{ id: 'b' }, { id: 'c' }, { id: 'd' }], 3);
  assert.deepEqual(list.map(item => item.id), ['d', 'c', 'b']);
});

test('rate limiter blocks after the limit and recovers after the window', () => {
  resetRateLimits();
  assert.equal(allowRequest('ip', 2, 1000, 0), true);
  assert.equal(allowRequest('ip', 2, 1000, 10), true);
  assert.equal(allowRequest('ip', 2, 1000, 20), false);
  assert.equal(allowRequest('other', 2, 1000, 20), true);
  assert.equal(allowRequest('ip', 2, 1000, 1001), true);
  assert.equal(clientKey(new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })), '1.2.3.4');
  assert.equal(clientKey(new Request('http://x')), 'unknown');
});
