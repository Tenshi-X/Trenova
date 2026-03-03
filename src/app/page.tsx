'use client';

import Link from 'next/link';
import { Bell, TrendingUp, Shield, ArrowRight, Smartphone, Bitcoin, Target, Zap, Lock, Eye, AlertTriangle, CheckCircle2, MousePointerClick, Cpu, Brain, MessageSquare, Upload, BarChart3, Search, Menu, X, Youtube, Instagram } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MarqueeTicker from '@/components/MarqueeTicker';

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
    <div className="min-h-screen font-sans selection:bg-neon selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm ${scrolled ? 'py-4' : 'py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 justify-start relative z-50">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-10 h-10 rounded-xl shadow-lg object-contain bg-white dark:bg-slate-800" />
            <span className="text-xl font-bold tracking-tight text-foreground">TRENOVA</span>
          </div>



          {/* Right: Actions */}
          <div className="flex items-center gap-4 justify-end">
            {/* Community Link - Desktop */}
            <a href="https://discord.gg/gGdkQypYWM" target="_blank" rel="noopener noreferrer" className="hidden md:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors mr-2">
              {t('nav_community')}
            </a>

             {/* Language & Theme - Desktop */}
            <div className="hidden md:flex items-center gap-3 mr-2 border-r border-slate-200 dark:border-slate-800 pr-4">
               <LanguageSwitcher />
               <ThemeToggle />
            </div>

            <a href="https://s.shopee.co.id/LiCMmnIOs" target="_blank" rel="noopener noreferrer" className="hidden sm:block bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all transform hover:-translate-y-0.5 shadow-lg whitespace-nowrap">
              {t('nav_get_started')}
            </a>

             {/* Mobile Hamburger Trigger */}
             <div className="md:hidden flex items-center gap-2 relative z-50">
               <LanguageSwitcher />
               <ThemeToggle />
               <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 ml-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
               >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[72px] z-40 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-6 md:hidden animate-in slide-in-from-top-4 fade-in duration-200 shadow-2xl flex flex-col h-screen">
            <div className="flex flex-col space-y-4">
              <a 
                href="https://discord.gg/gGdkQypYWM" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between group active:scale-95 transition-transform"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav_community')}
                <ArrowRight size={20} className="text-slate-400 group-hover:text-neon group-hover:translate-x-1 transition-all" />
              </a>
              

              
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              
              <a 
                href="https://s.shopee.co.id/LiCMmnIOs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 text-center rounded-xl bg-neon text-white font-bold text-lg shadow-lg hover:bg-neon-dim transition-all active:scale-95"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav_get_started')}
              </a>
            </div>
            
            {/* Mobile Menu Footer Decor */}
            <div className="mt-auto pb-24 text-center text-slate-400 text-sm">
                <p>Trenova Intelligence</p>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] z-[-1]">
           <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" />
           <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-neon/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        {/* Marquee Ticker */}
        <div className="relative z-20 mb-16 -mx-6">
           <MarqueeTicker />
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
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                {t('nav_login')}
              </Link>
              <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                {t('btn_see_features')} <ArrowRight size={20} />
              </Link>
            </div>
          </div>


        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900">
        <div className="container mx-auto px-6 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-6">
               <AlertTriangle size={14} />
               {t('problem_pill')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('problem_title')}</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
               {t('problem_desc')}
            </p>
        </div>
      </section>

      {/* Primary Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 transition-colors">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                     <BarChart3 size={14} />
                     {t('feature_main_pill')}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                     {t('feature_main_title')}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                     {t('feature_main_desc')}
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

      {/* How It Works - 4 Steps */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900">
        <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('how_it_works_title')} <span className="text-neon">{t('how_it_works_subtitle')}</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-20">
                {/* Step 1 */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all text-center group">
                   <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-foreground dark:text-white mx-auto mb-6 group-hover:scale-110 transition-transform font-mono font-bold text-xl">
                      01
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-3">{t('step_1_title')}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{t('step_1_desc')}</p>
                </div>

                {/* Step 2 */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all text-center group">
                   <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-foreground dark:text-white mx-auto mb-6 group-hover:scale-110 transition-transform font-mono font-bold text-xl">
                      02
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-3">{t('step_2_title')}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{t('step_2_desc')}</p>
                </div>
                
                {/* Step 3 */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all text-center group">
                   <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-foreground dark:text-white mx-auto mb-6 group-hover:scale-110 transition-transform font-mono font-bold text-xl">
                      03
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-3">{t('step_3_title')}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{t('step_3_desc')}</p>
                </div>

                {/* Step 4 */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all text-center group">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-foreground dark:text-white mx-auto mb-6 group-hover:scale-110 transition-transform font-mono font-bold text-xl">
                      04
                   </div>
                   <h3 className="text-xl font-bold text-foreground mb-3">{t('step_4_title')}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{t('step_4_desc')}</p>
                </div>
            </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 transition-colors">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1 w-full relative">
                  {/* Mobile Header (Pill + Title) to fix spacing/layout */}
                  <div className="md:hidden mb-6">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                        {t('demo_pill')}
                     </div>
                     <h2 className="text-3xl font-bold text-foreground leading-tight">
                        {t('demo_title')}
                     </h2>
                  </div>
                  {/* Decorative Elements */}
                   <div className="absolute -top-10 -left-10 w-20 h-20 bg-neon/20 rounded-full blur-xl animate-pulse" />
                   <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-700" />

                  <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 relative group overflow-hidden hover:border-emerald-500/30 transition-colors">
                     {/* Header Card */}
                     <div className="bg-emerald-500 p-6 text-white relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="font-bold tracking-wider text-xs bg-black/20 px-2 py-0.5 rounded">BITCOIN INTELLIGENCE</span>
                                 <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">Medium Risk</span>
                              </div>
                              <h3 className="text-4xl font-extrabold flex items-center gap-2 mb-3">
                                 BUY <div className="bg-white/20 p-1 rounded-full"><ArrowRight className="rotate-[-45deg]" size={24} /></div>
                              </h3>
                              <p className="text-sm opacity-90 leading-relaxed max-w-md">
                                 Bitcoin menunjukkan momentum bullish yang kuat, mendekati resistensi kunci dengan volume tinggi.
                              </p>
                           </div>
                           <div className="bg-black/20 rounded-xl p-3 text-center min-w-[100px]">
                              <span className="text-[10px] uppercase font-bold opacity-70 block mb-1">Conviction</span>
                              <div className="relative w-16 h-8 mx-auto overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-16 rounded-full border-4 border-white/20"></div>
                                 <div className="absolute top-0 left-0 w-full h-16 rounded-full border-4 border-white border-b-0 border-l-0 rotate-45 origin-bottom"></div>
                              </div>
                              <span className="text-xl font-bold block mt-1">85%</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-6">
                        {/* Trade Setups */}
                        <div className="grid grid-cols-1 gap-4">
                           {/* Primary Setup */}
                           <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <h5 className="text-emerald-400 font-bold text-sm">Primary Setup (Trend Following)</h5>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1"><TrendingUp size={10} /> Intraday Bullish</span>
                                 </div>
                                 <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">85% Prob</span>
                              </div>
                              
                              <div className="space-y-3 font-mono text-sm">
                                 <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-slate-500 text-xs"><Target size={12} className="inline mr-1"/> ENTRY</span>
                                    <span className="text-white font-bold">$69.850 - $69.950</span>
                                 </div>
                                 <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <span className="text-red-400 text-xs"><Shield size={12} className="inline mr-1"/> STOP LOSS</span>
                                    <span className="text-red-400 font-bold">$69.600</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 mt-2 pt-1">
                                    <div>
                                       <span className="text-emerald-500 text-[10px] block uppercase tracking-wider mb-1">Target 1</span>
                                       <span className="text-emerald-400 font-bold text-lg">$70.300</span>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-emerald-500 text-[10px] block uppercase tracking-wider mb-1">Target 2</span>
                                       <span className="text-emerald-400 font-bold text-lg">$70.900</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1">
                  <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                     {t('demo_pill')}
                  </div>
                  <h2 className="hidden md:block text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                     {t('demo_title')}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                     {t('demo_desc')}
                  </p>
                  <Link href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:-translate-y-1 shadow-xl">
                     {t('demo_btn_try')}
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-[#0f172a] rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800">
               <h2 className="text-2xl md:text-3xl font-bold text-emerald-500 mb-8 uppercase tracking-wide border-l-4 border-emerald-500 pl-4">
                  {t('testimonial_title')}
               </h2>
               
               <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {/* Testimonial 1 */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                              A
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="font-bold text-white text-sm md:text-base">{t('testimonial_1_name')}</span>
                              </div>
                              <div className="flex text-emerald-500 text-xs mt-0.5">
                                 <div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div>
                              </div>
                           </div>
                        </div>
                     </div>
                     <p className="text-slate-300 text-sm md:text-base italic leading-relaxed">
                        {t('testimonial_1_text')}
                     </p>
                  </div>

                  {/* Testimonial 2 */}
                   <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                              F
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="font-bold text-white text-sm md:text-base">{t('testimonial_2_name')}</span>
                              </div>
                              <div className="flex text-emerald-500 text-xs mt-0.5">
                                 <div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div>
                              </div>
                           </div>
                        </div>
                     </div>
                     <p className="text-slate-300 text-sm md:text-base italic leading-relaxed">
                        {t('testimonial_2_text')}
                     </p>
                  </div>

                  {/* Testimonial 3 */}
                   <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                              S
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="font-bold text-white text-sm md:text-base">{t('testimonial_3_name')}</span>
                              </div>
                              <div className="flex text-emerald-500 text-xs mt-0.5">
                                 <div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div><div className="w-3 h-3 fill-current">★</div>
                              </div>
                           </div>
                        </div>
                     </div>
                     <p className="text-slate-300 text-sm md:text-base italic leading-relaxed">
                        {t('testimonial_3_text')}
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing Section */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                  {t('faq_pill')}
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('faq_title')}</h2>
            </div>
            
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="group border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                        <details className="p-6 cursor-pointer">
                            <summary className="flex items-center justify-between font-bold text-lg text-foreground list-none">
                                {t(`faq_q${i}` as TranslationKey)}
                                <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full group-open:rotate-45 transition-transform text-slate-500">
                                   <X size={16} className="rotate-45 block group-open:hidden" />
                                   <X size={16} className="hidden group-open:block" /> 
                                </span>
                            </summary>
                            <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base pr-8 animate-in fade-in slide-in-from-top-2">
                                {t(`faq_a${i}` as TranslationKey)}
                            </p>
                        </details>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
         <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-8">
               <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
               <span className="font-bold text-slate-700 dark:text-slate-200 text-xl tracking-wide">TRENOVA</span>
            </div>

            <div className="flex justify-center items-center gap-8 mb-8">
               {/* Youtube */}
               <a 
                  href="https://youtube.com/@trenovaintelligence?si=sp8otUOs7k5g4lt8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#FF0000] transition-colors transform hover:scale-110"
               >
                  <Youtube size={24} />
               </a>

               {/* Instagram */}
               <a 
                  href="https://www.instagram.com/trenova.intelligence?igsh=dDQ5ODM5cDFsdHIw" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#E1306C] transition-colors transform hover:scale-110"
               >
                  <Instagram size={24} />
               </a>

               {/* Tiktok */}
               <a 
                  href="https://www.tiktok.com/@trenovaintelligence?lang=en&is_from_webapp=1&sender_device=mobile&sender_web_id=7607728317420193300" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-black dark:hover:text-white transition-colors transform hover:scale-110"
               >
                  <svg 
                     xmlns="http://www.w3.org/2000/svg" 
                     width="24" 
                     height="24" 
                     viewBox="0 0 24 24" 
                     fill="none" 
                     stroke="currentColor" 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                     strokeLinejoin="round" 
                     className="lucide lucide-tiktok"
                  >
                     <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
               </a>

               {/* Discord */}
               <a 
                  href="https://discord.com/invite/hBs7nPufBP?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAb21jcAQA89xleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAafbia3CJ3lyqFmViffBWAauiyliIHKzys7inT3wZYAqx4QpNHIdP8c-0mUwjA_aem_AZkI_Ul2v5sfxleGZC2UAA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#5865F2] transition-colors transform hover:scale-110"
               >
                  <svg 
                     xmlns="http://www.w3.org/2000/svg" 
                     width="24" 
                     height="24" 
                     viewBox="0 0 24 24" 
                     fill="none" 
                     stroke="currentColor" 
                     strokeWidth="2" 
                     strokeLinecap="round" 
                     strokeLinejoin="round" 
                     className="lucide lucide-discord"
                  >
                     <circle cx="9" cy="12" r="1" />
                     <circle cx="15" cy="12" r="1" />
                     <path d="M7.5 7.5c3.5-1 5.5-1 9 0" />
                     <path d="M7 16.5c3.5 1 6.5 1 10 0" />
                     <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833-1.667 3.5-3c.667-1.667.5-5.833-1.5-11.5c-1.457-1.015-3-1.34-4.5-1.5l-.972 1.923a11.913 11.913 0 0 0-4.053 0l-.975-1.923c-1.5.16-3.043.485-4.5 1.5c-2 5.667-2.167 9.833-1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2-2 2-3" />
                  </svg>
               </a>
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
