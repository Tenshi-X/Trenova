'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, History, Settings2, MessageSquare, Home, LogOut, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export default function MobileDashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const items = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: t('nav_history'), href: '/dashboard/history', icon: History },
    { label: language === 'id' ? 'Preferensi' : 'Preferences', href: '/dashboard/preferences', icon: Settings2 },
    { label: t('nav_feedback'), href: '/dashboard/feedback', icon: MessageSquare },
  ];
  async function signOut() {
    setSigningOut(true); setError('');
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      router.push('/sign-in'); router.refresh();
    } catch {
      setError(language === 'id' ? 'Gagal keluar. Coba lagi.' : 'Could not sign out. Try again.');
      setSigningOut(false);
    }
  }
  return <>
    <nav className="terminal-navigation" aria-label={language === 'id' ? 'Menu pelanggan' : 'Customer navigation'}>
      <div className="terminal-route-links">
        {items.map(({ label, href, icon: Icon }) => <Link key={href} href={href}
          aria-current={pathname === href ? 'page' : undefined} className="terminal-route">
          <Icon size={14} aria-hidden="true" /><span>{label}</span>
        </Link>)}
      </div>
      <div className="terminal-nav-actions">
        <Link href="/" className="terminal-icon-button" aria-label={language === 'id' ? 'Beranda' : 'Home'} title={language === 'id' ? 'Beranda' : 'Home'}><Home size={16} /></Link>
        <button type="button" className="terminal-icon-button" onClick={signOut} disabled={signingOut}
          aria-label={t('nav_signout')} title={t('nav_signout')}>
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        </button>
      </div>
    </nav>
    {error && <p role="alert" className="terminal-nav-error">{error}</p>}
  </>;
}
