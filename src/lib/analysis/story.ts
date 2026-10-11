import type { AnalysisV2 } from './core';

export type StoryLanguage = 'id' | 'en';
export type StoryRow = { label: string; value: string; tone: 'gold' | 'red' | 'green' | 'muted' };
export type AnalysisStory = {
  symbol: string;
  title: string;
  status: string;
  subtitle: string;
  timeframe: string;
  marketType: string;
  asOf: string;
  source: string;
  rows: StoryRow[];
  trigger: string;
  invalidation: string;
  reason: string;
  filename: string;
  language: StoryLanguage;
};

export const storyPrice = (value: number) => value.toLocaleString('en-US', { maximumSignificantDigits: 8 });

// Shares only report data: never an account, quota, private note or outcome.
export function buildAnalysisStory(result: AnalysisV2, language: StoryLanguage): AnalysisStory {
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const setup = result.setups[0];
  const pending = !!setup && (result.verdict === 'WAIT' || setup.execution === 'CONDITIONAL');
  const symbol = result.market.symbol.toUpperCase().replace(/USDT$/, '');
  const time = new Date(result.market.asOf);
  const rows: StoryRow[] = setup ? [
    { label: 'ENTRY', value: `${storyPrice(setup.entryLow)} – ${storyPrice(setup.entryHigh)}`, tone: 'gold' },
    { label: 'SL', value: storyPrice(setup.stopLoss), tone: 'red' },
    { label: 'TP1', value: storyPrice(setup.takeProfit1), tone: 'green' },
    { label: 'TP2', value: storyPrice(setup.takeProfit2), tone: 'green' },
  ] : [];
  if (setup?.riskReward != null) rows.push({ label: 'R:R TP1', value: `1:${setup.riskReward.toFixed(2)}`, tone: 'muted' });
  const kind = result.provenance?.kind;
  return {
    symbol: `${symbol} / USDT`,
    title: pending ? copy(`RENCANA ${setup.direction}`, `${setup.direction} PLAN`) : result.verdict,
    status: pending ? copy('BERSYARAT', 'CONDITIONAL') : setup?.execution === 'READY'
      ? copy('SETUP SIAP', 'SETUP READY') : copy('LAPORAN TERSIMPAN', 'SAVED REPORT'),
    subtitle: pending ? copy('Entry setelah pemicu terpenuhi', 'Enter after the trigger is confirmed')
      : !setup ? copy('Menunggu konfirmasi pasar', 'Waiting for market confirmation')
        : copy('Rencana utama · Harga dalam USDT', 'Primary plan · Prices in USDT'),
    timeframe: result.market.timeframe.toUpperCase(),
    marketType: result.parameters?.marketType.toUpperCase() ?? '',
    asOf: Number.isNaN(time.getTime()) ? copy('Waktu tidak tersedia', 'Time unavailable')
      : `${time.toLocaleString(language === 'id' ? 'id-ID' : 'en-GB', { timeZone: 'Asia/Jakarta',
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB`,
    source: kind === 'technical' ? copy('TEKNIKAL OTOMATIS', 'AUTOMATIC TECHNICAL PLAN')
      : kind === 'ai_adjusted' ? copy('AI DENGAN PENYESUAIAN', 'AI WITH ADJUSTMENTS')
        : kind === 'ai' ? copy('ANALISIS AI', 'AI ANALYSIS') : copy('LAPORAN TERSIMPAN', 'SAVED REPORT'),
    rows,
    trigger: setup?.trigger || result.wait_for || '',
    invalidation: setup?.invalidation || '',
    reason: result.reason,
    filename: `trenova-${symbol.toLowerCase().replace(/[^a-z0-9]/g, '')}-${result.market.timeframe}-${Number.isNaN(time.getTime()) ? 'report' : time.toISOString().slice(0, 10)}-story.png`,
    language,
  };
}

export type PlanLevel = { label: string; value: number; color: string };
export function analysisPlanLevels(result: AnalysisV2): PlanLevel[] {
  const setup = result.setups[0];
  if (!setup) return [];
  return [
    { label: 'TP2', value: setup.takeProfit2, color: '#68ce98' },
    { label: 'TP1', value: setup.takeProfit1, color: '#68ce98' },
    { label: 'ENTRY HIGH', value: setup.entryHigh, color: '#f0c060' },
    { label: 'ENTRY LOW', value: setup.entryLow, color: '#f0c060' },
    { label: 'SL', value: setup.stopLoss, color: '#ef7777' },
  ].filter(level => Number.isFinite(level.value)).sort((a, b) => b.value - a.value);
}
