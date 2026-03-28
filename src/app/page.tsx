'use client';

import Link from 'next/link';
import { Menu, X, Lock, CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MarqueeTicker from '@/components/MarqueeTicker';

import TerminalHero from '@/components/TerminalHero';
import TerminalProof from '@/components/TerminalProof';
import TerminalFeatures from '@/components/TerminalFeatures';
import TerminalComparison from '@/components/TerminalComparison';
import TerminalHow from '@/components/TerminalHow';
import TerminalCredibility from '@/components/TerminalCredibility';
import TerminalFAQ from '@/components/TerminalFAQ';
import TerminalCTA from '@/components/TerminalCTA';
import TerminalFooter from '@/components/TerminalFooter';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-neon selection:text-white pb-0">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-950 border-b border-slate-800 shadow-sm ${scrolled ? 'py-4' : 'py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-3 justify-start relative z-50">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white font-mono uppercase">TRENOVA</span>
          </div>

          <div className="flex items-center gap-4 justify-end">
            <a href="https://discord.gg/gGdkQypYWM" target="_blank" rel="noopener noreferrer" className="hidden md:block text-sm font-bold text-slate-400 hover:text-white transition-colors mr-2 font-mono">
              [COMMUNITY]
            </a>

            <div className="hidden md:flex items-center gap-3 mr-2 border-r border-slate-800 pr-4">
               <LanguageSwitcher />
               <ThemeToggle />
            </div>

            <Link href="/sign-in" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-neon transition-colors font-mono">
              <LogIn size={16} />
              {t('nav_login')}
            </Link>

            <a href="https://s.shopee.co.id/LiCMmnIOs" target="_blank" rel="noopener noreferrer" className="hidden sm:block bg-neon text-slate-950 px-5 py-2.5 rounded text-sm font-bold hover:bg-emerald-400 transition-all shadow-neon/20 font-mono">
              &gt; INIT
            </a>

             <div className="md:hidden flex items-center gap-2 relative z-50">
               <LanguageSwitcher />
               <ThemeToggle />
               <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 ml-2 text-slate-400 hover:bg-slate-800 rounded transition-colors"
               >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[72px] z-40 bg-slate-950 border-t border-slate-800 p-6 md:hidden animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="flex flex-col space-y-4 font-mono">
              <a 
                href="https://discord.gg/gGdkQypYWM" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 rounded bg-slate-900 border border-slate-800 text-lg font-bold text-slate-300 flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                [COMMUNITY]
                <ArrowRight size={20} className="text-neon" />
              </a>
              <Link 
                href="/sign-in" 
                className="p-4 rounded bg-slate-900 border border-slate-800 text-lg font-bold text-slate-300 flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2"><LogIn size={20} /> {t('nav_login')}</span>
                <ArrowRight size={20} className="text-neon" />
              </Link>
              <a 
                href="https://s.shopee.co.id/LiCMmnIOs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 text-center rounded bg-neon text-slate-950 font-bold text-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                &gt; INITIALIZE
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Marquee Ticker */}
      <div className="relative z-20 pt-24 border-b border-slate-800 bg-slate-950">
         <MarqueeTicker />
      </div>

      <TerminalHero />
      <TerminalFeatures />
      <TerminalComparison />
      <TerminalHow />
      <TerminalProof />
      <TerminalCredibility />

      {/* Pricing Section (Unchanged content, adapted to keep existing styling) */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 transition-colors">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-6">
                  <Lock size={14} />
                  {t('pricing_pill')}
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('pricing_title')}</h2>
               <p className="text-slate-500 dark:text-slate-400 text-lg">{t('pricing_desc')}</p>
            </div>

            {/* Standard Plan Label */}
            <div className="mb-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Standard Plan</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
               </div>
               <p className="text-center text-xs text-slate-400 dark:text-slate-500">Gemini AI · 1 Timeframe · Tanpa Risk Management Otomatis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
               {/* Product 1 */}
               <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:border-neon/30 hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <div className="mb-6 relative z-10">
                     <h3 className="text-xl font-extrabold text-foreground uppercase tracking-wide">{t('plan_prod1_title')}</h3>
                     <p className="text-emerald-500 font-semibold text-sm mt-1">{t('plan_prod1_sub')}</p>
                  </div>
                  <div className="mb-8 space-y-4 flex-grow text-sm relative z-10">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">50 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp55.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">300 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp165.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">450 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp250.000</span>
                     </div>
                     <div className="flex justify-between items-center pt-1 border-transparent">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">1000 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp450.000</span>
                     </div>
                  </div>
                  <div className="mt-auto relative z-10">
                     <a 
                        href="https://s.shopee.co.id/LiCMmnIOs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 text-foreground dark:text-white rounded-xl font-bold hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-sm inline-block"
                     >
                        {t('plan_btn')}
                     </a>
                  </div>
               </div>

               {/* Product 2 */}
               <div className="bg-slate-50 dark:bg-[#0f172a] border border-neon/50 dark:border-neon rounded-3xl p-6 hover:shadow-2xl hover:shadow-neon/20 transition-all duration-300 flex flex-col relative transform lg:-translate-y-4 shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-b from-neon/5 to-transparent rounded-3xl pointer-events-none"></div>
                  <div className="absolute top-0 right-0 bg-neon text-white text-[11px] font-black px-4 py-1.5 rounded-bl-xl rounded-tr-3xl tracking-wider uppercase shadow-md">
                     POPULAR
                  </div>
                  <div className="mb-6 pt-2 relative z-10">
                     <h3 className="text-xl font-extrabold text-foreground uppercase tracking-wide">{t('plan_prod2_title')}</h3>
                     <p className="text-emerald-500 font-semibold text-sm mt-1">{t('plan_prod2_sub')}</p>
                  </div>
                  <div className="mb-8 space-y-4 flex-grow text-sm relative z-10">
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">50 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp100.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">300 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp300.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">450 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp450.000</span>
                     </div>
                     <div className="flex justify-between items-center pt-1 border-transparent">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">1000 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp800.000</span>
                     </div>
                  </div>
                  <div className="mt-auto relative z-10">
                     <a 
                        href="https://s.shopee.co.id/70F6J5qP1j" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-neon hover:bg-neon-dim text-white rounded-xl font-bold transition-all text-center text-sm flex items-center justify-center gap-2 shadow-lg shadow-neon/30 active:scale-95"
                     >
                        {t('plan_btn')} <ArrowRight size={18} />
                     </a>
                  </div>
               </div>

               {/* Product 3 */}
               <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:border-neon/30 hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <div className="mb-6 relative z-10">
                     <h3 className="text-xl font-extrabold text-foreground uppercase tracking-wide">{t('plan_prod3_title')}</h3>
                     <p className="text-emerald-500 font-semibold text-sm mt-1">{t('plan_prod3_sub')}</p>
                  </div>
                  <div className="mb-8 space-y-4 flex-grow text-sm relative z-10">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">50 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp135.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">300 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp420.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">450 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp650.000</span>
                     </div>
                     <div className="flex justify-between items-center pt-1 border-transparent">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">1000 {t('plan_token')}</span>
                        <span className="font-bold text-foreground tracking-wide">Rp1.100.000</span>
                     </div>
                  </div>
                  <div className="mt-auto relative z-10">
                     <a 
                        href="https://s.shopee.co.id/5AnS7k79Vg" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 text-foreground dark:text-white rounded-xl font-bold hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-sm inline-block"
                     >
                        {t('plan_btn')}
                     </a>
                  </div>
               </div>

               {/* Product 4 */}
               <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:border-neon/30 hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <div className="mb-6 relative z-10">
                     <h3 className="text-xl font-extrabold text-foreground uppercase tracking-wide">{t('plan_prod4_title')}</h3>
                     <p className="text-emerald-500 font-semibold text-sm mt-1">{t('plan_prod4_sub')}</p>
                  </div>
                  <div className="mb-8 space-y-4 flex-grow text-sm relative z-10">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">1 Bulan</span>
                        <span className="font-bold text-foreground tracking-wide">Rp50.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">2 Bulan</span>
                        <span className="font-bold text-foreground tracking-wide">Rp100.000</span>
                     </div>
                     <div className="flex justify-between items-center pt-1 border-transparent">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">3 Bulan</span>
                        <span className="font-bold text-foreground tracking-wide">Rp150.000</span>
                     </div>
                  </div>
                   <div className="mt-auto relative z-10">
                     <a 
                        href="https://s.shopee.co.id/4AuuvvNtNS" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-transparent border-2 border-slate-200 dark:border-slate-700 text-foreground dark:text-white rounded-xl font-bold hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-sm inline-block"
                     >
                        {t('plan_btn')}
                     </a>
                   </div>
               </div>
            </div>

            {/* Premium Plan Label */}
            <div className="mb-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neon/30 to-transparent"></div>
                  <span className="text-xs font-bold text-neon uppercase tracking-wider flex items-center gap-2">⭐ Premium Plan</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neon/30 to-transparent"></div>
               </div>
               <p className="text-center text-xs text-slate-400 dark:text-slate-500">Claude AI · Hingga 15 Timeframe · Risk Management Otomatis</p>
            </div>

            {/* Premium Plan Card */}
            <div className="max-w-lg mx-auto mb-16">
               <div className="bg-slate-50 dark:bg-[#0f172a] border-2 border-neon/50 dark:border-neon rounded-3xl p-8 hover:shadow-2xl hover:shadow-neon/20 transition-all duration-300 flex flex-col relative shadow-xl group">
                  <div className="absolute inset-0 bg-gradient-to-b from-neon/5 to-transparent rounded-3xl pointer-events-none"></div>
                  <div className="absolute top-0 right-0 bg-neon text-white text-[11px] font-black px-4 py-1.5 rounded-bl-xl rounded-tr-3xl tracking-wider uppercase shadow-md">
                     PREMIUM
                  </div>
                  <div className="mb-6 pt-2 relative z-10">
                     <h3 className="text-2xl font-extrabold text-foreground uppercase tracking-wide">Trenova Premium</h3>
                     <p className="text-emerald-500 font-semibold text-sm mt-1">Masa Aktif 30 Hari</p>
                  </div>
                  <div className="mb-8 space-y-4 flex-grow text-sm relative z-10">
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <div>
                           <span className="text-foreground dark:text-white font-semibold">Novice</span>
                           <span className="text-[10px] text-slate-400 ml-2">30 token</span>
                        </div>
                        <span className="font-bold text-foreground tracking-wide">Rp99.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <div>
                           <span className="text-foreground dark:text-white font-semibold">Starter</span>
                           <span className="text-[10px] text-slate-400 ml-2">50 token</span>
                        </div>
                        <span className="font-bold text-foreground tracking-wide">Rp159.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3 relative">
                        <div className="flex items-center gap-2">
                           <span className="text-neon font-semibold">Basic</span>
                           <span className="text-[9px] bg-neon/10 text-neon px-1.5 py-0.5 rounded font-bold">POPULER</span>
                           <span className="text-[10px] text-slate-400">100 token</span>
                        </div>
                        <span className="font-bold text-neon tracking-wide">Rp299.000</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <div>
                           <span className="text-foreground dark:text-white font-semibold">Pro</span>
                           <span className="text-[10px] text-slate-400 ml-2">150 token</span>
                        </div>
                        <span className="font-bold text-foreground tracking-wide">Rp439.000</span>
                     </div>
                     <div className="flex justify-between items-center pt-1 border-transparent">
                        <div>
                           <span className="text-foreground dark:text-white font-semibold">Elite</span>
                           <span className="text-[10px] text-slate-400 ml-2">200 token</span>
                        </div>
                        <span className="font-bold text-foreground tracking-wide">Rp579.000</span>
                     </div>
                  </div>
                  <div className="mt-auto relative z-10">
                     <a 
                        href="https://s.shopee.co.id/3LMSSvgsMT" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-neon hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all text-center text-sm flex items-center justify-center gap-2 shadow-lg shadow-neon/30 active:scale-95"
                     >
                        Dapatkan Premium <ArrowRight size={18} />
                     </a>
                  </div>
               </div>
            </div>

            {/* Common Features */}
             <div className="mt-16 max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <h3 className="font-bold text-foreground">{t('plan_name')}</h3>
                    <p className="text-slate-500 text-sm">{t('plan_subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        {t('plan_feature_1')}
                     </div>
                     <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        {t('plan_feature_2')}
                     </div>
                     <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        {t('plan_feature_3')}
                     </div>
                     <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        {t('plan_feature_4')}
                     </div>
                </div>
            </div>
         </div>
      </section>

      <TerminalFAQ />
      <TerminalCTA />
      <TerminalFooter />
    </div>
  );
}
