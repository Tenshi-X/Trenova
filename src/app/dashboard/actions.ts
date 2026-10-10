'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getUserUsage() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) return null;

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count, subscription_end_at, pending_plan_review')
    .eq('id', user.id)
    .single();

  let profileData: { analysis_limit: number | null; current_analysis_count: number | null; subscription_end_at: string | null; pending_plan_review?: boolean } | null = profile;

  if (error || !profile) {
      // Create default profile for newly registered users
      await supabaseAdmin.from('user_profiles').insert({
          id: user.id,
          email: user.email,
          role: 'user',
          analysis_limit: 0,
          current_analysis_count: 0
      });
      profileData = { analysis_limit: 0, current_analysis_count: 0, subscription_end_at: null };
  }

  const current = profileData?.current_analysis_count || 0;
  const limit = profileData?.analysis_limit ?? 0;
  
  const now = new Date();
  const endAt = profileData?.subscription_end_at ? new Date(profileData.subscription_end_at) : null;
  const isExpired = endAt ? endAt < now : true;
  const isRestricted = limit <= 0 || isExpired || !!profileData?.pending_plan_review;

  return {
    analysis: {
      used: current,
      limit: limit,
      remaining: Math.max(0, limit - current)
    },
    isRestricted
  };
}

export async function activatePendingSubscription() {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) return { success: false };
  
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) return { success: false, error: "Config error" };

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_end_at,pending_plan_days,pending_plan_review')
        .eq('id', user.id)
        .single();
    if (!profile || profile.pending_plan_review || profile.subscription_end_at
      || !Number.isInteger(profile.pending_plan_days) || profile.pending_plan_days < 1) {
      return { success: true, activated: false };
    }
    const endAt = new Date(Date.now() + profile.pending_plan_days * 86_400_000);
    const { data, error } = await supabaseAdmin.from('user_profiles')
      .update({ subscription_end_at: endAt.toISOString(), pending_plan_days: null })
      .eq('id', user.id).is('subscription_end_at', null)
      .eq('pending_plan_review', false).select('id').single();
    return { success: !error, activated: !!data, error: error?.message };
  }

export async function searchTVSymbols(query: string) {
    try {
        const res = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query)}&hl=en&exchange=&lang=en&type=&domain=production`, {
            method: "GET",
            headers: {
                'Origin': 'https://www.tradingview.com'
            }
        });
        
        if (!res.ok) {
            console.error("TV Search Failed", res.status, await res.text());
            return [];
        }
        
        const data = await res.json();
        return data; 
    } catch (e) {
        console.error("TV Search Exception", e);
        return [];
    }
}

