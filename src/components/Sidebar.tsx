'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LogOut, Menu, X, Users, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import clsx from 'clsx';

import { useLanguage } from '@/context/LanguageContext';

/**
 * Sidebar component — ONLY used on /admin pages.
 * Shows "Manajemen User" menu + logout.
 * 
 * Regular users have MobileDashboardSidebar in dashboard layout.
 * Premium users have no sidebar (everything is in terminal dashboard).
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Admin-only nav items
  const navItems = [
    { name: 'Manajemen User', href: '/admin', icon: Users },
    { name: 'Broadcast Email', href: '/admin/broadcast', icon: Mail },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={clsx(
          "md:hidden fixed top-3 left-3 z-[110] p-2.5 rounded-xl shadow-lg border transition-all duration-300",
          isMobileOpen 
            ? "scale-0 opacity-0"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 scale-100 opacity-100"
        )}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm animate-in fade-in duration-200"
        />
      )}

      <aside className={clsx(
        "fixed left-0 top-0 h-screen flex flex-col py-8 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) group z-[100] border-r border-border dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden",
        // Mobile: Slide in/out
        isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
        // Desktop: Always visible. Collapsed → expand on hover.
        "md:translate-x-0 md:w-20 md:hover:w-72"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Header/Logo */}
        <div className="flex items-center px-4 mb-10 h-12 overflow-hidden shrink-0">
          <div className={clsx(
              "w-12 h-12 flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-md transition-all duration-500 border border-slate-100 dark:border-slate-800",
              "mx-0 md:mx-auto md:group-hover:mx-0"
          )}>
              <img src="/app-logo.png" alt="Trenova" className="w-8 h-8 object-contain" />
          </div>
          <div className={clsx(
              "ml-4 transition-all duration-500 ease-in-out whitespace-nowrap transform",
              isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
              "md:opacity-0 md:group-hover:opacity-100 md:translate-x-10 md:group-hover:translate-x-0"
          )}>
             <h1 className="text-xl font-bold tracking-wider text-foreground">{t('app_title')}</h1>
             <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Admin badge - shown on mobile and on desktop hover */}
        <div className={clsx(
          "px-3 pb-4 transition-all duration-500 overflow-hidden",
          "md:max-h-0 md:opacity-0 md:group-hover:max-h-20 md:group-hover:opacity-100"
        )}>
          <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Shield size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Administrator</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
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
                    isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
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

        {/* Footer / Logout */}
        <div className="px-3 shrink-0">
            <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <button 
                  onClick={handleLogout}
                  className="w-full flex items-center h-12 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-medium group/btn overflow-hidden"
              >
                  <div className={clsx(
                      "w-6 h-6 flex items-center justify-center shrink-0 transition-all duration-500",
                      "mx-0 md:mx-auto md:group-hover:mx-0"
                  )}>
                      <LogOut className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className={clsx(
                      "ml-4 transition-all duration-500 whitespace-nowrap text-sm",
                      isMobileOpen ? "opacity-100" : "opacity-0",
                      "md:opacity-0 md:group-hover:opacity-100"
                  )}>
                    Logout
                  </span>
              </button>

              <div className={clsx(
                  "flex items-center px-3 py-3 h-10 text-xs text-slate-400 whitespace-nowrap overflow-hidden transition-all",
                  "justify-start md:justify-center md:group-hover:justify-start"
              )}>
                <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                <span className={clsx(
                    "ml-3 transition-opacity duration-500 delay-100",
                    isMobileOpen ? "opacity-100" : "opacity-0",
                    "md:opacity-0 md:group-hover:opacity-100"
                )}>
                  v2.4.0 • Admin
                </span>
              </div>
            </div>
        </div>
      </aside>
    </>
  );
}
