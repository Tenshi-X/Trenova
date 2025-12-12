'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Shield, Activity, LogOut } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import clsx from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Move early return check after hooks or handle conditionally in render
  // Ideally, layout should control visibility, but fixing here for now
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

  if (!shouldShow) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chatbot', href: '/chatbot', icon: MessageSquare },
    // Only show Admin if role is admin
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 hover:w-72 glass flex flex-col py-8 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) group z-50 border-r border-border bg-white/95 backdrop-blur-xl shadow-2xl hover:shadow-3xl">
      {/* Header/Logo */}
      <div className="flex items-center px-4 mb-10 h-12 overflow-hidden">
        <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-gradient-to-br from-neon to-neon-dark rounded-xl text-white shadow-lg mx-auto group-hover:mx-0 transition-all duration-500">
            <Activity className="w-6 h-6" />
        </div>
        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap transform translate-x-10 group-hover:translate-x-0">
           <h1 className="text-xl font-bold tracking-wider text-foreground">TRENOVA</h1>
           <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-3">
        {!loading && navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center h-12 px-3 rounded-xl transition-all duration-300 relative overflow-hidden group/item',
                isActive
                  ? 'bg-neon-light/50 text-neon-dark shadow-sm border border-neon/10'
                  : 'text-slate-500 hover:text-foreground hover:bg-slate-50'
              )}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0 mx-auto group-hover:mx-0 transition-all duration-300">
                  <item.icon
                    className={clsx(
                      'w-6 h-6 transition-transform duration-300 group-hover/item:scale-110',
                      isActive ? 'text-neon' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
              </div>
              <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 text-sm">
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
      <div className="px-3">
          <div className="pt-6 border-t border-dashed border-slate-200 space-y-2">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center h-12 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-medium group/btn overflow-hidden"
            >
                <div className="w-6 h-6 flex items-center justify-center shrink-0 mx-auto group-hover:mx-0">
                    <LogOut className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                </div>
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap text-sm">
                  Sign Out
                </span>
            </button>

            <div className="flex items-center px-3 py-3 h-10 text-xs text-slate-400 whitespace-nowrap overflow-hidden justify-center group-hover:justify-start transition-all">
              <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                v2.4.0 • Stable
              </span>
            </div>
          </div>
      </div>
    </aside>
  );
}
