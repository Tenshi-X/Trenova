import type { AnalysisV2 } from '@/lib/analysis/core';
import { analysisPlanLevels, storyPrice } from '@/lib/analysis/story';

// Saved v2 reports do not contain candles. Show their actual price levels
// instead of inventing a price series or implying this is a live chart.
export default function AnalysisPlanMap({ result, language }: { result: AnalysisV2; language: 'id' | 'en' }) {
  const levels = analysisPlanLevels(result);
  if (!levels.length) return null;
  const low = Math.min(...levels.map(level => level.value), result.market.price);
  const high = Math.max(...levels.map(level => level.value), result.market.price);
  const range = high - low || high * .01 || 1;
  const position = (value: number) => 20 + (high - value) / range * 190;
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const setup = result.setups[0];
  return <figure className="terminal-plan-map">
    <figcaption><span>{copy('PETA LEVEL · RENCANA UTAMA', 'LEVEL MAP · PRIMARY PLAN')}</span><span>USDT</span></figcaption>
    <svg viewBox="0 0 700 250" role="img" aria-label={copy('Peta level Entry, SL, TP dan harga saat analisis', 'Entry, SL, TP and price at analysis time')}>
      {[40, 80, 120, 160, 200].map(y => <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="#202020" />)}
      {[80, 160, 240, 320, 400].map(x => <line key={x} x1={x} x2={x} y1="0" y2="230" stroke="#202020" />)}
      <rect x="30" width="400" y={position(setup.entryHigh)} height={Math.max(2, position(setup.entryLow) - position(setup.entryHigh))} fill="#d4a843" opacity=".14" />
      <line x1="30" x2="430" y1={position(result.market.price)} y2={position(result.market.price)} stroke="#d8d8d8" strokeDasharray="3 5" />
      <circle cx="230" cy={position(result.market.price)} r="5" fill="#d8d8d8" />
      {levels.map((level, index) => <g key={level.label}>
        <line x1="30" x2="430" y1={position(level.value)} y2={position(level.value)} stroke={level.color} strokeDasharray="6 4" />
        <path d={`M430 ${position(level.value)} L452 ${26 + index * 41} L466 ${26 + index * 41}`} fill="none" stroke={level.color} opacity=".6" />
        <text x="478" y={30 + index * 41} fill={level.color} fontSize="12" fontFamily="monospace">{level.label} · {storyPrice(level.value)}</text>
      </g>)}
      <text x="30" y="244" fill="#aaa" fontSize="12" fontFamily="monospace">{copy('Harga saat analisis', 'Price at analysis')}: {storyPrice(result.market.price)} USDT</text>
    </svg>
    <div className="terminal-plan-legend" aria-hidden="true">
      {levels.map(level => <div key={level.label}><span>{level.label}</span><strong style={{ color: level.color }}>{storyPrice(level.value)}</strong></div>)}
      <div><span>{copy('Harga saat analisis', 'Price at analysis')}</span><strong>{storyPrice(result.market.price)}</strong></div>
    </div>
  </figure>;
}
