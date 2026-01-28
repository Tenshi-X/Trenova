'use client';

import React, { useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Target, Shield, Zap, Share2, Microscope, FileText } from 'lucide-react';
import clsx from 'clsx';

interface AnalysisVisualizerProps {
    markdown: string;
    coinName: string;
}

export default function AnalysisVisualizer({ markdown, coinName }: AnalysisVisualizerProps) {
    
    // Parse Markdown to structured data
    const parsedData = useMemo(() => {
        const result = {
            decision: "WAIT",
            riskLevel: "Medium",
            plans: [] as any[],
            summary: "",
            mainReason: ""
        };

        // Extract Decision
        // Regex adjustment: Catch text after label, optional [ bracket, capture until ] or newline
        const decisionMatch = markdown.match(/(?:👉 Decision|👉 Keputusan):\s*(?:\[)?([^\n\]]+)/i);
        if (decisionMatch) {
            const rawDec = decisionMatch[1].toUpperCase();
            if (rawDec.includes("LONG") || rawDec.includes("BUY")) result.decision = "BUY"; // Unified to BUY for UI
            else if (rawDec.includes("SHORT") || rawDec.includes("SELL")) result.decision = "SELL"; // Unified to SELL for UI
            else result.decision = "WAIT";
        }

        // Extract Risk
        const riskMatch = markdown.match(/(?:👉 Risk Level|👉 Risk Level):\s*\[?(.*?)\]?/i);
        if (riskMatch) result.riskLevel = riskMatch[1];

        // Extract Main Reason
        // Regex adjustment: Catch text after label until newline, allowing for bold markers/colons
        const reasonMatch = markdown.match(/(?:👉\s*Main Reason|👉\s*Alasan Utama)(?:[\*\s]*):?\s*([^\n]+)/i); 
        if (reasonMatch) result.mainReason = reasonMatch[1].trim().replace(/\*\*/g, '');

        // ... (existing extractPlan logic) ...
        // Helper to extract block
        const extractPlan = (titlePattern: RegExp) => {
            const lines = markdown.split('\n');
            let capturing = false;
            let plan = { type: "", entry: "", sl: "", tp1: "", tp2: "", conviction: 0, reason: "" };
            
            for (let i = 0; i < lines.length; i++) {
                if (titlePattern.test(lines[i])) {
                    capturing = true;
                    plan.type = lines[i].includes("PRIMARY") ? "Primary Setup" : "Counter-Trend";
                    continue;
                }
                if (capturing) {
                    if (lines[i].includes("[ TRADING PLAN") || lines[i].includes("====")) break; // End of block
                    
                    if (lines[i].match(/ENTRY:/i)) {
                        const raw = lines[i].split(':')[1].trim().replace(/"/g, '').replace(/\*\*/g, '');
                         // Extract only the price part if possible (e.g. "$89000" or "$89000 - $89500")
                        plan.entry = raw.split('(')[0].trim();
                    }
                    if (lines[i].match(/STOP LOSS:/i)) {
                        const raw = lines[i].split(':')[1].trim().replace(/"/g, '').replace(/\*\*/g, '');
                        plan.sl = raw.split('(')[0].trim();
                    }
                    if (lines[i].match(/(?:TAKE PROFIT|TARGET PROFIT) 1:/i)) {
                        const raw = lines[i].split(':')[1].trim().replace(/"/g, '').replace(/\*\*/g, '');
                        plan.tp1 = raw.split('(')[0].trim();
                    }
                    if (lines[i].match(/(?:TAKE PROFIT|TARGET PROFIT) 2:/i)) {
                        const raw = lines[i].split(':')[1].trim().replace(/"/g, '').replace(/\*\*/g, '');
                        plan.tp2 = raw.split('(')[0].trim();
                    }
                    if (lines[i].match(/(?:TECHNICAL REASON|ALASAN TEKNIKAL):/i)) plan.reason = lines[i].split(':')[1].trim();
                    if (lines[i].match(/(?:CONVICTION|KEYAKINAN):/i)) {
                        const score = lines[i].match(/\d+/);
                        if (score) plan.conviction = parseInt(score[0]);
                    }
                }
            }
            return plan.entry ? plan : null;
        };

        const primaryPlan = extractPlan(/\[ TRADING PLAN 1/i);
        const counterPlan = extractPlan(/\[ TRADING PLAN 2/i);

        if (primaryPlan) result.plans.push(primaryPlan);
        if (counterPlan) result.plans.push(counterPlan);

        return result;
    }, [markdown]);

    const { decision, riskLevel, plans } = parsedData;
    
    const isLong = decision === "BUY";
    const isShort = decision === "SELL";
    
    const mainColor = isLong ? "text-emerald-500" : isShort ? "text-rose-500" : "text-slate-500";
    const mainBg = isLong ? "bg-emerald-500" : isShort ? "bg-rose-500" : "bg-slate-500";
    const mainGradient = isLong ? "from-emerald-500 to-emerald-700" : isShort ? "from-rose-500 to-rose-700" : "from-slate-500 to-slate-700";

    return (
        <div className="space-y-6">
            {/* HER0 CARD: DECISION */}
            <div className={clsx("relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl", `bg-gradient-to-br ${mainGradient}`)}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 opacity-80 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">{coinName} ANALYSIS</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{riskLevel} Risk</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                            {decision}
                            {isLong && <ArrowUpCircle size={40} className="animate-pulse" />}
                            {isShort && <ArrowDownCircle size={40} className="animate-pulse" />}
                            {!isLong && !isShort && <AlertCircle size={40} />}
                        </h2>
                        <p className="mt-2 text-white/90 max-w-lg text-sm md:text-base">
                            {parsedData.mainReason || parsedData.plans[0]?.reason || "Analysis ready. See details below."}
                        </p>
                    </div>

                    {/* Conviction Dial */}
                    {plans.length > 0 && (
                         <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                            <span className="text-xs font-bold opacity-70 mb-2 uppercase">Conviction</span>
                            <div className="relative w-24 h-12 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 rounded-t-full"></div>
                                <div 
                                    className="absolute top-0 left-0 w-full h-full bg-white rounded-t-full origin-bottom transition-all duration-1000"
                                    style={{ transform: `rotate(${(plans[0].conviction / 100) * 180 - 180}deg)` }}
                                ></div>
                            </div>
                            <span className="text-2xl font-black mt-[-10px] z-10">{plans[0].conviction}%</span>
                         </div>
                    )}
                </div>
            </div>

            {/* TRADING PLANS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
                        <div className={clsx("absolute top-0 left-0 w-1.5 h-full", idx === 0 ? mainBg : "bg-slate-400")} />
                        
                        <div className="flex justify-between items-start mb-4 pl-3">
                            <div>
                                <h3 className={clsx("font-black text-lg", idx === 0 ? mainColor : "text-slate-500")}>
                                    {plan.type}
                                </h3>
                                <p className="text-xs text-slate-400">{plan.type === 'Primary Setup' ? "Trend Following Strategy" : "Reversal / Hedge Opportunity"}</p>
                            </div>
                            {plan.conviction > 0 && (
                                <span className={clsx("px-2 py-1 rounded text-xs font-bold", idx === 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-100 text-slate-500")}>
                                    {plan.conviction}% Prob
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-3 pl-3">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Target size={14} /> ENTRY
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{plan.entry}</span>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center p-2 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                                    <span className="flex items-center gap-2 text-xs font-bold text-rose-500">
                                        <Shield size={14} /> STOP LOSS
                                    </span>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{plan.sl}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                    <span className="block text-[10px] font-bold text-emerald-500 mb-1">TP 1</span>
                                    <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">{plan.tp1}</span>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                    <span className="block text-[10px] font-bold text-emerald-500 mb-1">TP 2</span>
                                    <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">{plan.tp2 || "Open"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DETAILED BREAKDOWN styled */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                 <div className="flex items-center gap-2 mb-6">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                        <Microscope size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Market Intelligence Breakdown</h3>
                 </div>
                 
                 <div className="space-y-1">
                     {markdown.split('\n').map((line, i) => {
                        const cleanLine = line.trim().replace(/\*\*/g, '');
                         // Skip empty lines or the repetitive Plan/Decision headers we already showed
                        if (!cleanLine || cleanLine.includes("TRADING PLAN") || cleanLine.includes("FINAL DECISION") || cleanLine.includes("KESIMPULAN")) return null;
                        
                        // Main Headers (A., B., C...)
                        if (cleanLine.match(/^[A-E]\.\s|###/)) {
                            return (
                                <div key={i} className="mt-8 first:mt-0 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
                                        <span className="w-1.5 h-6 rounded-full bg-neon"></span>
                                        {cleanLine.replace(/###/g, '')}
                                    </h4>
                                </div>
                            );
                        }
                        
                         // Sub Headers (1., 2. or just bold titles)
                        if (cleanLine.match(/^\d+\./) && !cleanLine.includes(':')) {
                             return <h5 key={i} className="font-bold text-slate-700 dark:text-slate-200 mt-4 mb-2 pl-2 border-l-2 border-transparent">{cleanLine}</h5>;
                        }

                        // Key-Values (Label: Value)
                        if (cleanLine.includes(':') && !cleanLine.startsWith('-') && cleanLine.length < 200) {
                            const params = cleanLine.split(':');
                            const label = params[0].trim();
                            const val = params.slice(1).join(':').trim();
                            
                            // Highlight specific keywords for better scanning
                            const isImportant = ['Pair', 'Structure', 'Bias', 'Entry', 'Stop', 'Profit', 'Reason', 'Risk', 'Support', 'Resistance'].some(k => label.includes(k));

                            return (
                                <div key={i} className={clsx(
                                    "mb-2 p-3 rounded-xl flex flex-col md:flex-row md:items-start gap-1 md:gap-4 transition-colors",
                                    isImportant ? "bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50" : "bg-transparent pl-4"
                                )}>
                                    <span className={clsx("text-xs font-bold uppercase tracking-wider shrink-0 w-32 pt-0.5", isImportant ? "text-slate-500" : "text-slate-400")}>
                                        {label.replace(/[-*1-9\.]/g, '')}
                                    </span>
                                    {val && <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{val}</span>}
                                </div>
                            )
                        }

                        // Regular Text / Bullets
                        return (
                             <div key={i} className="mb-2 pl-5 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {cleanLine.startsWith('-') && <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0" />}
                                <span>{cleanLine.replace(/^-\s*/, '')}</span>
                             </div>
                        );
                     })}
                 </div>
            </div>
        </div>
    );
}
