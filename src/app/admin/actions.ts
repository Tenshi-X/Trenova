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
  request_quota: number;
  created_at: string;
  status?: string; // Derived or future field
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

export async function provisionUser(userId: string, email: string, role: string, quota: number) {
  const admin = createSupabaseAdminClient();
  if (!admin) return { success: false, error: "Configuration Error" };

  // 1. Update Auth Metadata (optional but good for sync)
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role, request_quota: quota }
  });

  // 2. Insert/Update User Profile
  const { error } = await admin
    .from('user_profiles')
    .upsert({
      id: userId,
      email: email,
      role: role,
      request_quota: quota,
      // created_at will be auto-managed or preserved if upsert
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
    
    // Optional: Delete from Auth too? 
    // The user requirement implies "admin is purely for managing profiles from auth data"
    // Usually we don't delete Auth user just by deleting profile unless explicitly asked.
    // I will only delete profile for now as "deprovisioning".

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/admin');
    return { success: true };
}
