import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getSessionProfile() {
  const auth = await createSupabaseServerClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return null;
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const { data: profile, error: profileError } = await admin.from('user_profiles')
    .select('id,email,role,subscription_end_at,analysis_limit,current_analysis_count,pending_plan_days,pending_plan_review,plan_code,enabled_features')
    .eq('id', user.id).maybeSingle();
  if (profileError || !profile) return null;
  return { user, profile, admin };
}

export async function getAdminContext() {
  const context = await getSessionProfile();
  return context?.profile.role === 'admin' ? context : null;
}

export function isActiveSubscriber(profile: {
  subscription_end_at: string | null;
  pending_plan_review?: boolean | null;
}): boolean {
  return !profile.pending_plan_review && !!profile.subscription_end_at
    && new Date(profile.subscription_end_at).getTime() > Date.now();
}
