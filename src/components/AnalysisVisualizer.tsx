'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Target, Shield, Zap, Search, Microscope, FileText, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

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

import { useLanguage } from '@/context/LanguageContext';

export default function AnalysisVisualizer({ markdown, coinName, instant = false }: AnalysisVisualizerProps) {
    const { language } = useLanguage();
    
    // Translation Map
    const t = {
        id: {
            intelligence: "ANALISIS",
            risk: "Risiko",
            conviction: "Keyakinan",
            detailed_breakdown: "PENJELASAN DETAIL",
            trend_following: "TREND FOLLOWING",
            counter_trend: "COUNTER TREND",
            prob: "Probabilitas",
            entry: "ENTRY",
            sl: "STOP LOSS",
            market_structure: "Struktur Pasar",
            structure: "Struktur",
            key_support: "Support Kunci",
            key_resistance: "Resistance Kunci",
            open: "Terbuka",
            bullish: "BULLISH",
            bearish: "BEARISH",
            ranging: "RANGING",
            buy: "BUY",
            short: "SHORT",
        },
        en: {
            intelligence: "INTELLIGENCE",
            risk: "Risk",
            conviction: "Conviction",
            detailed_breakdown: "DETAILED BREAKDOWN",
            trend_following: "TREND FOLLOWING",
            counter_trend: "COUNTER TREND",
            prob: "Prob",
            entry: "ENTRY",
            sl: "STOP LOSS",
            market_structure: "Market Structure",
            structure: "Structure",
            key_support: "Key Support",
            key_resistance: "Key Resistance",
            open: "Open",
            bullish: "BULLISH",
            bearish: "BEARISH",
            ranging: "RANGING",
            buy: "BUY",
            short: "SHORT",
        }
    };

    const text = language === 'id' ? t.id : t.en;

    const parsedData = useMemo(() => {
        let result = {
            decision: "WAIT",
            riskLevel: "Medium",
            plans: [] as any[],
            summary: language === 'id' ? "Analisis dimuat." : "Analysis loaded.",
            mainReason: "",
            marketStructure: null as any
        };

        if (!markdown) return result;

        // Try parsing as JSON first
        try {
            // Clean markdown blocks if present
            const cleanJson = markdown.replace(/```json|```/g, '').trim();
            const json = JSON.parse(cleanJson);
            
            result.decision = json.decision || "WAIT";
            result.riskLevel = json.risk_level || "Medium";
            result.summary = json.summary || "";
            result.mainReason = json.main_reason || "";
            result.marketStructure = json.market_structure || null;
            
            // Determine trend for direction logic
            const trend = result.marketStructure?.structure?.toLowerCase() || 'ranging';
            
            if (Array.isArray(json.plans)) {
                result.plans = json.plans.map((p: any, idx: number) => {
                    // Determine direction from the AI response, or infer from trend
                    let direction = p.direction?.toUpperCase() || '';
                    const isPrimary = idx === 0 || (p.type || '').toLowerCase().includes('primary') || (p.type || '').toLowerCase().includes('trend following');
                    
                    // Fallback: infer direction if AI didn't provide it
                    if (!direction || (direction !== 'BUY' && direction !== 'SHORT')) {
                        if (trend === 'bullish') {
                            direction = isPrimary ? 'BUY' : 'SHORT';
                        } else if (trend === 'bearish') {
                            direction = isPrimary ? 'SHORT' : 'BUY';
                        } else {
                            // Ranging: use decision as hint
                            direction = result.decision === 'BUY' ? (isPrimary ? 'BUY' : 'SHORT') : (isPrimary ? 'SHORT' : 'BUY');
                        }
                    }
                    
                    // Collect TP levels (up to 5)
                    const tps: string[] = [];
                    for (let i = 1; i <= 5; i++) {
                        const tp = p[`take_profit_${i}`];
                        if (tp && tp !== 'N/A' && tp !== '-' && tp !== '') {
                            tps.push(tp);
                        }
                    }
                    
                    return {
                        type: p.type,
                        direction,
                        isPrimary,
                        entry: p.entry_zone,
                        sl: p.stop_loss,
                        tps,
                        reason: p.technical_reason,
                        conviction: p.conviction || 50,
                        convictionReason: p.conviction_reason || ''
                    };
                });
            }
            return result;
        } catch (e) {
            console.warn("Failed to parse analysis as JSON, falling back to Regex", e);
            // FALLBACK TO REGEX (Old logic)
             // Extract Decision
            const decisionMatch = markdown.match(/(?:👉 Decision|👉 Keputusan):\s*(?:\[)?([^\n\]]+)/i);
            if (decisionMatch) {
                const rawDec = decisionMatch[1].toUpperCase();
                if (rawDec.includes("LONG") || rawDec.includes("BUY") || rawDec.includes("BELI")) result.decision = "BUY"; 
                else if (rawDec.includes("SHORT") || rawDec.includes("SELL") || rawDec.includes("JUAL")) result.decision = "SELL"; 
                else result.decision = "WAIT";
            }

            // Extract Risk
            const riskMatch = markdown.match(/(?:👉 Risk Level|👉 Tingkat Risiko):\s*\[?(.*?)\]?/i);
            if (riskMatch) result.riskLevel = riskMatch[1];
            
            // Extract Reason
            const reasonMatch = markdown.match(/(?:👉\s*Main Reason|👉\s*Alasan Utama)(?:[\*\s]*):?\s*([^\n]+)/i); 
            if (reasonMatch) result.mainReason = reasonMatch[1].trim().replace(/\*\*/g, '');

            result.summary = markdown;
            
            return result;
        }
    }, [markdown, language]);

    const { decision, riskLevel, plans, summary, mainReason } = parsedData;
    
    // Typewriter for Summary
    const typedSummary = instant ? summary : useTypewriter(summary, 10);
    const typedReason = instant ? mainReason : useTypewriter(mainReason, 20);

    const isLong = decision === "BUY";
    const isShort = decision === "SELL";
    
    const mainColor = isLong ? "text-emerald-500" : isShort ? "text-rose-500" : "text-slate-500";
    const mainBg = isLong ? "bg-emerald-500" : isShort ? "bg-rose-500" : "bg-slate-500";
    const mainGradient = isLong ? "from-emerald-500 to-emerald-700" : isShort ? "from-rose-500 to-rose-700" : "from-slate-500 to-slate-700";

    // Get trend label
    const trendLabel = parsedData.marketStructure?.structure?.toUpperCase() || 'RANGING';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* HERO CARD: DECISION */}
            <div className={clsx("relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl", `bg-gradient-to-br ${mainGradient}`)}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 opacity-80 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">{coinName} {text.intelligence}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{riskLevel} {text.risk}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                            {decision}
                            {isLong && <ArrowUpCircle size={40} className="animate-pulse" />}
                            {isShort && <ArrowDownCircle size={40} className="animate-pulse" />}
                            {!isLong && !isShort && <AlertCircle size={40} />}
                        </h2>
                        <p className="mt-4 text-white/90 max-w-lg text-lg font-medium leading-relaxed">
                            {typedReason}<span className="animate-pulse">_</span>
                        </p>
                    </div>

                    {/* Conviction Dial */}
                    {plans.length > 0 && (
                         <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                            <span className="text-xs font-bold opacity-70 mb-2 uppercase">{text.conviction}</span>
                            <div className="relative w-24 h-12 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 rounded-t-full"></div>
                                <div 
                                    className="absolute top-0 left-0 w-full h-full bg-white rounded-t-full origin-bottom transition-all duration-1000 ease-out"
                                    style={{ transform: `rotate(${(plans[0].conviction / 100) * 180 - 180}deg)` }}
                                ></div>
                            </div>
                            <span className="text-2xl font-black mt-[-10px] z-10">{plans[0].conviction}%</span>
                         </div>
                    )}
                </div>
            </div>

            {/* DETAILED BREAKDOWN BOX */}
            {summary && (
                <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-neon p-4 rounded-r-xl">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2 uppercase">
                        <FileText size={16} /> {text.detailed_breakdown}
                    </h3>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base markdown-content">
                        <ReactMarkdown 
                            components={{
                                strong: ({node, ...props}) => <span className="font-bold text-slate-900 dark:text-white" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                            }}
                        >
                            {typedSummary}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* TRADING PLANS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan, idx) => {
                    const isBuy = plan.direction === 'BUY';
                    const dirColor = isBuy ? 'emerald' : 'rose';
                    const dirBg = isBuy ? 'bg-emerald-500' : 'bg-rose-500';
                    const dirText = isBuy ? 'text-emerald-500' : 'text-rose-500';
                    const dirBadgeBg = isBuy ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30';

                    // Clean title: "Primary Setup" or "Alternative Scenario"
                    const planTitle = plan.isPrimary 
                        ? (language === 'id' ? 'Primary Setup' : 'Primary Setup')
                        : (language === 'id' ? 'Skenario Alternatif' : 'Alternative Scenario');
                    
                    // Subtitle: "Mengikuti Tren · Bullish" or "Counter-Trend"
                    const planSubtitle = plan.isPrimary
                        ? `${text.trend_following} · ${trendLabel}`
                        : text.counter_trend;

                    return (
                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            {/* Side accent bar */}
                            <div className={clsx("absolute top-0 left-0 w-1.5 h-full", dirBg)} />
                            
                            <div className="flex flex-col gap-3 pl-3 mb-4">
                                {/* Direction Badge + Conviction */}
                                <div className="flex justify-between items-start">
                                    <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-sm", dirBadgeBg)}>
                                        {isBuy ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        {plan.direction}
                                    </div>
                                    {plan.conviction > 0 && (
                                        <span className={clsx("px-2 py-1 rounded text-xs font-bold", idx === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                                            {plan.conviction}% {text.prob}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Plan Title */}
                                <div>
                                    <h3 className={clsx("font-black text-base md:text-lg", dirText)}>
                                        {planTitle}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                        {plan.isPrimary ? <TrendingUpIcon /> : <Shield size={12} />}
                                        {planSubtitle}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pl-3">
                                {/* Entry Zone */}
                                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Target size={14} /> {text.entry}
                                    </span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{plan.entry}</span>
                                </div>
                                
                                {/* Stop Loss */}
                                <div className="flex justify-between items-center p-2.5 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                    <span className="flex items-center gap-2 text-xs font-bold text-rose-500">
                                        <Shield size={14} /> {text.sl}
                                    </span>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{plan.sl}</span>
                                </div>

                                {/* Take Profit Levels - Dynamic Grid */}
                                {plan.tps && plan.tps.length > 0 && (
                                    <div className={clsx(
                                        "grid gap-2",
                                        plan.tps.length <= 2 ? "grid-cols-2" : 
                                        plan.tps.length === 3 ? "grid-cols-3" :
                                        plan.tps.length === 4 ? "grid-cols-2 md:grid-cols-4" :
                                        "grid-cols-2 md:grid-cols-5"
                                    )}>
                                        {plan.tps.map((tp: string, tpIdx: number) => (
                                            <div key={tpIdx} className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                                <span className="block text-[10px] font-bold text-emerald-500 mb-1">TP {tpIdx + 1}</span>
                                                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">{tp}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Technical Reason */}
                                {plan.reason && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                        <p className="text-xs text-slate-500 italic">"{plan.reason}"</p>
                                    </div>
                                )}

                                {/* Conviction Reason */}
                                {plan.convictionReason && (
                                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Zap size={12} className="text-amber-500" />
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                                {language === 'id' ? `Kenapa ${plan.conviction}%?` : `Why ${plan.conviction}%?`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">{plan.convictionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MARKET STRUCTURE */}
            {parsedData.marketStructure && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                            <Microscope size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{text.market_structure}</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">{text.structure}</span>
                            <div className={clsx(
                                "font-bold mt-1",
                                parsedData.marketStructure.structure?.toLowerCase() === 'bullish' ? 'text-emerald-600 dark:text-emerald-400' :
                                parsedData.marketStructure.structure?.toLowerCase() === 'bearish' ? 'text-rose-600 dark:text-rose-400' :
                                'text-slate-700 dark:text-slate-300'
                            )}>
                                {parsedData.marketStructure.structure}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">{text.key_support}</span>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">{parsedData.marketStructure.key_support}</div>
                        </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">{text.key_resistance}</span>
                            <div className="font-bold text-rose-600 dark:text-rose-400 mt-1">{parsedData.marketStructure.key_resistance}</div>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
}

function TrendingUpIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    )
}
