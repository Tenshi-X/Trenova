'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Target, Shield, Zap, Search, Microscope, FileText, CheckCircle2, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';

interface AnalysisVisualizerProps {
    markdown: string; // Can be JSON string or Markdown
    coinName: string;
    instant?: boolean;
}

// Utility hook for Typewriter effect
function useTypewriter(text: string, speed = 10) {
    const [displayedLength, setDisplayedLength] = useState(0);
    
    useEffect(() => {
        setDisplayedLength(0);
        if (!text) return;

        const timer = setInterval(() => {
            setDisplayedLength((prev) => {
                if (prev < text.length) {
                    return prev + 1;
                }
                clearInterval(timer);
                return prev;
            });
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);
    
    return text ? text.slice(0, displayedLength) : '';
} 

export default function AnalysisVisualizer({ markdown, coinName, instant = false }: AnalysisVisualizerProps) {
    const { language } = useLanguage();
    
    // Translation Map
    const t = {
        id: {
            intelligence: "ANALISIS",
            risk: "Risiko",
            conviction: "Keyakinan",
            detailed_breakdown: "ALASAN UTAMA",
            trend_following: "TREND FOLLOWING",
            counter_trend: "COUNTER TREND",
            prob: "Probabilitas",
            entry: "ENTRY",
            sl: "STOP LOSS",
            open: "Terbuka",
            buy: "BUY",
            short: "SHORT",
            wait: "WAIT"
        },
        en: {
            intelligence: "INTELLIGENCE",
            risk: "Risk",
            conviction: "Conviction",
            detailed_breakdown: "MAIN REASON",
            trend_following: "TREND FOLLOWING",
            counter_trend: "COUNTER TREND",
            prob: "Prob",
            entry: "ENTRY",
            sl: "STOP LOSS",
            open: "Open",
            buy: "BUY",
            short: "SHORT",
            wait: "WAIT"
        }
    };

    const text = language === 'id' ? t.id : t.en;

    const parsedData = useMemo(() => {
        if (!markdown) return null;
        try {
            const jsonMatch = markdown.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("Failed to parse analysis JSON:", e);
            return null;
        }
    }, [markdown]);

    if (!parsedData) {
        return (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                <p>Gagal memuat analisis. Format data tidak dikenali atau terpotong.</p>
            </div>
        );
    }

    // Adapt legacy formats if they still exist
    const verdict = parsedData.verdict || parsedData.decision || "WAIT";
    const alasan = parsedData.alasan || parsedData.main_reason || parsedData.summary || "Tidak ada alasan spesifik.";
    const keyakinan = parsedData.keyakinan || (parsedData.plans && parsedData.plans[0]?.conviction) || 50;
    const setups = parsedData.setup || (parsedData.plans ? parsedData.plans.map((p: any) => ({
        tipe: p.type || 'PRIMARY',
        arah: p.direction || verdict,
        entry: p.entry_zone || p.entry || 'N/A',
        sl: p.stop_loss || p.sl || 'N/A',
        tp1: p.take_profit_1 || p.tp1,
        tp2: p.take_profit_2 || p.tp2,
        tp3: p.take_profit_3 || p.tp3
    })) : []);
    const manajemen = parsedData.manajemen_risiko || parsedData.risk_management || null;

    // Typewriter
    const typedReason = instant ? alasan : useTypewriter(alasan, 10);

    const isLong = verdict === "LONG" || verdict === "BUY";
    const isShort = verdict === "SHORT" || verdict === "SELL";
    
    const mainGradient = isLong ? "from-emerald-500 to-emerald-700" : isShort ? "from-rose-500 to-rose-700" : "from-slate-500 to-slate-700";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* HERO CARD: DECISION */}
            <div className={clsx("relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl", `bg-gradient-to-br ${mainGradient}`)}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 opacity-80 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">{coinName} {text.intelligence}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                            {verdict}
                            {isLong && <ArrowUpCircle size={40} className="animate-pulse" />}
                            {isShort && <ArrowDownCircle size={40} className="animate-pulse" />}
                            {!isLong && !isShort && <AlertCircle size={40} />}
                        </h2>
                    </div>

                    {/* Conviction Dial */}
                    <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                        <span className="text-xs font-bold opacity-70 mb-2 uppercase">{text.conviction}</span>
                        <div className="relative w-24 h-12 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/20 rounded-t-full"></div>
                            <div 
                                className="absolute top-0 left-0 w-full h-full bg-white rounded-t-full origin-bottom transition-all duration-1000 ease-out"
                                style={{ transform: `rotate(${(keyakinan / 100) * 180 - 180}deg)` }}
                            ></div>
                        </div>
                        <span className="text-2xl font-black mt-[-10px] z-10">{keyakinan}%</span>
                    </div>
                </div>
            </div>

            {/* ALASAN UTAMA BOX */}
            <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-neon p-4 sm:p-5 rounded-r-xl">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">
                    <Activity size={16} className="text-neon" /> {text.detailed_breakdown}
                </h3>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium md:text-lg">
                    {typedReason}<span className="animate-pulse text-neon">_</span>
                </p>
            </div>

            {/* TRADING PLANS */}
            {setups && setups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {setups.map((plan: any, idx: number) => {
                        const sLong = plan.arah === 'LONG' || plan.arah === 'BUY';
                        const sShort = plan.arah === 'SHORT' || plan.arah === 'SELL';
                        
                        const dirBg = sLong ? 'bg-emerald-500' : sShort ? 'bg-rose-500' : 'bg-slate-500';
                        const dirText = sLong ? 'text-emerald-500' : sShort ? 'text-rose-500' : 'text-slate-500';
                        const dirBadgeBg = sLong ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : sShort ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-slate-500/10 text-slate-500 border-slate-500/30';

                        const planTitle = plan.tipe || (idx === 0 ? 'PRIMARY SETUP' : 'SKENARIO ALTERNATIF');
                        const tps = [plan.tp1, plan.tp2, plan.tp3].filter(Boolean);

                        return (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                {/* Side accent bar */}
                                <div className={clsx("absolute top-0 left-0 w-1.5 h-full", dirBg)} />
                                
                                <div className="flex flex-col gap-3 pl-3 mb-4">
                                    <div className="flex justify-between items-start">
                                        <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-sm", dirBadgeBg)}>
                                            {sLong ? <TrendingUp size={16} /> : sShort ? <TrendingDown size={16} /> : <AlertCircle size={16} />}
                                            {plan.arah || "WAIT"}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className={clsx("font-black text-base md:text-lg", dirText)}>
                                            {planTitle}
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 pl-3">
                                    {/* Entry Zone */}
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Target size={14} /> {text.entry}
                                        </span>
                                        <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">{plan.entry || 'N/A'}</span>
                                    </div>
                                    
                                    {/* Stop Loss */}
                                    <div className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                        <span className="flex items-center gap-2 text-xs font-bold text-rose-500">
                                            <Shield size={14} /> {text.sl}
                                        </span>
                                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">{plan.sl || 'N/A'}</span>
                                    </div>

                                    {/* Take Profit Levels */}
                                    {tps.length > 0 && (
                                        <div className={clsx("grid gap-2", tps.length > 2 ? "grid-cols-3" : "grid-cols-2")}>
                                            {tps.map((tp: string, tpIdx: number) => (
                                                <div key={tpIdx} className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                    <span className="block text-[10px] font-bold text-emerald-500 mb-1">TP {tpIdx + 1}</span>
                                                    <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">{tp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MANAJEMEN RISIKO */}
            {manajemen && (
                <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl overflow-hidden">
                    <div className="bg-amber-100/50 dark:bg-amber-900/40 px-5 py-3 flex items-center gap-2 border-b border-amber-200 dark:border-amber-900/30">
                        <Shield size={16} className="text-amber-600 dark:text-amber-500" />
                        <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                            {language === 'id' ? 'MANAJEMEN RISIKO' : 'RISK MANAGEMENT'}
                        </h3>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Activity size={18} className="text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] text-amber-700/70 dark:text-amber-500/70 uppercase mb-1 font-bold">MAX LEVERAGE</div>
                                <div className="text-sm font-bold text-amber-900 dark:text-amber-100">{manajemen.leverage_maks || manajemen.max_loss_rekomendasi || '10x'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <DollarSign size={18} className="text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] text-amber-700/70 dark:text-amber-500/70 uppercase mb-1 font-bold">ALOKASI MODAL</div>
                                <div className="text-sm font-bold text-amber-900 dark:text-amber-100">{manajemen.alokasi_modal || '1-2% dari modal'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
