'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function checkUsageLimit() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    return { allowed: false, error: "User not logged in" };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return { allowed: false, error: "System configuration error" };
  }

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { allowed: false, error: "Could not fetch user profile stats" };
  }

  const limit = profile.analysis_limit ?? 150; 
  const currentCount = profile.current_analysis_count || 0;

  if (currentCount >= limit) {
    return { allowed: false, error: `Analysis limit reached (${limit}/${limit}). Please upgrade.` };
  }

  return { allowed: true, currentCount, limit };
}

export async function incrementUsage() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { success: false };

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return { success: false };

  // Fetch latest again to be safe or just increment
  // We can just increment using RPC or fetch-update pattern
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('current_analysis_count')
    .eq('id', user.id)
    .single();
    
  if (profile) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ current_analysis_count: (profile.current_analysis_count || 0) + 1 })
        .eq('id', user.id);
  }
  return { success: true };
}

export async function saveAnalysis(analysisData: any, coinSymbol?: string, coinName?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
      .from('analysis_results')
      .insert({
          user_id: user.id,
          analysis_json: JSON.stringify(analysisData),
          coin_symbol: coinSymbol,
          coin_name: coinName
      });

  if (error) {
      console.error("Save Analysis Error:", error);
      return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUserUsage() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) return null;

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  const current = profile.current_analysis_count || 0;
  const limit = profile.analysis_limit ?? 150;

  return {
    analysis: {
      used: current,
      limit: limit,
      remaining: limit - current
    }
  };
}

export async function activatePendingSubscription() {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) return { success: false };
  
    // Check if user has pending plan in metadata
    const initialDays = user.user_metadata?.initial_plan_days;
    if (!initialDays) return { success: true, message: "No pending plan" }; // nothing to do
  
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) return { success: false, error: "Config error" };
  
    // Check current profile status
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_end_at')
        .eq('id', user.id)
        .single();
    
    // If subscription is already active (not null), we might want to clear the metadata but not overwrite?
    // Requirement says: "start 30 days from user first login"
    // If subscription_end_at is NULL, it means it hasn't started.
    
    if (!profile?.subscription_end_at) {
        // Activate it now
        const now = new Date();
        const endAt = new Date(now);
        endAt.setDate(endAt.getDate() + Number(initialDays));
        
        console.log(`Activating subscription for ${user.email}: ${initialDays} days, ends ${endAt.toISOString()}`);
  
        // 1. Update Profile
        await supabaseAdmin
            .from('user_profiles')
            .update({ subscription_end_at: endAt.toISOString() })
            .eq('id', user.id);
            
        // 2. Update Auth Metadata (Clear pending, set active)
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { 
                subscription_end_at: endAt.toISOString(),
                initial_plan_days: null // Clear it so it doesn't trigger again
            }
        });
        
        return { success: true, activated: true };
    } else {
        // Already active, just clear the metadata if it's there?
        // Let's clear it to be safe
        if (user.user_metadata.initial_plan_days) {
             await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { initial_plan_days: null }
            });
        }
        return { success: true, activated: false };
    }
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
