import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "sonner";
import MetaPixel from "@/components/MetaPixel";
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
  description: "AI-powered trading trends and analysis. Discover the next big crypto moves before they happen with our advanced terminal.",
  keywords: [
    "trading", "AI analysis", "crypto", "trading trends", "Trenova", 
    "terminal", "trading intelligence", "crypto signals"
  ],
  authors: [{ name: "Trenova Intelligence" }],
  openGraph: {
    title: "Trenova - Trading Intelligence",
    description: "AI-powered trading trends and analysis. Discover the next big crypto moves before they happen with our advanced terminal.",
    url: "https://trenova-intelligence.vercel.app",
    siteName: "Trenova Intelligence",
    images: [
      {
        url: "https://trenova-intelligence.vercel.app/app-logo.png", // NOTE: Replace with a wider OG image if available (e.g. 1200x630)
        width: 800,
        height: 600,
        alt: "Trenova Trading Intelligence Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trenova - Trading Intelligence",
    description: "AI-powered trading trends and analysis. Discover the next big crypto moves before they happen with our advanced terminal.",
    images: ["https://trenova-intelligence.vercel.app/app-logo.png"], // NOTE: Replace with a specific Twitter image if available
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/app-logo.png",
    shortcut: "/app-logo.png",
    apple: "/app-logo.png",
  },
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
        <LanguageProvider>
          <AppShell>
            {children}
            <Toaster position="top-center" richColors />
          </AppShell>
        </LanguageProvider>
        <Suspense>
          <MetaPixel />
        </Suspense>
      </body>
    </html>
  );
}
