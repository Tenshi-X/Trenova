'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type FeatureType = 'image' | 'chat';

export async function checkAndIncrementUsage(feature: FeatureType) {
  // 1. Authenticate User (Must use Server Client to read cookies)
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    return { allowed: false, error: "User not logged in" };
  }

  // 2. Perform DB Operations as Admin (Bypass RLS)
  // This fixes the "Infinite Recursion" error and prevents users from bypassing limits
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    console.error("Server Error: Missing Service Role Key");
    return { allowed: false, error: "System configuration error" };
  }

  // Fetch Profile using Admin Client
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('limit_image_upload, limit_chat_input, current_image_upload_count, current_chat_input_count, last_usage_reset')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error("Profile Fetch Error (Admin):", error);
    return { allowed: false, error: "Could not fetch user profile stats" };
  }

  const now = new Date();
  const lastReset = profile.last_usage_reset ? new Date(profile.last_usage_reset) : new Date(0);
  const isSameDay = now.toDateString() === lastReset.toDateString();

  // 3. Reset counts if new day
  let currentImageCount = isSameDay ? (profile.current_image_upload_count || 0) : 0;
  let currentChatCount = isSameDay ? (profile.current_chat_input_count || 0) : 0;

  // 4. Check Limits
  const limitImage = profile.limit_image_upload ?? 15; 
  const limitChat = profile.limit_chat_input ?? 50;

  if (feature === 'image') {
    if (currentImageCount >= limitImage) {
      return { allowed: false, error: `Daily image upload limit reached (${limitImage}/${limitImage})` };
    }
    currentImageCount++;
  } else {
    if (currentChatCount >= limitChat) {
      return { allowed: false, error: `Daily chat limit reached (${limitChat}/${limitChat})` };
    }
    currentChatCount++;
  }

  // 5. Update DB using Admin Client
  const updateData = {
    current_image_upload_count: currentImageCount,
    current_chat_input_count: currentChatCount,
    last_usage_reset: now.toISOString()
  };

  const { error: updateError } = await supabaseAdmin
    .from('user_profiles')
    .update(updateData)
    .eq('id', user.id);

  if (updateError) {
    console.error("Update Usage Error:", updateError);
    return { allowed: false, error: "Failed to update usage stats" };
  }

  return { allowed: true, remainingImage: limitImage - currentImageCount, remainingChat: limitChat - currentChatCount };
}

export async function saveAnalysis(analysisData: any) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
      .from('analysis_results')
      .insert({
          user_id: user.id,
          analysis_json: JSON.stringify(analysisData)
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
    .select('limit_image_upload, limit_chat_input, current_image_upload_count, current_chat_input_count, last_usage_reset')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  const now = new Date();
  const lastReset = profile.last_usage_reset ? new Date(profile.last_usage_reset) : new Date(0);
  const isSameDay = now.toDateString() === lastReset.toDateString();

  const currentImage = isSameDay ? (profile.current_image_upload_count || 0) : 0;
  const currentChat = isSameDay ? (profile.current_chat_input_count || 0) : 0;

  return {
    image: {
      used: currentImage,
      limit: profile.limit_image_upload ?? 15,
      remaining: (profile.limit_image_upload ?? 15) - currentImage
    },
    chat: {
      used: currentChat,
      limit: profile.limit_chat_input ?? 50,
      remaining: (profile.limit_chat_input ?? 50) - currentChat
    }
  };
}
