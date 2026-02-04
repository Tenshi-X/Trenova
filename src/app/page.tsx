'use client';

import Link from 'next/link';
import { Bell, TrendingUp, Shield, ArrowRight, Smartphone, Bitcoin, Target, Zap, Lock, Eye, AlertTriangle, CheckCircle2, MousePointerClick, Cpu, Brain, MessageSquare, Upload, BarChart3, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-neon selection:text-white pb-20">
      
      {/* Navigation */}
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-3 items-center">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 justify-start">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-10 h-10 rounded-xl shadow-lg object-contain bg-white dark:bg-slate-800" />
            <span className="text-xl font-bold tracking-tight text-foreground">TRENOVA</span>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center justify-center gap-8">
            <a href="https://discord.gg/gGdkQypYWM" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors">
              {t('nav_community')}
            </a>
            <Link href="/feedback" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors">
              {t('nav_feedback')}
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 justify-end">
             {/* Language & Theme - Desktop */}
            <div className="hidden md:flex items-center gap-3 mr-2 border-r border-slate-200 dark:border-slate-800 pr-4">
               <LanguageSwitcher />
               <ThemeToggle />
            </div>

            <Link href="/login" className="hidden md:block text-sm font-bold text-foreground hover:text-neon transition-colors">
              {t('nav_login')}
            </Link>

            <a href="https://shopee.co.id/product/1734650704/48105786422/" target="_blank" rel="noopener noreferrer" className="hidden sm:block bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all transform hover:-translate-y-0.5 shadow-lg whitespace-nowrap">
              {t('nav_get_started')}
            </a>

             {/* Mobile Elements */}
             <div className="md:hidden flex items-center gap-2">
               <LanguageSwitcher />
               <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] z-[-1]">
           <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" />
           <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-neon/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              {t('hero_pill')}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              {t('hero_title_1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-600">{t('hero_title_2')}</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t('hero_desc')}
              <br/><span className="text-neon font-bold text-sm uppercase tracking-wide mt-2 inline-block">{t('hero_powered_by')}</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                {t('btn_try_dashboard')}
              </Link>
              <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                {t('btn_see_features')} <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Feature Visualization */}
          <div className="relative mx-auto max-w-5xl">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-colors">
                <div className="text-center mb-10">
                   <h2 className="text-foreground dark:text-white text-2xl font-bold mb-2">{t('how_it_works_title')}</h2>
                   <p className="text-slate-500 dark:text-slate-400">{t('how_it_works_subtitle')}</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
                    {/* Step 1 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <MousePointerClick size={24} />
                       </div>
                       <h3 className="text-foreground dark:text-white font-bold mb-2">{t('step_1_title')}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs">{t('step_1_desc')}</p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Cpu size={24} />
                       </div>
                       <h3 className="text-foreground dark:text-white font-bold mb-2">{t('step_2_title')}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs">{t('step_2_desc')}</p>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-neon/10 dark:bg-neon/20 rounded-xl flex items-center justify-center text-neon dark:text-neon-light mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                       </div>
                       <h3 className="text-foreground dark:text-white font-bold mb-2">{t('step_3_title')}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs">{t('step_3_desc')}</p>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Target size={24} />
                       </div>
                       <h3 className="text-foreground dark:text-white font-bold mb-2">{t('step_4_title')}</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-xs">{t('step_4_desc')}</p>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Primary Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900 transition-colors">
         <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                     <BarChart3 size={14} />
                     {t('features_pill')}
                  </div>
                  <h2 className="text-4xl font-bold text-foreground mb-6">
                     {t('features_title')}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                     {t('features_desc')}
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">{t('features_point_1_title')}</h4>
                           <p className="text-sm text-slate-500">{t('features_point_1_desc')}</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">{t('features_point_2_title')}</h4>
                           <p className="text-sm text-slate-500">{t('features_point_2_desc')}</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">{t('features_point_3_title')}</h4>
                           <p className="text-sm text-slate-500">{t('features_point_3_desc')}</p>
                        </div>
                     </li>
                  </ul>
               </div>
               <div className="flex-1 w-full flex justify-center">
                  <div className="relative bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 w-full max-w-sm shadow-xl transition-colors">
                     {/* Mock UI for Master Call */}
                     <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                            <span className="text-white font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon animate-pulse"/> {t('mock_ai_report')}</span>
                            <span className="text-emerald-400 text-xs font-mono">{t('mock_live')}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">BTC/USDT</span>
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded font-bold">BULLISH</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">{t('mock_trend')}</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">{t('mock_trend_val')}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span className="opacity-75">{t('mock_support')}</span>
                                    <span className="font-mono font-bold">$92,500</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                    <span className="opacity-75">{t('mock_rsi')}</span>
                                    <span className="font-mono font-bold">65 (Neutral-Bull)</span>
                                </div>
                            </div>
                            <div className="pt-2 text-xs text-slate-400 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-800 mt-2">
                                {t('mock_comment')}
                            </div>
                        </div>
                     </div>
                     
                     <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-950 p-3 rounded-lg shadow-lg dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
                         <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md text-blue-600 dark:text-blue-400">
                             <TrendingUp size={16} />
                         </div>
                         <div>
                             <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('mock_forecast')}</div>
                             <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('mock_target')}</div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Notifications Showcase */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
         <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-16 text-foreground">{t('section_analysis_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4">
                     <TrendingUp size={14} />
                     {t('card_forecast_pill')}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('card_forecast_title')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                     {t('card_forecast_desc')}
                  </p>
               </div>
               
               <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold mb-4">
                     <Search size={14} />
                     {t('card_technical_pill')}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('card_technical_title')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                     {t('card_technical_desc')}
                  </p>
               </div>

               <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold mb-4">
                     <Shield size={14} />
                     {t('card_risk_pill')}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('card_risk_title')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                     {t('card_risk_desc')}
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
         <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <img src="/app-logo.png" alt="Trenova Logo" className="w-6 h-6 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
               <span className="font-bold text-slate-700 dark:text-slate-200">TRENOVA</span>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">© {new Date().getFullYear()} {t('footer_rights')}</p>
            <div className="flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
               <Link href="/" className="hover:text-neon">{t('footer_privacy')}</Link>
               <Link href="/" className="hover:text-neon">{t('footer_terms')}</Link>
               <Link href="/feedback" className="hover:text-neon">{t('footer_feedback')}</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
