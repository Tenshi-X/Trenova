'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Shield, Target,
  DollarSign, Activity, AlertTriangle
} from 'lucide-react';

interface PremiumAnalysisVisualizerProps {
  markdown: string;
  coinName: string;
}

export default function PremiumAnalysisVisualizer({ markdown, coinName }: PremiumAnalysisVisualizerProps) {
  const data = useMemo(() => {
    if (!markdown) return null;
    try {
      const jsonMatch = markdown.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }, [markdown]);

  if (!data) return (
    <div className="p-8 text-center font-mono text-slate-600 text-[10px] uppercase tracking-widest">
      [ FAILED TO PARSE ANALYSIS — CHECK CONSOLE ]
    </div>
  );

  // ── DETEKSI FORMAT LAMA vs BARU ──
  const isNewMinimalSchema = !!(data.verdict && data.alasan && data.setup);
  if (!isNewMinimalSchema) return <LegacyPremiumVisualizer data={data} coinName={coinName} />;

  const verdict = data.verdict || 'WAIT';
  const isLong = verdict === 'LONG';
  const isShort = verdict === 'SHORT';

  const accentClass = isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400';
  const borderClass = isLong ? 'border-emerald-500/40' : isShort ? 'border-rose-500/40' : 'border-slate-600/40';
  const bgClass     = isLong ? 'bg-emerald-500/5'      : isShort ? 'bg-rose-500/5'      : 'bg-[#0a0a0a]';

  return (
    <div className="font-mono text-[11px] bg-[#050505] p-4 md:p-6 space-y-4">
      {/* ── VERDICT HEADER ── */}
      <div className={`border ${borderClass} ${bgClass} p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between md:items-center`}>
        <div className="flex items-center gap-4">
          {isLong  && <TrendingUp  size={40} className="text-emerald-400" />}
          {isShort && <TrendingDown size={40} className="text-rose-400" />}
          {!isLong && !isShort && <Minus size={40} className="text-slate-500" />}
          <div>
            <div className={`text-4xl md:text-5xl font-black tracking-widest ${accentClass}`}>{verdict}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1">
              {coinName.toUpperCase()} // TRENOVA TERMINAL
            </div>
          </div>
        </div>
        
        {data.keyakinan && (
          <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-[#2a2a2a] pt-4 md:pt-0 md:pl-6">
            <div className={`text-3xl font-black ${accentClass}`}>{data.keyakinan}<span className="text-lg">%</span></div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">KEYAKINAN SETUP</div>
          </div>
        )}
      </div>

      {/* ── ALASAN UTAMA ── */}
      {data.alasan && (
        <div className="border border-[#1e1e1e] bg-[#0f0f0f] px-5 py-4 flex items-start gap-3">
          <Activity size={14} className="text-neon shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed font-bold">{data.alasan}</p>
        </div>
      )}

      {/* ── SETUP CARDS (Max 3: 1 Primary + 2 Alternative) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.isArray(data.setup) && data.setup.map((s: any, idx: number) => {
          const sLong  = s.arah === 'LONG';
          const sShort = s.arah === 'SHORT';
          const col = sLong  ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', slBg: 'bg-rose-900/10 border-rose-500/20 text-rose-400'   } :
                      sShort ? { border: 'border-rose-500/30',    bg: 'bg-rose-500/5',    text: 'text-rose-400',    slBg: 'bg-rose-900/10 border-rose-500/20 text-rose-400'   } :
                               { border: 'border-slate-700/40',   bg: 'bg-[#0a0a0a]',     text: 'text-slate-400',   slBg: 'bg-slate-900/30 border-slate-700 text-slate-400'   };
          
          return (
            <div key={idx} className={`border ${col.border} ${col.bg}`}>
              <div className={`px-4 py-3 border-b ${col.border} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Target size={14} className={col.text} />
                  <span className={`text-sm font-black tracking-wider ${col.text}`}>{s.arah || 'WAIT'}</span>
                  <span className="text-[10px] text-slate-500 ml-2 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                    {s.tipe || (idx === 0 ? 'PRIMARY' : 'ALTERNATIF')}
                  </span>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-3 col-span-2">
                  <div className="text-[9px] text-slate-500 uppercase mb-1">ENTRY ZONE</div>
                  <div className="text-base font-black text-slate-100 leading-none">{s.entry || 'N/A'}</div>
                </div>
                <div className={`p-3 border col-span-2 ${col.slBg}`}>
                  <div className="text-[9px] text-rose-400 uppercase mb-1">STOP LOSS</div>
                  <div className="text-base font-black text-rose-400 leading-none">{s.sl || 'N/A'}</div>
                </div>
                {s.tp1 && (
                  <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 col-span-2">
                    <div className="text-[9px] text-emerald-400 uppercase mb-1">TAKE PROFIT 1</div>
                    <div className="text-sm font-black text-emerald-400 leading-none">{s.tp1}</div>
                  </div>
                )}
                {s.tp2 && (
                  <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 col-span-2">
                    <div className="text-[9px] text-emerald-400 uppercase mb-1">TAKE PROFIT 2</div>
                    <div className="text-sm font-black text-emerald-400 leading-none">{s.tp2}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MANAJEMEN RISIKO ── */}
      {data.manajemen_risiko && (
        <div className="border border-amber-500/30 bg-amber-500/5 mt-4">
          <div className="bg-amber-950/40 px-4 py-2 border-b border-amber-500/20 flex items-center gap-2">
            <Shield size={12} className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">MANAJEMEN RISIKO</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[9px] text-amber-500/70 uppercase mb-1">MAX LEVERAGE</div>
                <div className="text-sm font-bold text-amber-100">{data.manajemen_risiko.leverage_maks || '10x'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-amber-500/20 pt-3 md:pt-0 md:pl-4">
              <DollarSign size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[9px] text-amber-500/70 uppercase mb-1">ALOKASI MODAL</div>
                <div className="text-sm font-bold text-amber-100">{data.manajemen_risiko.alokasi_modal || '1-2% dari modal'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Fallback untuk menangani data format lama dari history ──
function LegacyPremiumVisualizer({ data, coinName }: { data: any; coinName: string }) {
  const isLong  = data.decision === 'BUY' || data.arah === 'LONG' || data.bias?.arah === 'BULLISH';
  const isShort = data.decision === 'SELL' || data.decision === 'SHORT' || data.arah === 'SHORT' || data.bias?.arah === 'BEARISH';
  const col = isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className="font-mono text-[11px] bg-[#050505] p-4 space-y-3">
      <div className="border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className={`text-3xl font-black tracking-widest ${col} mb-1`}>
          {data.decision || data.arah || data.bias?.arah || 'ANALISIS LAMA'}
        </div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest">{coinName} // LEGACY FORMAT</div>
        {(data.main_reason || data.catatan_data) && (
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{data.main_reason || data.catatan_data}</p>
        )}
      </div>
    </div>
  );
}
