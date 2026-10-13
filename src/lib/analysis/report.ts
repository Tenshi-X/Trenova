import {
  AI_EXPLANATION_LIMITS, levelSourceLabel, TIMEFRAME_MILLIS, validateClaims, validateModelAnalysis,
  type AnalysisInput, type AnalysisInsights, type AnalysisSetup, type AnalysisV2, type MarketSnapshot, type SignalFactor, type SignalQuality,
} from './core';

const priceText = (value: number) => Number(value.toPrecision(8)).toString();
const level = (value: number) => Number(value.toPrecision(12));
const matchesLevel = (raw: string, values: number[]) => {
  // Accept English/Indonesian separators only when one interpretation matches a
  // supplied price; ambiguous formatting cannot introduce a new trading level.
  const numbers = [Number(raw), Number(raw.replace(/,/g, '')), Number(raw.replace(/\./g, '').replace(',', '.'))];
  return values.some(value => numbers.some(number => Math.abs(number - value) <= value * 1e-6));
};

// Score a plan from independent, explainable checks. Unknown data earns half credit, a failed check none.
// Weights are heuristics: the backtest endpoint exists to check whether the score really separates good from bad setups.
const FACTOR_WEIGHTS = { htf: 25, trend: 15, rsi: 15, btc: 10, level: 15, path: 10, funding: 10 } as const;

export function assessSetup(setup: AnalysisSetup, market: MarketSnapshot, source: AnalysisSetup['entryType'],
  levelSource: NonNullable<MarketSnapshot['structure']>['supportSource'], language: 'id' | 'en'): SignalQuality {
  const structure = market.structure!;
  const long = setup.direction === 'LONG';
  const want = long ? 'bullish' : 'bearish';
  const copy = (id: string, english: string) => language === 'en' ? english : id;
  const factors: Array<SignalFactor & { weight: number }> = [];
  const add = (key: keyof typeof FACTOR_WEIGHTS, label: string, state: SignalFactor['state'], detail: string) =>
    factors.push({ key, label, state, detail, weight: FACTOR_WEIGHTS[key] });
  const trendState = (trend: string | undefined): [SignalFactor['state'], string] => !trend ? ['unknown', copy('data tidak tersedia', 'data unavailable')]
    : trend === want ? ['pass', copy('searah', 'aligned')] : trend === 'neutral' ? ['unknown', copy('netral', 'neutral')]
      : ['fail', copy('berlawanan', 'opposed')];
  const [htfState, htfDetail] = trendState(market.higherTrend?.trend);
  add('htf', copy(`Tren ${market.higherTrend?.timeframe ?? 'timeframe atas'}`, `${market.higherTrend?.timeframe ?? 'Higher timeframe'} trend`), htfState, htfDetail);
  const [trendResult, trendDetail] = trendState(structure.trend);
  add('trend', copy(`Struktur EMA ${market.timeframe}`, `${market.timeframe} EMA structure`), trendResult, trendDetail);
  const exhausted = long ? market.rsi >= 70 : market.rsi <= 30;
  const weakMomentum = source === 'BREAKOUT' && (long ? market.rsi < 50 : market.rsi > 50);
  add('rsi', 'RSI', exhausted ? 'fail' : weakMomentum ? 'unknown' : 'pass',
    exhausted ? copy(`RSI ${market.rsi.toFixed(0)}: sudah ekstrem, rawan mengejar`, `RSI ${market.rsi.toFixed(0)}: already extreme, chasing risk`)
      : weakMomentum ? copy(`RSI ${market.rsi.toFixed(0)}: momentum belum mendukung breakout`, `RSI ${market.rsi.toFixed(0)}: momentum does not support the breakout yet`)
        : copy(`RSI ${market.rsi.toFixed(0)}: masih ada ruang`, `RSI ${market.rsi.toFixed(0)}: room left`));
  const btcMove = market.symbol === 'BTC' ? null : market.btcChange24h;
  add('btc', copy('Arah BTC 24 jam', 'BTC 24h direction'), btcMove === null ? 'unknown'
    : (long ? btcMove <= -1.5 : btcMove >= 1.5) ? 'fail' : 'pass',
  btcMove === null ? copy('tidak berlaku atau tidak tersedia', 'not applicable or unavailable')
    : `${btcMove.toFixed(2)}%`);
  const strongLevel = !!levelSource && levelSource.tf !== 'local';
  add('level', copy('Kualitas level', 'Level quality'), strongLevel ? 'pass' : 'fail',
    strongLevel ? levelSourceLabel(levelSource, market.timeframe, language) : copy('hanya level candle terakhir (lemah)', 'only recent-candle level (weak)'));
  const entry = long ? setup.entryHigh : setup.entryLow;
  const blocker = (structure.htfLevels ?? []).find(value => (long ? value > entry * 1.002 && value < setup.takeProfit1
    : value < entry * 0.998 && value > setup.takeProfit1));
  add('path', copy('Jalur menuju TP1', 'Path to TP1'), !structure.htfLevels ? 'unknown' : blocker === undefined ? 'pass' : 'fail',
    blocker === undefined ? (structure.htfLevels ? copy('tidak ada level D1/W1 yang menghalangi', 'no D1/W1 level in the way') : copy('data tidak tersedia', 'data unavailable'))
      : copy(`TP1 melewati level D1/W1 di ${priceText(blocker)}`, `TP1 runs through a D1/W1 level at ${priceText(blocker)}`));
  const funding = market.fundingRate;
  const crowded = funding !== null && (long ? funding > 0.0005 : funding < -0.0005);
  add('funding', 'Funding', funding === null ? 'unknown' : crowded ? 'fail' : 'pass',
    funding === null ? copy('tidak tersedia', 'unavailable')
      : crowded ? copy(`${(funding * 100).toFixed(3)}%: posisi searah terlalu ramai`, `${(funding * 100).toFixed(3)}%: same-side positioning is crowded`)
        : `${(funding * 100).toFixed(3)}%`);
  const score = Math.round(factors.reduce((sum, f) => sum + f.weight * (f.state === 'pass' ? 1 : f.state === 'unknown' ? 0.5 : 0), 0));
  const nearest = market.price > setup.entryHigh ? market.price - setup.entryHigh : market.price < setup.entryLow ? setup.entryLow - market.price : 0;
  const status = score < 40 ? 'NO_TRADE' : nearest <= market.atr * 1.5 && score >= 50 ? 'READY' : 'WATCH';
  return { score, grade: score >= 70 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW', status,
    factors: factors.map(({ weight: _weight, ...factor }) => factor) };
}

// Build and validate the deliverable before reserving quota or calling a paid model.
// Targets express the requested RR; they are not predicted market destinations.
export function buildTechnicalAnalysis(input: AnalysisInput, market: MarketSnapshot): AnalysisV2 {
  const structure = market.structure;
  if (!structure || market.recentCandles.length < 20
    || ![market.price, market.atr, market.ema20, structure.support, structure.resistance]
      .every(value => Number.isFinite(value) && value > 0)
    || !Number.isFinite(market.rsi) || market.rsi < 0 || market.rsi > 100) {
    throw new Error('insufficient_technical_data');
  }
  const en = input.language === 'en';
  const copy = (id: string, english: string) => en ? english : id;
  const preferred = input.marketType === 'spot' || input.directionPreference === 'long' ? 'LONG'
    : input.directionPreference === 'short' ? 'SHORT'
      : structure.trend === 'bearish' || (structure.trend === 'neutral' && market.price < market.ema20) ? 'SHORT' : 'LONG';
  const directions: AnalysisSetup['direction'][] = input.marketType === 'spot' || input.directionPreference !== 'auto'
    ? [preferred] : [preferred, preferred === 'LONG' ? 'SHORT' : 'LONG'];
  const language = input.language === 'en' ? 'en' : 'id';
  const stopAtr = (input.riskTolerance === 'Low Risk' ? 1.5 : input.riskTolerance === 'High Risk' ? 0.75 : 1)
    * (input.tradingStyle === 'swing' ? 1.25 : input.tradingStyle === 'scalping' ? 0.8 : 1);
  const rr = Number(input.targetRR.slice(2));
  const built = directions.map(direction => {
    const long = direction === 'LONG';
    const trendMatches = structure.trend === (long ? 'bullish' : 'bearish');
    // All-Round picks by location: with the trend, buy the dip / sell the rally when that level is nearer than the breakout level.
    const nearerPullback = Math.abs((long ? structure.support : structure.resistance) - market.price)
      <= Math.abs((long ? structure.resistance : structure.support) - market.price);
    const pullback = input.strategyFocus === 'Mean Reversion'
      || (input.strategyFocus === 'Trend Following' && trendMatches)
      || (input.strategyFocus === 'All-Round' && trendMatches && nearerPullback);
    const anchor = pullback ? (long ? structure.support : structure.resistance)
      : (long ? structure.resistance : structure.support);
    const width = market.atr * 0.12;
    const entryLow = level(anchor - width);
    const entryHigh = level(anchor + width);
    const stopLoss = level(long ? entryLow - market.atr * stopAtr : entryHigh + market.atr * stopAtr);
    const worstEntry = long ? entryHigh : entryLow;
    const risk = Math.abs(worstEntry - stopLoss);
    const takeProfit1 = level(worstEntry + (long ? 1 : -1) * risk * rr);
    const takeProfit2 = level(worstEntry + (long ? 1 : -1) * risk * (rr + 1));
    const zone = `${priceText(entryLow)}–${priceText(entryHigh)}`;
    const source = long === pullback ? structure.supportSource : structure.resistanceSource;
    const sourceLabel = levelSourceLabel(source, input.timeframe, input.language === 'en' ? 'en' : 'id');
    // A pullback plan is cancelled by its stop; a breakout plan is cancelled by losing the opposite structure level,
    // otherwise the cancel rule can already be true when the plan is created.
    const cancelAt = pullback ? stopLoss : long ? structure.support : structure.resistance;
    const distanceToEntryPct = market.price > entryHigh ? (market.price - entryHigh) / market.price * 100
      : market.price < entryLow ? -(entryLow - market.price) / market.price * 100 : 0;
    const trigger = pullback
      ? copy(`Tunggu uji zona ${zone}, candle ${input.timeframe} tutup ${long ? 'di atas' : 'di bawah'} ${priceText(long ? entryHigh : entryLow)}, lalu retest zona entry.`,
        `Wait for a test of ${zone}, a ${input.timeframe} close ${long ? 'above' : 'below'} ${priceText(long ? entryHigh : entryLow)}, then an entry-zone retest.`)
      : copy(`Tunggu candle ${input.timeframe} tutup ${long ? 'di atas' : 'di bawah'} ${priceText(long ? entryHigh : entryLow)}, lalu retest ${zone}.`,
        `Wait for a ${input.timeframe} close ${long ? 'above' : 'below'} ${priceText(long ? entryHigh : entryLow)}, then a retest of ${zone}.`);
    const setup: AnalysisSetup = { direction, entryLow, entryHigh, stopLoss, takeProfit1, takeProfit2,
      execution: 'CONDITIONAL' as const, trigger,
      distanceToEntryPct, entryType: pullback ? 'PULLBACK' : 'BREAKOUT', cancelAt: level(cancelAt),
      invalidation: copy(`Candle ${input.timeframe} tutup ${long ? 'di bawah' : 'di atas'} ${priceText(cancelAt)} sebelum entry terpicu.`,
        `A ${input.timeframe} candle closes ${long ? 'below' : 'above'} ${priceText(cancelAt)} before the entry triggers.`),
      rationale: copy(`${pullback ? 'Retest' : 'Breakout/retest'} ${long === pullback ? 'support' : 'resistance'} ${priceText(anchor)} (${sourceLabel}); SL memakai buffer ${stopAtr.toFixed(2)} ATR. Target dihitung dari R:R ${input.targetRR}, bukan prediksi harga.`,
        `${pullback ? 'Retest' : 'Breakout/retest'} of ${long === pullback ? 'support' : 'resistance'} ${priceText(anchor)} (${sourceLabel}); SL uses a ${stopAtr.toFixed(2)} ATR buffer. Targets use ${input.targetRR} RR, not a price forecast.`),
    };
    setup.quality = assessSetup(setup, market, setup.entryType, source, language);
    return setup;
  });
  // The higher-scoring direction leads; ties keep the trend-based preference.
  const setups = built.map((setup, index) => ({ setup, index }))
    .sort((a, b) => (b.setup.quality!.score - a.setup.quality!.score) || (a.index - b.index)).map(item => item.setup);
  const btc = market.btcChange24h === null ? copy('tidak tersedia', 'unavailable') : `${market.btcChange24h.toFixed(2)}%`;
  const unavailable = copy('tidak tersedia', 'unavailable');
  const insights: AnalysisInsights = {
    trend: copy(`Harga ${market.price > market.ema20 ? 'di atas' : market.price < market.ema20 ? 'di bawah' : 'setara'} EMA20 ${priceText(market.ema20)}. Support ${priceText(structure.support)}; resistance ${priceText(structure.resistance)}.`,
      `Price is ${market.price > market.ema20 ? 'above' : market.price < market.ema20 ? 'below' : 'equal to'} EMA20 ${priceText(market.ema20)}. Support ${priceText(structure.support)}; resistance ${priceText(structure.resistance)}.`),
    momentum: copy(`RSI: ${market.rsi.toFixed(1)}. ATR ${priceText(market.atr)} (${(market.atr / market.price * 100).toFixed(2)}% harga); evaluasi momentum pada penutupan ${input.timeframe}.`,
      `RSI: ${market.rsi.toFixed(1)}. ATR ${priceText(market.atr)} (${(market.atr / market.price * 100).toFixed(2)}% of price); reassess momentum on the ${input.timeframe} close.`),
    volume: market.volumeRatio === null
      ? copy('Volume relatif tidak tersedia; jangan menganggap breakout telah dikonfirmasi volume.', 'Relative volume is unavailable; do not assume a volume-confirmed breakout.')
      : copy(`Volume candle terakhir ${market.volumeRatio.toFixed(2)}× rata-rata 20 candle sebelumnya. Cari volume setidaknya 1,2× saat pemicu terjadi.`,
        `Last candle volume is ${market.volumeRatio.toFixed(2)}× the previous 20-candle average. Look for at least 1.2× volume at the trigger.`),
    marketContext: `BTC 24h: ${btc}. Funding: ${market.fundingRate === null ? unavailable : market.fundingRate.toPrecision(4)}. Open interest: ${market.openInterestUsd === null ? unavailable : priceText(market.openInterestUsd) + ' USDT'}. Fear & Greed: ${market.fearGreed ?? unavailable}.`,
    bullCase: copy(`Jika candle ${input.timeframe} tutup di atas resistance ${priceText(structure.resistance)}, periksa retest dan volume sebelum mengikuti skenario naik.`,
      `If a ${input.timeframe} candle closes above resistance ${priceText(structure.resistance)}, check the retest and volume before following the bullish case.`),
    bearCase: copy(`Jika candle ${input.timeframe} tutup di bawah support ${priceText(structure.support)}, periksa retest. ${input.marketType === 'spot' ? 'Pada spot, evaluasi risiko long; jangan membuka short.' : 'Skenario turun memerlukan pemicu sendiri.'}`,
      `If a ${input.timeframe} candle closes below support ${priceText(structure.support)}, check the retest. ${input.marketType === 'spot' ? 'On spot, reassess long risk; do not open a short.' : 'The bearish case needs its own trigger.'}`),
    actionPlan: copy(`Periksa lagi setelah candle ${input.timeframe} tutup. Entry hanya setelah pemicu terpenuhi; hitung ukuran posisi sesuai risiko akun. Evaluasi hambatan support/resistance sebelum TP; jika posisi aktif, gunakan SL dan tinjau posisi di TP1.`,
      `Recheck after the ${input.timeframe} candle closes. Enter only after the trigger; size the position for account risk. Assess support/resistance barriers before TP; once in a position, use SL and review at TP1.`),
  };
  const report = validateModelAnalysis({ verdict: 'WAIT', setups, insights,
    reason: copy(`Rencana ${setups[0].direction} disusun dari support/resistance candle tertutup dan ATR. Entry menunggu pemicu terukur; target R:R harus ditinjau terhadap hambatan harga dan biaya transaksi.`,
      `The ${setups[0].direction} plan uses closed-candle support/resistance and ATR. Entry needs a measurable trigger; assess RR targets against price barriers and transaction costs.`),
    wait_for: setups[0].trigger,
  }, input, market);
  report.wait_for = report.setups[0].trigger!;
  const lead = report.setups[0].quality;
  if (lead?.status === 'NO_TRADE') report.warnings.push(copy(
    `Skor konfluensi ${lead.score}/100 (rendah): setup ini lebih baik dipantau saja, bukan dieksekusi.`,
    `Confluence score ${lead.score}/100 (low): treat this setup as watch-only, not as a trade.`));
  const blocked = lead?.factors.find(factor => factor.key === 'path' && factor.state === 'fail');
  if (blocked) report.warnings.push(`${blocked.detail}.`);
  report.expiresAt = new Date(new Date(market.asOf).getTime() + 6 * TIMEFRAME_MILLIS[input.timeframe]).toISOString();
  report.warnings.push(copy('TP adalah sasaran perhitungan R:R, bukan jaminan harga akan tercapai. Periksa biaya, slippage, dan hambatan struktur sebelum entry.',
    'TP levels are calculated RR objectives, not guaranteed destinations. Check fees, slippage and structural barriers before entry.'));
  report.provenance = { kind: 'technical', levels: 'technical' };
  return report;
}

export function technicalFallback(base: AnalysisV2, reason: NonNullable<AnalysisV2['provenance']>['fallbackReason']): AnalysisV2 {
  return { ...base, provenance: { kind: 'technical', levels: 'technical', fallbackReason: reason } };
}

// Repair presentation errors without another paid request. Numeric levels, triggers,
// cancellation rules and RR remain server-owned, regardless of the model response.
export function enrichTechnicalAnalysis(raw: unknown, base: AnalysisV2, market: MarketSnapshot): AnalysisV2 {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid_response');
  const response = raw as Record<string, unknown>;
  const selected = base.setups.find(setup => setup.direction === response.preferredDirection);
  if (!selected) throw new Error('disallowed_direction');
  const selectedReason = base.reason.replace(base.setups[0].direction, selected.direction);
  const repairedFields: string[] = [];
  let accepted = 0;
  const text = (value: unknown, fallback: string, max: number, field: string): string => {
    let candidate = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    try {
      if (candidate.length < 8) throw new Error('missing_text');
      validateClaims(candidate, market);
      if (/\b(profit pasti|pasti profit|jaminan profit|guaranteed profit|entry sekarang|beli sekarang|jual sekarang|enter now|buy now|sell now)\b/i.test(candidate)) throw new Error('unsupported_advice');
      // Reject explicit replacement trading prices in prose as well as JSON. The
      // model may discuss the observed support/resistance, but cannot rewrite a plan.
      for (const match of candidate.matchAll(/\b(entry|zona entry|SL|stop\s*loss|TP1|TP2|take\s*profit\s*[12]?)\s*(?::|=|(?:di|at|pada|is|sebesar)\s+)\s*([\d]+(?:[.,][\d]+)*(?:e[-+]?\d+)?)/gi)) {
        const label = match[1].toLowerCase();
        const expected = /entry/.test(label) ? [selected.entryLow, selected.entryHigh]
          : /sl|stop/.test(label) ? [selected.stopLoss]
            : /2/.test(label) ? [selected.takeProfit2] : [selected.takeProfit1];
        if (!matchesLevel(match[2], expected)) throw new Error('inconsistent_plan_price');
      }
      const knownPrices = [market.price, market.ema20, market.ema50, market.structure?.support, market.structure?.resistance,
        market.structure?.rangeLow, market.structure?.rangeHigh, market.confirmation?.close, market.confirmation?.ema20,
        ...base.setups.flatMap(setup => [setup.entryLow, setup.entryHigh, setup.stopLoss, setup.takeProfit1, setup.takeProfit2])]
        .filter((value): value is number => typeof value === 'number');
      // A timeframe such as "candle 1h" or "candle 4 jam" is not a price.
      // Require the full number, so backtracking cannot turn 9000 into 900.
      for (const match of candidate.matchAll(/\b(support|resistance|retest|harga|price|candle(?:\s+\d+[mhdw])?)\s*(?:(?:tutup|menutup|ditutup|closes?|closed|at|di atas|di bawah|di|pada|near|sekitar|above|below|of|:|=)\s*){0,3}(\d+(?:[.,]\d+)*(?:e[-+]?\d+)?)(?!\d|[.,]\d|e[-+]?\d|[mhdw]\b|\s*(?:menit|minutes?|jam|hours?|hari|days?|minggu|weeks?|candles?|batang)\b)/gi)) {
        if (!matchesLevel(match[2], knownPrices)) throw new Error('unsupported_scenario_price');
      }
      if (candidate.length > max) {
        const sentences = candidate.match(/[^.!?]+[.!?](?:\s|$)/g) ?? [];
        candidate = '';
        for (const sentence of sentences) {
          if ((candidate + sentence).trim().length > max) break;
          candidate += sentence;
        }
        candidate = candidate.trim();
        if (candidate.length < 8) throw new Error('overlong_text');
        repairedFields.push(field);
      }
      accepted++;
      return candidate;
    } catch {
      if (!repairedFields.includes(field)) repairedFields.push(field);
      return fallback;
    }
  };
  const reason = text(response.reason, selectedReason, AI_EXPLANATION_LIMITS.reason, 'reason');
  const rawInsights = response.insights && typeof response.insights === 'object' && !Array.isArray(response.insights)
    ? response.insights as Record<string, unknown> : {};
  const insights = Object.fromEntries(Object.entries(base.insights!).map(([key, fallback]) =>
    [key, text(rawInsights[key], fallback, AI_EXPLANATION_LIMITS.insight, `insights.${key}`)])) as AnalysisInsights;
  const rationale = text(response.rationale, selected.rationale!, AI_EXPLANATION_LIMITS.rationale, 'rationale');
  if (accepted === 0) throw new Error('empty_analysis');
  const setups = [{ ...selected, rationale }, ...base.setups.filter(setup => setup !== selected)];
  return { ...base, reason, insights, setups, wait_for: selected.trigger!,
    provenance: { kind: repairedFields.length ? 'ai_adjusted' : 'ai', levels: 'technical',
      ...(repairedFields.length ? { repairedFields } : {}) } };
}
