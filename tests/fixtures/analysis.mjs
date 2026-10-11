export const insights = {
  trend: 'Struktur candle dan EMA20 menjadi acuan arah utama.',
  momentum: 'Momentum perlu dikonfirmasi pada penutupan candle berikutnya.',
  volume: 'Volume relatif dipakai untuk memeriksa kekuatan penembusan.',
  marketContext: 'Konteks BTC dipertimbangkan; data derivatif belum tersedia.',
  bullCase: 'Jika harga menutup di atas 102, evaluasi peluang naik.',
  bearCase: 'Jika harga menutup di bawah 98, evaluasi kelanjutan turun.',
  actionPlan: 'Periksa kembali pada penutupan 1h; batalkan entry jika pemicu gagal dan gunakan SL.',
};

export const longSetup = {
  direction: 'LONG', entryLow: 99, entryHigh: 100, stopLoss: 97, takeProfit1: 106, takeProfit2: 110,
  execution: 'READY', trigger: 'Harga berada dalam zona entry 99–100.',
  invalidation: 'Batalkan jika candle ditutup di bawah 97 sebelum entry.',
  rationale: 'SL di luar zona entry; target mempertimbangkan struktur dan risiko.',
};

export const shortSetup = {
  direction: 'SHORT', entryLow: 99, entryHigh: 100, stopLoss: 102, takeProfit1: 93, takeProfit2: 90,
  execution: 'READY', trigger: 'Harga berada dalam zona entry 99–100.',
  invalidation: 'Batalkan jika candle ditutup di atas 102 sebelum entry.',
  rationale: 'SL di luar zona entry; target mempertimbangkan struktur dan risiko.',
};

export function modelResult(overrides = {}) {
  const verdict = overrides.verdict ?? 'SHORT';
  return { verdict, reason: 'Struktur candle memberi acuan untuk rencana transaksi.',
    wait_for: verdict === 'WAIT' ? 'Tunggu penutupan candle 1h di bawah 99 lalu retest 99–100.' : '',
    setups: [verdict === 'LONG' ? { ...longSetup } : { ...shortSetup,
      ...(verdict === 'WAIT' ? { execution: 'CONDITIONAL', trigger: 'Tunggu penutupan 1h di bawah 99 lalu retest 99–100.' } : {}) }],
    insights: { ...insights }, ...overrides };
}

export function aiExplanation(overrides = {}) {
  return { preferredDirection: 'SHORT', reason: 'Struktur candle memberi acuan untuk rencana transaksi.',
    rationale: 'Pertimbangkan hambatan struktur dan risiko sebelum mengikuti rencana.',
    insights: { ...insights }, ...overrides };
}

export const technicalMarket = { symbol: 'BTC', asOf: '2026-10-11T00:00:00Z', price: 100,
  change24h: 2, volume24hUsd: 1000000, btcChange24h: 2, fundingRate: null, openInterestUsd: null,
  fearGreed: null, timeframe: '1h', atr: 2, rsi: 60, ema20: 98, ema50: 97, volumeRatio: 1.2,
  structure: { support: 98, resistance: 102, rangeLow: 97, rangeHigh: 103,
    change5CandlesPct: 1, atrPct: 2, trend: 'bullish' },
  recentCandles: Array.from({ length: 24 }, (_, i) => ({ openTime: i * 3600000,
    closeTime: (i + 1) * 3600000 - 1, open: 99, high: 102, low: 98, close: 100, volume: 100 })),
};
