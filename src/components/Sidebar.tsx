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
    <aside className="fixed left-0 top-0 h-screen w-64 glass flex flex-col p-6 z-50 border-r border-border">
      <div className="flex items-center gap-3 mb-10 text-neon-dark">
        <Activity className="w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-wider text-glow">TRENOVA</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {!loading && navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                isActive
                  ? 'bg-neon-light text-neon-dim shadow-sm border border-neon-light/50'
                  : 'text-gray-500 hover:text-foreground hover:bg-gray-100'
              )}
            >
              <item.icon
                className={clsx(
                  'w-5 h-5 transition-transform duration-200',
                  isActive ? 'text-neon' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border space-y-4">
        <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium group"
        >
            <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
            Logout
        </button>

        <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
      </div>
    </aside>
  );
}
