'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/login' || pathname === '/' || pathname === '/feedback';
  
  // Verify if valid session exists? For now depend on page logic
  // Just layout control here.

  return (
    <>
      {!isLoginPage && <Sidebar />}
      <main 
        className={`flex-1 h-screen overflow-y-auto relative transition-all duration-300 ${
          isLoginPage ? 'w-full' : 'ml-0 md:ml-20' /* ml-0 on mobile, ml-20 on desktop */
        }`}
      >
        {/* Background Gradient/Glow effects */}
        <div className="fixed inset-0 pointer-events-none z-[-1] opacity-40">
           <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-light/50 rounded-full blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[100px]" />
        </div>
        {children}
      </main>
    </>
  );
}
