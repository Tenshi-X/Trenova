import {
  AI_EXPLANATION_LIMITS, validateClaims, validateModelAnalysis,
  type AnalysisInput, type AnalysisInsights, type AnalysisSetup, type AnalysisV2, type MarketSnapshot,
} from './core';

const priceText = (value: number) => Number(value.toPrecision(8)).toString();
const level = (value: number) => Number(value.toPrecision(12));
const matchesLevel = (raw: string, values: number[]) => {
  // Accept English/Indonesian separators only when one interpretation matches a
  // supplied price; ambiguous formatting cannot introduce a new trading level.
  const numbers = [Number(raw), Number(raw.replace(/,/g, '')), Number(raw.replace(/\./g, '').replace(',', '.'))];
  return values.some(value => numbers.some(number => Math.abs(number - value) <= value * 1e-6));
};

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
  const stopAtr = (input.riskTolerance === 'Low Risk' ? 1.5 : input.riskTolerance === 'High Risk' ? 0.75 : 1)
    * (input.tradingStyle === 'swing' ? 1.25 : input.tradingStyle === 'scalping' ? 0.8 : 1);
  const rr = Number(input.targetRR.slice(2));
  const setups = directions.map(direction => {
    const long = direction === 'LONG';
    const pullback = input.strategyFocus === 'Mean Reversion'
      || (input.strategyFocus === 'Trend Following' && structure.trend === (long ? 'bullish' : 'bearish'));
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
    const trigger = pullback
      ? copy(`Tunggu uji zona ${zone}, candle ${input.timeframe} tutup ${long ? 'di atas' : 'di bawah'} ${priceText(long ? entryHigh : entryLow)}, lalu retest zona entry.`,
        `Wait for a test of ${zone}, a ${input.timeframe} close ${long ? 'above' : 'below'} ${priceText(long ? entryHigh : entryLow)}, then an entry-zone retest.`)
      : copy(`Tunggu candle ${input.timeframe} tutup ${long ? 'di atas' : 'di bawah'} ${priceText(long ? entryHigh : entryLow)}, lalu retest ${zone}.`,
        `Wait for a ${input.timeframe} close ${long ? 'above' : 'below'} ${priceText(long ? entryHigh : entryLow)}, then a retest of ${zone}.`);
    return { direction, entryLow, entryHigh, stopLoss, takeProfit1, takeProfit2,
      execution: 'CONDITIONAL' as const, trigger,
      invalidation: copy(`Batalkan sebelum entry jika candle ${input.timeframe} tutup ${long ? 'di bawah' : 'di atas'} ${priceText(stopLoss)}.`,
        `Cancel before entry if a ${input.timeframe} candle closes ${long ? 'below' : 'above'} ${priceText(stopLoss)}.`),
      rationale: copy(`${pullback ? 'Retest' : 'Breakout/retest'} ${long === pullback ? 'support' : 'resistance'} ${priceText(anchor)}; SL memakai buffer ${stopAtr.toFixed(2)} ATR. Target dihitung dari R:R ${input.targetRR}, bukan prediksi harga.`,
        `${pullback ? 'Retest' : 'Breakout/retest'} of ${long === pullback ? 'support' : 'resistance'} ${priceText(anchor)}; SL uses a ${stopAtr.toFixed(2)} ATR buffer. Targets use ${input.targetRR} RR, not a price forecast.`),
    };
  });
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
    reason: copy(`Rencana ${preferred} disusun dari support/resistance candle tertutup dan ATR. Entry menunggu pemicu terukur; target R:R harus ditinjau terhadap hambatan harga dan biaya transaksi.`,
      `The ${preferred} plan uses closed-candle support/resistance and ATR. Entry needs a measurable trigger; assess RR targets against price barriers and transaction costs.`),
    wait_for: setups[0].trigger,
  }, input, market);
  report.wait_for = report.setups[0].trigger!;
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
