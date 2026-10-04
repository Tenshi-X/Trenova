export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserUsage } from './actions';
import DashboardBlockedView from './DashboardBlockedView';
import DashboardChrome from './DashboardChrome';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const usageStats = await getUserUsage();

  let daysLeft = 0;
  let isExpired = true;
  let isAdmin = false;

  if (user) {
    // Use Admin Client to ensure we can read the profile regardless of RLS policies
    const admin = createSupabaseAdminClient();
    
    // If admin key is missing, fall back to regular client (less reliable if RLS is tight)
    const clientToUse = admin || supabase;

    const { data: profile } = await clientToUse
      .from('user_profiles')
      .select('subscription_end_at, role')
      .eq('id', user.id)
      .single();

    // Check admin status from profile role OR user metadata
    isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin';

    // Admin → redirect to /admin panel
    if (isAdmin) {
      const { redirect } = await import('next/navigation');
      redirect('/admin');
    }

    // Premium → redirect to premium terminal
    if (profile?.role === 'premium') {
      const { redirect } = await import('next/navigation');
      redirect('/terminal');
    }

    if (profile?.subscription_end_at) {
      const end = new Date(profile.subscription_end_at);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysLeft <= 0;
    } else {
        // No subscription date found -> Treat as expired (except admin)
        isExpired = !isAdmin;
    }
  }

  const isNewAccount = user && !isAdmin && isExpired && daysLeft === 0;

  // --- BLOCKING VIEW FOR EXPIRED USERS (admin bypasses this, translated client-side) ---
  if (user && isExpired && !isAdmin) {
    return <DashboardBlockedView isNewAccount={!!isNewAccount} userIdPrefix={user.id.slice(0, 8)} />;
  }

  const tokenUsed = usageStats?.analysis?.used ?? 0;
  const tokenLimit = usageStats?.analysis?.limit ?? 150;
  const tokenRemaining = usageStats?.analysis?.remaining ?? 150;

  return (
    <DashboardChrome
      daysLeft={daysLeft}
      isExpired={isExpired}
      tokenUsed={tokenUsed}
      tokenLimit={tokenLimit}
      tokenRemaining={tokenRemaining}
      showTokenBadge={!!usageStats}
      showSubBadge={!!user}
    >
      {children}
    </DashboardChrome>
  );
}
