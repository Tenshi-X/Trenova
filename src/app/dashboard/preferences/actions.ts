'use server';

import { getSessionProfile } from '@/lib/authz';
import { STYLES, TIMEFRAMES, RISKS, STRATEGIES, INDICATORS, TARGET_RRS } from '@/lib/analysis/core';

export type UserPreset = { name: string; tradingStyle: string; timeframe: string; riskTolerance: string;
  strategyFocus: string; indicatorPref: string; targetRR: string };

export async function getPreferences() {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  const [preferences, presets, profile] = await Promise.all([
    context.admin.from('user_analysis_preferences').select('presets,watchlist').eq('user_id', context.user.id).maybeSingle(),
    context.admin.from('analysis_presets').select('*').eq('enabled', true),
    context.admin.from('user_profiles').select('enabled_presets').eq('id', context.user.id).single(),
  ]);
  const allowed = profile.data?.enabled_presets as string[] | null;
  return { presets: (preferences.data?.presets ?? []) as UserPreset[],
    watchlist: (preferences.data?.watchlist ?? []) as string[],
    adminPresets: (presets.data ?? []).filter((preset) => !allowed?.length || allowed.includes(preset.code)) };
}

function validPreset(preset: UserPreset) {
  return typeof preset?.name === 'string' && preset.name.trim().length >= 2 && preset.name.length <= 40
    && STYLES.includes(preset.tradingStyle as typeof STYLES[number])
    && TIMEFRAMES.includes(preset.timeframe as typeof TIMEFRAMES[number])
    && RISKS.includes(preset.riskTolerance as typeof RISKS[number])
    && STRATEGIES.includes(preset.strategyFocus as typeof STRATEGIES[number])
    && INDICATORS.includes(preset.indicatorPref as typeof INDICATORS[number])
    && TARGET_RRS.includes(preset.targetRR as typeof TARGET_RRS[number]);
}

export async function savePreferences(presets: UserPreset[], watchlist: string[]) {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  if (!Array.isArray(presets) || presets.length > 5 || presets.some((preset) => !validPreset(preset))
    || !Array.isArray(watchlist) || watchlist.length > 20
    || watchlist.some((symbol) => typeof symbol !== 'string' || !/^[A-Z0-9]{2,15}$/.test(symbol))) {
    return { error: 'Preferensi tidak valid.' };
  }
  const { error } = await context.admin.from('user_analysis_preferences').upsert({
    user_id: context.user.id, presets, watchlist: [...new Set(watchlist)],
    updated_at: new Date().toISOString(),
  });
  return error ? { error: error.message } : { success: true };
}
