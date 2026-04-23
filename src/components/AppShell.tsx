'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sidebar ONLY appears on /admin pages
  // - /dashboard → has its own MobileDashboardSidebar in layout
  // - /terminal  → premium, no sidebar needed
  // - Other pages (login, home, feedback) → no sidebar
  const showSidebar = pathname?.startsWith('/admin');
  
  return (
    <ThemeProvider>
      {showSidebar && <Sidebar />}
      <main 
        className={`flex-1 h-screen overflow-y-auto relative transition-all duration-300 ${
          showSidebar ? 'ml-0 md:ml-20' : 'w-full'
        }`}
      >
        {/* Background Gradient/Glow effects */}
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-40">
           <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-light/50 dark:bg-neon-dark/20 rounded-full blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-slate-200/50 dark:bg-slate-900/50 rounded-full blur-[100px]" />
        </div>
        {children}
      </main>
    </ThemeProvider>
  );
}
