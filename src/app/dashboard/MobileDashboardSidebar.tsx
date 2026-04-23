'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, X, LogOut, LayoutDashboard, History, Shield, 
  Clock, Zap, ChevronRight, Home, ExternalLink 
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import clsx from 'clsx';

interface DashboardSidebarProps {
  daysLeft: number;
  isExpired: boolean;
  tokenUsed: number;
  tokenLimit: number;
}

export default function DashboardSidebar({ 
  daysLeft, isExpired, tokenUsed, tokenLimit 
}: DashboardSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { t } = useLanguage();

  const tokenRemaining = tokenLimit - tokenUsed;
  const tokenPercent = tokenLimit > 0 ? Math.round((tokenUsed / tokenLimit) * 100) : 0;

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }
    }
    checkRole();
  }, [supabase]);

  // Close on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll on mobile when open
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

  const navItems = [
    { name: t('nav_dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav_history'), href: '/dashboard/history', icon: History },
    ...(isAdmin ? [{ name: t('nav_admin'), href: '/admin', icon: Shield }] : []),
  ];

  return (
    <>
      {/* ── Mobile-only hamburger button ── */}
      <button
        onClick={() => setIsMobileOpen(true)}
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

      {/* ── Mobile-only backdrop ── */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm animate-in fade-in duration-200"
        />
      )}

      {/* ── Sidebar ── 
           Mobile: slide-in drawer (translate-x based on isMobileOpen)
           Desktop: always visible, collapsed w-20, expands to w-72 on hover
      */}
      <aside className={clsx(
        "fixed left-0 top-0 h-screen flex flex-col transition-all duration-500 ease-in-out group z-[100]",
        "border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden",
        // Mobile: drawer behavior
        isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
        // Desktop: always visible, collapsed → expand on hover
        "md:translate-x-0 md:w-20 md:hover:w-72"
      )}>

        {/* ── Mobile close button ── */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* ── Logo / Header ── */}
        <div className="flex items-center px-4 pt-6 pb-4 h-auto overflow-hidden shrink-0">
          <div className={clsx(
            "w-12 h-12 flex items-center justify-center shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 transition-all duration-500",
            "mx-0 md:mx-auto md:group-hover:mx-0"
          )}>
            <img src="/app-logo.png" alt="Trenova" className="w-8 h-8 object-contain" />
          </div>
          <div className={clsx(
            "ml-4 transition-all duration-500 ease-in-out whitespace-nowrap transform",
            // Mobile: always visible when open
            isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
            // Desktop: visible on hover
            "md:opacity-0 md:group-hover:opacity-100 md:translate-x-10 md:group-hover:translate-x-0"
          )}>
            <h1 className="text-xl font-bold tracking-wider text-foreground">{t('app_title')}</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">{t('app_subtitle')}</p>
          </div>
        </div>

        {/* ── Info Cards (subscription + tokens) ── 
             Mobile: always visible when sidebar open
             Desktop: visible only on hover (max-height trick)
        */}
        <div className={clsx(
          "px-3 pb-3 space-y-2 transition-all duration-500 overflow-hidden",
          // Mobile
          isMobileOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0",
          // Desktop: expand on hover
          "md:max-h-0 md:opacity-0 md:group-hover:max-h-[300px] md:group-hover:opacity-100"
        )}>
          {/* Subscription */}
          <div className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl border",
            !isExpired 
              ? daysLeft > 7 
                ? "bg-emerald-50/80 dark:bg-emerald-900/15 border-emerald-200/80 dark:border-emerald-800" 
                : "bg-amber-50/80 dark:bg-amber-900/15 border-amber-200/80 dark:border-amber-800"
              : "bg-red-50/80 dark:bg-red-900/15 border-red-200/80 dark:border-red-800"
          )}>
            <Clock size={16} className={clsx(
              !isExpired 
                ? daysLeft > 7 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                : "text-red-500 dark:text-red-400"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscription</p>
              {!isExpired ? (
                <p className={clsx("text-xs font-black", daysLeft > 7 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                  {daysLeft} Days Left
                </p>
              ) : (
                <p className="text-xs font-black text-red-600 dark:text-red-400">Expired</p>
              )}
            </div>
          </div>

          {/* Token Usage */}
          <div className="bg-blue-50/80 dark:bg-blue-900/15 border border-blue-200/80 dark:border-blue-800 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-3 mb-1.5">
              <Zap size={16} className="text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Tokens</p>
                <p className="text-xs font-black text-blue-700 dark:text-blue-400">
                  {tokenRemaining} <span className="text-[9px] font-semibold text-blue-500/80">/ {tokenLimit}</span>
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-blue-200/60 dark:bg-blue-900/40 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-700",
                  tokenPercent > 80 ? "bg-red-500" : tokenPercent > 50 ? "bg-amber-500" : "bg-blue-500"
                )} 
                style={{ width: `${tokenPercent}%` }} 
              />
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
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
                  "mx-0 md:mx-auto md:group-hover:mx-0"
                )}>
                  <item.icon
                    className={clsx(
                      'w-5 h-5 transition-transform duration-300 group-hover/item:scale-110',
                      isActive ? 'text-neon' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                </div>
                <span className={clsx(
                  "ml-4 font-medium whitespace-nowrap transition-all duration-500 transform text-sm",
                  // Mobile: visible when open
                  isMobileOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
                  // Desktop: visible on hover
                  "md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0"
                )}>
                  {item.name}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer: Logout + version ── */}
        <div className="px-3 pb-4 shrink-0">
          <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-1.5">
            {/* Logout */}
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

            {/* Version */}
            <div className={clsx(
              "flex items-center px-3 py-2 h-10 text-xs text-slate-400 whitespace-nowrap overflow-hidden transition-all",
              "justify-start md:justify-center md:group-hover:justify-start"
            )}>
              <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
              <span className={clsx(
                "ml-3 transition-opacity duration-500 delay-100",
                isMobileOpen ? "opacity-100" : "opacity-0",
                "md:opacity-0 md:group-hover:opacity-100"
              )}>
                v2.4.0 • Active
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
