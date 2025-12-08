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

  // Hide Sidebar on Auth pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/') return null;

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }
      setLoading(false);
    }
    checkRole();
  }, [supabase]);

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
    <aside className="fixed left-0 top-0 h-screen w-64 glass flex flex-col p-6 z-50">
      <div className="flex items-center gap-3 mb-10 text-neon">
        <Activity className="w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-wider text-glow">TRENOVA</h1>
      </div>

      <nav className="flex-1 space-y-4">
        {!loading && navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group',
                isActive
                  ? 'bg-neon/10 text-neon border border-neon/20 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon
                className={clsx(
                  'w-5 h-5 transition-transform duration-300',
                  isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]' : 'group-hover:scale-105'
                )}
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium group"
        >
            <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
            Logout
        </button>

        <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
          Connected to Mainnet
        </div>
      </div>
    </aside>
  );
}
