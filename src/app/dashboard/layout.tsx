export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { activatePendingSubscription, getUserUsage } from './actions';
import DashboardChrome from './DashboardChrome';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  if (user) await activatePendingSubscription();
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
      .select('subscription_end_at, role, pending_plan_review')
      .eq('id', user.id)
      .single();

    // Check admin status from profile role OR user metadata
    isAdmin = profile?.role === 'admin';

    // Admin → redirect to /admin panel
    if (isAdmin) {
      redirect('/admin');
    }

    if (profile?.subscription_end_at && !profile.pending_plan_review) {
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

  const tokenUsed = usageStats?.analysis?.used ?? 0;
  const tokenLimit = usageStats?.analysis?.limit ?? 0;
  const tokenRemaining = usageStats?.analysis?.remaining ?? 0;

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
