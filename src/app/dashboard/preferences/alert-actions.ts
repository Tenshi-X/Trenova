'use server';

import { getSessionProfile } from '@/lib/authz';

export type AlertSettings = { emailAlerts: boolean; expiryAlerts: boolean };

/** No row = the defaults (everything on). */
export async function getAlertSettings(): Promise<{ settings?: AlertSettings; error?: string }> {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  const { data, error } = await context.admin.from('user_alert_settings').select('email_alerts,expiry_alerts').eq('user_id', context.user.id).maybeSingle();
  if (error) return { error: 'Pengaturan notifikasi belum dapat dimuat.' };
  return { settings: { emailAlerts: data?.email_alerts ?? true, expiryAlerts: data?.expiry_alerts ?? true } };
}

export async function saveAlertSettings(settings: AlertSettings): Promise<{ success?: true; error?: string }> {
  const context = await getSessionProfile();
  if (!context) return { error: 'Silakan masuk kembali.' };
  if (typeof settings?.emailAlerts !== 'boolean' || typeof settings?.expiryAlerts !== 'boolean') return { error: 'Pengaturan tidak valid.' };
  const { error } = await context.admin.from('user_alert_settings').upsert(
    { user_id: context.user.id, email_alerts: settings.emailAlerts, expiry_alerts: settings.expiryAlerts, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return error ? { error: 'Pengaturan belum dapat disimpan.' } : { success: true };
}
