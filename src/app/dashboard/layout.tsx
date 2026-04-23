export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Clock, AlertTriangle, Lock, Mail, Zap } from 'lucide-react';
import Link from 'next/link';
import { getUserUsage } from './actions';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileDashboardSidebar from './MobileDashboardSidebar';

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

  // --- BLOCKING VIEW FOR EXPIRED USERS (admin bypasses this) ---
  if (user && isExpired && !isAdmin) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-in zoom-in duration-300">
                    <Lock size={32} />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Access Restricted</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Your Trenova subscription plan has expired. <br/>
                        You need to renew your plan to continue accessing the dashboard and AI intelligence.
                    </p>
                </div>

                <div className="pt-4 space-y-3">
                    <Link
                        href="mailto:trenova151@gmail.com?subject=Renew Subscription"
                        className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all hover:-translate-y-1 shadow-lg shadow-slate-900/20"
                    >
                        <Mail size={18} />
                        Contact Developer
                    </Link>
                    <Link 
                        href="/"
                        className="block w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold text-sm transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
                
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">User ID: {user.id.slice(0, 8)}...</p>
                </div>
            </div>
        </div>
    );
  }

  const tokenUsed = usageStats?.analysis?.used ?? 0;
  const tokenLimit = usageStats?.analysis?.limit ?? 150;
  const tokenRemaining = usageStats?.analysis?.remaining ?? 150;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-300 ml-0 md:ml-20">
      {/* ── Top Navbar ── */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 sticky top-0 z-40">
         <div className="flex items-center justify-between">
            {/* Logo - with padding-left on mobile for hamburger */}
            <div className="flex items-center gap-2.5 font-bold text-lg text-foreground pl-12 md:pl-0">
                <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 dark:border-slate-800 md:hidden" />
                <span className="hidden md:inline">Trenova Dashboard</span>
                <span className="md:hidden text-sm">Trenova</span>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              
              {/* Token Badge - visible on ALL screen sizes */}
              {usageStats && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm">
                      <Zap size={13} className="fill-blue-700 dark:fill-blue-400" />
                      <span className="hidden sm:inline">{tokenRemaining} / {tokenLimit} Runs</span>
                      <span className="sm:hidden">{tokenRemaining}</span>
                  </div>
              )}

              {/* Subscription Days Badge - visible on ALL screen sizes */}
              {user && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  !isExpired 
                    ? daysLeft > 7 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-sm" 
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                }`}>
                  {!isExpired ? (
                    <>
                      <Clock size={13} className={daysLeft > 7 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
                      <span className="hidden sm:inline">{daysLeft} Days Left</span>
                      <span className="sm:hidden">{daysLeft}d</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} />
                      <span>Expired</span>
                    </>
                  )}
                </div>
              )}
            </div>
         </div>
      </nav>

      {/* ── Dashboard Sidebar (works on all screen sizes) ── */}
      <MobileDashboardSidebar 
        daysLeft={daysLeft}
        isExpired={isExpired}
        tokenUsed={tokenUsed}
        tokenLimit={tokenLimit}
      />
      
      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
