import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trenova - Trading Intelligence",
  description: "AI-powered trading trends and analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex bg-background text-foreground overflow-hidden`}
      >
        <Sidebar />
        <main className="flex-1 ml-64 h-screen overflow-y-auto p-8 relative">
          {/* Background Gradient/Glow effects */}
          {/* Background Gradient/Glow effects - Removed for cleaner look */}
          <div className="fixed inset-0 pointer-events-none z-[-1] opacity-40">
             <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-light/50 rounded-full blur-[100px]" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[100px]" />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
