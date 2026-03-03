'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type AuthUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  subscription_end_at: string | null;
  created_at: string;
  status?: string; // Derived or future field
  analysis_limit?: number;
  current_analysis_count?: number;
};

export async function getAuthUsers() {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Service Role Key missing" };

  const { data: { users }, error } = await admin.auth.admin.listUsers();
  
  if (error) {
    console.error("Fetch Auth Users Error:", error);
    return { success: false, error: error.message };
  }

  // Filter out users that might be deleted or irrelevant if needed
  return { success: true, users: users as AuthUser[] };
}

export async function getUserProfiles() {
  // We can use the regular server client here if RLS allows reading all profiles for admin
  // But safer to use admin client to ensure we get everything
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Service Role Key missing" };

  const { data, error } = await admin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch Profiles Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, profiles: data as UserProfile[] };
}

const calculateEndDate = (days: number, fromDate: Date = new Date()) => {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export async function provisionUser(
  userId: string, 
  email: string, 
  role: string, 
  days: number, 
  addAnalysisLimit: number,
  totalAnalysisLimit: number
) {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Configuration Error" };
  
  // 1. Check existing profile for Subscription Extension and Limits
  const { data: currentProfile } = await admin
    .from('user_profiles')
    .select('subscription_end_at, analysis_limit, current_analysis_count')
    .eq('id', userId)
    .single();

  let endAt;
  const now = new Date();
  const currentEnd = currentProfile?.subscription_end_at ? new Date(currentProfile.subscription_end_at) : null;

  if (currentEnd && currentEnd > now) {
     endAt = calculateEndDate(days, currentEnd);
  } else {
     endAt = calculateEndDate(days);
  }

  // Handle Analysis Limits
  const oldLimit = currentProfile?.analysis_limit ?? 150;
  const oldUsed = currentProfile?.current_analysis_count ?? 0;
  const oldRemaining = Math.max(0, oldLimit - oldUsed);

  const newLimit = totalAnalysisLimit;
  const newRemaining = oldRemaining + addAnalysisLimit;

  if (newRemaining > newLimit) {
    return { success: false, error: `Limit cannot exceed total limit (${newRemaining}/${newLimit}). Please increase total limit first.` };
  }

  const newUsed = newLimit - newRemaining;

  // 2. Update Auth Metadata
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role, subscription_end_at: endAt }
  });

  // 3. Insert/Update User Profile
  const { error } = await admin
    .from('user_profiles')
    .upsert({
      id: userId,
      email: email,
      role: role,
      subscription_end_at: endAt,
      analysis_limit: newLimit,
      current_analysis_count: newUsed
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteUserProfile(userId: string) {
    const admin = createSupabaseAdminClient();
    if (!admin) return { success: false, error: "Configuration Error" };

    // Delete from profiles
    const { error } = await admin.from('user_profiles').delete().eq('id', userId);

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/admin');
    return { success: true };
}

export async function createAndProvisionUser(email: string, password: string, role: string, days: number, analysisLimit: number) {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Configuration Error" };

  // DELAYED SUBSCRIPTION LOGIC:
  // We do NOT set subscription_end_at immediately. We set it to null.
  // We store 'initial_plan_days' in metadata so it can be activated on first login.
  const endAt = null; 

  // 1. Create User (Auto-confirm)
  const { data: { user }, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
        role, 
        subscription_end_at: endAt,
        initial_plan_days: days // Store days for later activation
    }
  });

  if (createError) return { success: false, error: createError.message };
  if (!user) return { success: false, error: "Failed to create user" };

  // 2. Insert into User Profile
  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({
      id: user.id, // Link to Auth ID
      email: email,
      role: role,
      subscription_end_at: endAt, // Null initially
      analysis_limit: analysisLimit,
      // created_at defaults to now()
    });

  if (profileError) {
    return { success: false, error: `Auth created but Profile failed: ${profileError.message}` };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function generateDummyUsers(count: number) {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Configuration Error" };

  let successCount = 0;
  let failCount = 0;
  
  // Store created users to display to admin
  const createdUsers: any[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random user data
    const randomId = Math.random().toString(36).substring(2, 8);
    const email = `user_${randomId}@trenova.com`;
    const password = `pass_${randomId}`; // Simple password
    
    // REQUIREMENT: Role always 'user'
    const role = 'user';
    const days = 30; // 30 days for user
    
    // DELAYED SUBSCRIPTION LOGIC:
    const endAt = null;

    try {
        const { data: { user }, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { 
                role, 
                subscription_end_at: endAt,
                initial_plan_days: days
            }
        });

        if (createError || !user) {
            console.error(`Failed to create dummy ${email}:`, createError);
            failCount++;
            continue;
        }

        const { error: profileError } = await admin
            .from('user_profiles')
            .upsert({
                id: user.id,
                email: email,
                role: role,
                subscription_end_at: endAt,
                // Defaults for dummy users
                analysis_limit: 150
            });

        if (profileError) {
             console.error(`Failed to profile dummy ${email}:`, profileError);
             failCount++;
        } else {
            successCount++;
            createdUsers.push({ email, password, role });
        }

    } catch (e) {
        console.error("Dummy Gen Error:", e);
        failCount++;
    }
  }

  revalidatePath('/admin');
  // Return the list of created users
  return { success: true, count: successCount, failures: failCount, users: createdUsers };
}
