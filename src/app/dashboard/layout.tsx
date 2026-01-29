import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Clock, AlertTriangle, Lock, Mail } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { getUserUsage } from './actions';
import { Zap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const usageStats = await getUserUsage();

  let daysLeft = 0;
  let isExpired = true; // Default to locked only if checking validation fails consistently

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

    if (profile?.subscription_end_at) {
      const end = new Date(profile.subscription_end_at);
      const now = new Date();
      // Calculate difference in days
      const diffTime = end.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // If daysLeft is positive, it's active. If 0 or negative, it's expired.
      // E.g. 0.1 days left rounds up to 1. -0.1 days rounds up to 0.
      isExpired = daysLeft <= 0;
    } else {
        // No subscription date found -> Treat as expired
        isExpired = true;
    }
  }

  // --- BLOCKING VIEW FOR EXPIRED USERS ---
  if (user && isExpired) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-in zoom-in duration-300">
                    <Lock size={32} />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Your Trenova subscription plan has expired. <br/>
                        You need to renew your plan to continue accessing the dashboard and AI intelligence.
                    </p>
                </div>

                <div className="pt-4 space-y-3">
                    <Link
                        href="mailto:trenova151@gmail.com?subject=Renew Subscription"
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-lg shadow-slate-900/20"
                    >
                        <Mail size={18} />
                        Contact Developer
                    </Link>
                    <Link 
                        href="/"
                        className="block w-full py-3 text-slate-400 hover:text-slate-600 font-semibold text-sm transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-400">User ID: {user.id.slice(0, 8)}...</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-all duration-300">
      {/* Simple Topbar for now, can be expanded */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 sticky top-0 z-40">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg md:text-xl text-foreground pl-12 md:pl-0">
                <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100" />
                Trenova
            </div>
            
            {/* User Profile / Status */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              {usageStats && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                      <Zap size={14} className="fill-blue-700" />
                      <span>{usageStats.analysis.remaining} / {usageStats.analysis.limit} Runs</span>
                  </div>
              )}

              {user && (
                <div className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                  !isExpired 
                    ? daysLeft > 7 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" 
                      : "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {!isExpired ? (
                    <>
                      <Clock size={14} className={daysLeft > 7 ? "text-emerald-600" : "text-amber-600"} />
                      <span className="hidden sm:inline">{daysLeft} Days Left</span>
                      <span className="sm:hidden">{daysLeft}d</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      <span>Expired</span>
                    </>
                  )}
                </div>
              )}
            </div>
         </div>
      </nav>
      
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
}
