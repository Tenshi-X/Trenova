'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/login' || pathname === '/' || pathname === '/feedback';
  
  return (
    <ThemeProvider>
      {!isLoginPage && <Sidebar />}
      <main 
        className={`flex-1 h-screen overflow-y-auto relative transition-all duration-300 ${
          isLoginPage ? 'w-full' : 'ml-0 md:ml-20' /* ml-0 on mobile, ml-20 on desktop */
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
