'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Shield, Activity, LogOut, Menu } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import clsx from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Move early return check after hooks or handle conditionally in render
  // Ideally, layout should control visibility, but fixing here for now
  const shouldShow = pathname !== '/login' && pathname !== '/';

  useEffect(() => {
    async function checkRole() {
      if (!shouldShow) return; 
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }
      setLoading(false);
    }
    checkRole();
  }, [supabase, shouldShow]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (!shouldShow) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = pathname?.startsWith('/admin') 
    ? [
        { name: 'Admin', href: '/admin', icon: Shield },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'History', href: '/dashboard/history', icon: Activity },
        ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
      ];


  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-3 left-3 z-[110] p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside className={clsx(
        "fixed left-0 top-0 h-screen flex flex-col py-8 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) group z-[100] border-r border-border dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden",
        // Mobile: Slide in/out. When open, full width 72. When closed, hidden off-screen.
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
        // Desktop: Always visible. Default collapsed (w-20), hover to expand (w-72).
        "md:translate-x-0 md:w-20 md:hover:w-72"
      )}>
        {/* Header/Logo */}
        <div className="flex items-center px-4 mb-10 h-12 overflow-hidden shrink-0">
          <div className={clsx(
              "w-12 h-12 flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-md transition-all duration-500 border border-slate-100 dark:border-slate-800",
              // Mobile: Always allow expanding to show logo
              // Desktop: Move margin on hover to center or left align
              "mx-0 md:mx-auto md:group-hover:mx-0"
          )}>
              <img src="/app-logo.png" alt="Trenova" className="w-8 h-8 object-contain" />
          </div>
          <div className={clsx(
              "ml-4 transition-all duration-500 ease-in-out whitespace-nowrap transform",
              // Mobile: Always visible if sidebar is open
              isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
              // Desktop: Only visible on hover
              "md:opacity-0 md:group-hover:opacity-100 md:translate-x-10 md:group-hover:translate-x-0"
          )}>
             <h1 className="text-xl font-bold tracking-wider text-foreground">TRENOVA</h1>
             <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-3 overflow-y-auto overflow-x-hidden">
          {!loading && navItems.map((item) => {
            const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center h-12 px-3 rounded-xl transition-all duration-300 relative overflow-hidden group/item shrink-0',
                  isActive
                    ? 'bg-neon-light/50 dark:bg-neon/10 text-neon-dark dark:text-neon shadow-sm border border-neon/10 dark:border-neon/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                )}
              >
                <div className={clsx(
                    "w-6 h-6 flex items-center justify-center shrink-0 transition-all duration-300",
                    // Mobile: Always aligned left
                    // Desktop: Center then left on hover
                    "mx-0 md:mx-auto md:group-hover:mx-0"
                )}>
                    <item.icon
                      className={clsx(
                        'w-6 h-6 transition-transform duration-300 group-hover/item:scale-110',
                        isActive ? 'text-neon' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      )}
                    />
                </div>
                <span className={clsx(
                    "ml-4 font-medium whitespace-nowrap transition-all duration-500 transform text-sm",
                    // Mobile: Always visible
                    isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
                    // Desktop: Fade in on hover
                    "md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0"
                )}>
                  {item.name}
                </span>
                
                {/* Active Indicator Line */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="px-3 shrink-0">
            <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <button 
                  onClick={handleLogout}
                  className="w-full flex items-center h-12 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-medium group/btn overflow-hidden"
              >
                  <div className={clsx(
                      "w-6 h-6 flex items-center justify-center shrink-0 transition-all duration-500",
                      // Mobile: Align left
                      // Desktop: Center then left
                      "mx-0 md:mx-auto md:group-hover:mx-0"
                  )}>
                      <LogOut className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className={clsx(
                      "ml-4 transition-all duration-500 whitespace-nowrap text-sm",
                      isMobileOpen ? "opacity-100" : "opacity-0",
                      "md:opacity-0 md:group-hover:opacity-100"
                  )}>
                    Sign Out
                  </span>
              </button>

              <div className={clsx(
                  "flex items-center px-3 py-3 h-10 text-xs text-slate-400 whitespace-nowrap overflow-hidden transition-all",
                  // Mobile: Always start aligned
                  // Desktop: Center then start aligned
                  "justify-start md:justify-center md:group-hover:justify-start"
              )}>
                <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                <span className={clsx(
                    "ml-3 transition-opacity duration-500 delay-100",
                    isMobileOpen ? "opacity-100" : "opacity-0",
                    "md:opacity-0 md:group-hover:opacity-100"
                )}>
                  v2.4.0 • Stable
                </span>
              </div>
            </div>
        </div>
      </aside>
    </>
  );
}
