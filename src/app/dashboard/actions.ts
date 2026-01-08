'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function checkAndIncrementUsage() {
  // 1. Authenticate User (Must use Server Client to read cookies)
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    return { allowed: false, error: "User not logged in" };
  }

  // 2. Perform DB Operations as Admin (Bypass RLS)
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    console.error("Server Error: Missing Service Role Key");
    return { allowed: false, error: "System configuration error" };
  }

  // Fetch Profile using Admin Client
  // We use the new columns: analysis_limit, current_analysis_count
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('analysis_limit, current_analysis_count')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error("Profile Fetch Error (Admin):", error);
    return { allowed: false, error: "Could not fetch user profile stats" };
  }

  // 3. Check Limits (No daily reset)
  const limit = profile.analysis_limit ?? 150; 
  const currentCount = profile.current_analysis_count || 0;

  if (currentCount >= limit) {
    return { allowed: false, error: `Analysis limit reached (${limit}/${limit}). Please upgrade.` };
  }

  // 4. Update DB using Admin Client
  const newCount = currentCount + 1;
  const { error: updateError } = await supabaseAdmin
    .from('user_profiles')
    .update({ current_analysis_count: newCount })
    .eq('id', user.id);

  if (updateError) {
    console.error("Update Usage Error:", updateError);
    return { allowed: false, error: "Failed to update usage stats" };
  }

  return { allowed: true, remaining: limit - newCount };
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
