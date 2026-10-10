'use server';

import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/lib/authz';

export type Plan = {
  code: string; title_id: string; title_en: string; duration_days: number;
  analysis_quota: number; price_idr: number; checkout_url: string;
  active: boolean; sort_order: number; allowed_presets: string[];
  features: Record<string, boolean>;
};

export type Preset = {
  code: string; name_id: string; name_en: string; trading_style: string;
  timeframe: string; risk_tolerance: string; strategy_focus: string;
  indicator_pref: string; target_rr: string; enabled: boolean;
};

export async function getCatalogAdmin() {
  const context = await getAdminContext();
  if (!context) return { error: 'Akses admin diperlukan.' };
  const [plans, presets] = await Promise.all([
    context.admin.from('plans').select('*').order('sort_order'),
    context.admin.from('analysis_presets').select('*').order('code'),
  ]);
  if (plans.error || presets.error) return { error: plans.error?.message || presets.error?.message };
  return { plans: plans.data as Plan[], presets: presets.data as Preset[] };
}

function validShopUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'shopee.co.id' || url.hostname === 's.shopee.co.id' || url.hostname === 'id.shp.ee');
  } catch { return false; }
}

export async function savePlan(plan: Plan) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  if (!/^[a-z0-9-]{3,40}$/.test(plan.code) || !plan.title_id?.trim() || !plan.title_en?.trim()
    || !Number.isInteger(plan.duration_days) || plan.duration_days < 1 || plan.duration_days > 3650
    || !Number.isInteger(plan.analysis_quota) || plan.analysis_quota < 0 || plan.analysis_quota > 100000
    || !Number.isInteger(plan.price_idr) || plan.price_idr < 0
    || !Number.isInteger(plan.sort_order) || !validShopUrl(plan.checkout_url)
    || !Array.isArray(plan.allowed_presets) || plan.allowed_presets.some((item) => typeof item !== 'string')) {
    return { success: false, error: 'Data paket tidak valid.' };
  }
  const { error } = await context.admin.from('plans').upsert({
    ...plan, title_id: plan.title_id.trim(), title_en: plan.title_en.trim(),
    updated_at: new Date().toISOString(), updated_by: context.user.id,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function savePreset(preset: Preset) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  const { STYLES, TIMEFRAMES, RISKS, STRATEGIES, INDICATORS, TARGET_RRS } = await import('@/lib/analysis/core');
  if (!/^[a-z0-9-]{3,40}$/.test(preset.code) || !preset.name_id?.trim() || !preset.name_en?.trim()
    || !STYLES.includes(preset.trading_style as typeof STYLES[number])
    || !TIMEFRAMES.includes(preset.timeframe as typeof TIMEFRAMES[number])
    || !RISKS.includes(preset.risk_tolerance as typeof RISKS[number])
    || !STRATEGIES.includes(preset.strategy_focus as typeof STRATEGIES[number])
    || !INDICATORS.includes(preset.indicator_pref as typeof INDICATORS[number])
    || !TARGET_RRS.includes(preset.target_rr as typeof TARGET_RRS[number])) {
    return { success: false, error: 'Preset tidak valid.' };
  }
  const { error } = await context.admin.from('analysis_presets').upsert({
    ...preset, name_id: preset.name_id.trim(), name_en: preset.name_en.trim(),
    updated_at: new Date().toISOString(), updated_by: context.user.id,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function activateOrder(userId: string, planCode: string, orderReference: string, paidIdr: number) {
  const context = await getAdminContext();
  if (!context) return { success: false, error: 'Akses admin diperlukan.' };
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[a-z0-9-]{3,40}$/.test(planCode)
    || !Number.isInteger(paidIdr) || paidIdr < 0) return { success: false, error: 'Data pesanan tidak valid.' };
  const { data, error } = await context.admin.rpc('activate_manual_order', {
    p_actor_id: context.user.id, p_user_id: userId, p_plan_code: planCode,
    p_order_reference: orderReference, p_paid_idr: paidIdr,
  });
  if (error) return { success: false, error: error.code === '23505' ? 'Nomor pesanan sudah dipakai.' : error.message };
  revalidatePath('/admin');
  return { success: true, result: data };
}

export async function verifyLegacyPending(userId: string, orderReference: string, days: number) {
  const context = await getAdminContext();
  if (!context) return { error: 'Akses admin diperlukan.' };
  const { error } = await context.admin.rpc('verify_legacy_pending', {
    p_actor_id: context.user.id, p_user_id: userId, p_order_reference: orderReference, p_days: days,
  });
  return error ? { error: error.code === '23505' ? 'Nomor pesanan sudah dipakai.' : error.message } : { success: true };
}
