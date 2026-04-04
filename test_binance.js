const WebSocket = require('ws');

const spot = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
spot.on('open', () => console.log('spot ws opened'));
spot.on('message', data => {
  console.log('spot ws data snippet:', data.toString().substring(0, 100));
  spot.close();
});
spot.on('error', e => console.error('spot ws error:', e));

const futures = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
futures.on('open', () => console.log('futures ws opened'));
futures.on('message', data => {
  console.log('futures ws data snippet:', data.toString().substring(0, 100));
  futures.close();
});
futures.on('error', e => console.error('futures ws error:', e));
