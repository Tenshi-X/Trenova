'use client';

import Link from 'next/link';
import { ArrowRight, Play, LogIn } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function TerminalHero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-20 pb-20 px-6 overflow-hidden bg-slate-950 font-mono text-slate-300">
      {/* Grid background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="w-full h-full [background-image:linear-gradient(rgba(16,185,129,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,.08)_0%,transparent_70%)] z-0" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Hero Left */}
          <div className="flex-1 w-full text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              {t('lp_hero_pill')}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4 leading-[1.1]" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t('lp_hero_title_prefix')}<span className="text-slate-600">//</span><span className="text-neon">{t('lp_hero_title_accent')}</span>
            </h1>
            <p className="text-lg text-white mb-2 leading-relaxed max-w-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t('lp_hero_subtitle_1')}<br />{t('lp_hero_subtitle_2')}
            </p>
            <p className="text-[13px] text-slate-500 mb-8 leading-[1.8] max-w-xl">
              {t('lp_hero_desc')} <strong className="text-slate-300">{t('lp_hero_desc_bold1')}</strong>, analisa teknikal mendalam, dan <strong className="text-slate-300">{t('lp_hero_desc_bold2')}</strong> — dirancang untuk trader yang bermain serius di futures market.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded mb-8 inline-flex items-center gap-2">
              <span className="text-neon text-sm">$</span>
              <span className="text-sm text-slate-300">{t('lp_hero_cmd')}</span>
              <span className="w-[2px] h-4 bg-neon animate-pulse" />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 md:gap-4 mb-10">
              <Link href="#pricing" className="w-full sm:w-auto px-6 py-3.5 bg-neon text-slate-950 rounded font-bold text-[12px] md:text-[13px] uppercase tracking-[0.1em] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 hover:bg-emerald-400">
                {t('lp_hero_btn_start')} <ArrowRight size={16} />
              </Link>
              <Link href="#how" className="w-full sm:w-auto px-6 py-3.5 bg-transparent border border-slate-700 text-slate-300 rounded font-bold text-[12px] md:text-[13px] uppercase tracking-[0.1em] hover:border-neon hover:text-neon transition-all flex items-center justify-center gap-2 group">
                <Play size={14} className="fill-current" /> {t('lp_hero_btn_how')}
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto px-6 py-3.5 bg-neon/10 border border-neon/30 text-neon rounded font-bold text-[12px] md:text-[13px] uppercase tracking-[0.1em] hover:bg-neon hover:text-slate-950 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] group">
                <LogIn size={14} /> {t('nav_login')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-2xl font-bold text-neon">15<span className="text-base text-neon/70">+</span></p>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.06em]">{t('lp_hero_stat1_label')}</p>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <p className="text-2xl font-bold text-neon">AI</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.06em]">{t('lp_hero_stat2_label')}</p>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <p className="text-2xl font-bold text-neon">&lt;60<span className="text-base text-neon/70">s</span></p>
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.06em]">{t('lp_hero_stat3_label')}</p>
              </div>
            </div>
          </div>

          {/* Hero Right - Terminal Preview */}
          <div className="flex-1 w-full relative z-10 hidden lg:block">
            {/* Floating Badge Top */}
            <div className="absolute -top-4 -right-4 z-20 bg-slate-900 border border-slate-800 px-4 py-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em]">{t('lp_hero_win_rate')}</div>
              <div className="text-lg font-bold text-emerald-400">+78.4%</div>
            </div>
            <div className="bg-slate-900 rounded border border-slate-800 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                <div className="text-[10px] font-bold text-neon tracking-[0.08em]">TRENOVA//TERMINAL <span className="text-slate-600 font-normal text-[9px]">v2.0</span></div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                </div>
              </div>
              <div className="flex border-b border-slate-800">
                <div className="px-4 py-2 text-[10px] font-bold text-neon border-b-2 border-neon uppercase tracking-[0.08em]">ANALISA</div>
                <div className="px-4 py-2 text-[10px] text-slate-600 uppercase tracking-[0.08em]">DATA GUIDE</div>
                <div className="px-4 py-2 text-[10px] text-slate-600 uppercase tracking-[0.08em]">
                  HISTORY <span className="bg-neon text-slate-950 text-[8px] px-1 ml-1">12</span>
                </div>
              </div>
              <div className="p-4 text-[11px] space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 text-[10px] uppercase tracking-[0.06em]">BTC/USDT PERP — 4H</span>
                    <span className="text-white font-bold">$97,420</span>
                  </div>
                  <svg width="100%" height="50" viewBox="0 0 400 50" preserveAspectRatio="none" className="block">
                    <defs>
                      <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4caf7d" stopOpacity="0.3" /><stop offset="100%" stopColor="#4caf7d" stopOpacity="0" /></linearGradient>
                    </defs>
                    <path d="M0,40 L40,36 L80,38 L100,24 L140,20 L180,22 L200,12 L240,14 L280,8 L320,11 L360,6 L400,4 L400,50 L0,50 Z" fill="url(#cG)" opacity="0.5" />
                    <path d="M0,40 L40,36 L80,38 L100,24 L140,20 L180,22 L200,12 L240,14 L280,8 L320,11 L360,6 L400,4" fill="none" stroke="#4caf7d" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="flex gap-px">
                  <div className="flex-1 bg-slate-950 p-2"><div className="text-[9px] text-slate-600 uppercase">LEVERAGE</div><div className="text-neon font-bold">25×</div></div>
                  <div className="flex-1 bg-slate-950 p-2"><div className="text-[9px] text-slate-600 uppercase">MODAL</div><div className="text-blue-400 font-bold">500 USDT</div></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                    <span className="text-[9px] text-neon font-bold uppercase tracking-[0.08em]">AI ANALYSIS OUTPUT</span>
                    <span className="ml-auto text-[9px] text-emerald-400">✓ READY</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="text-white"><span className="text-slate-600">BIAS  :</span> BULLISH (STRONG) — Multi-TF Confluence</div>
                    <div className="text-emerald-400"><span className="text-slate-600">ENTRY :</span> $96,800 – $97,200 (EMA21 Support)</div>
                    <div className="text-slate-400"><span className="text-slate-600">SL    :</span> $95,900 (-0.93%) — Below EMA50</div>
                    <div className="text-neon"><span className="text-slate-600">TP1   :</span> $99,400 (+2.26%) | TP2: $101,800</div>
                    <div className="text-slate-400"><span className="text-slate-600">R/R   :</span> 1:2.4 | Win Prob: <span className="text-emerald-400">72%</span></div>
                    <div className="text-slate-400"><span className="text-slate-600">RISK  :</span> $46.5 USDT (4.65% dari modal)</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 z-20 bg-slate-900 border border-slate-800 px-4 py-2 text-center">
              <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em]">{t('lp_hero_rr_ratio')}</div>
              <div className="text-lg font-bold text-neon">1 : 2.4</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
