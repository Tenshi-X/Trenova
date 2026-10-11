'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sidebar ONLY appears on /admin pages
  // - /dashboard → has its own MobileDashboardSidebar in layout
  // - Other pages (login, home, feedback) → no sidebar
  const showSidebar = pathname?.startsWith('/admin');
  
  return (
    <ThemeProvider>
      {showSidebar && <Sidebar />}
      <div
        id="app-scroll"
        className={`flex-1 h-screen overflow-y-auto relative transition-all duration-300 ${
          showSidebar ? 'ml-0 md:ml-20' : 'w-full'
        }`}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}
