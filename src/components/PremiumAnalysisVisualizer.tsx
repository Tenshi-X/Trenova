'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Zap, Shield,
  Target, AlertTriangle, Activity, DollarSign,
  CheckCircle2, XCircle, BarChart2, Info, Clock, Layers
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

  // ── Detect if this is the new premium schema ──
  const isNewSchema = !!(data.bias && data.sinyal && data.setup);
  if (!isNewSchema) return <LegacyPremiumVisualizer data={data} coinName={coinName} />;

  // ── Derive display values ──
  const setup  = Array.isArray(data.setup) ? data.setup[0] : null;
  const arah   = setup?.arah || 'SKIP';
  const isLong  = arah === 'LONG';
  const isShort = arah === 'SHORT';

  const accentClass = isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400';
  const borderClass = isLong ? 'border-emerald-500/40' : isShort ? 'border-rose-500/40' : 'border-slate-600/40';
  const bgClass     = isLong ? 'bg-emerald-500/5'      : isShort ? 'bg-rose-500/5'      : 'bg-[#0a0a0a]';

  const completenessColor =
    data.data_completeness === 'FULL'    ? 'text-emerald-400 border-emerald-500/30' :
    data.data_completeness === 'PARTIAL' ? 'text-amber-400 border-amber-500/30'     :
                                           'text-rose-400 border-rose-500/30';

  return (
    <div className="font-mono text-[11px] bg-[#050505] p-4 md:p-6 space-y-4">

      {/* ── VERDICT HEADER ── */}
      <div className={`border ${borderClass} ${bgClass} p-4 flex flex-wrap gap-4 items-center justify-between`}>
        <div className="flex items-center gap-4">
          {isLong  && <TrendingUp  size={32} className="text-emerald-400" />}
          {isShort && <TrendingDown size={32} className="text-rose-400" />}
          {!isLong && !isShort && <Minus size={32} className="text-slate-500" />}
          <div>
            <div className={`text-4xl font-black tracking-widest ${accentClass}`}>{arah}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mt-0.5">
              {coinName.toUpperCase()} // TRENOVA TERMINAL VERDICT
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center flex-wrap">
          {setup?.keyakinan != null && (
            <div className="text-center">
              <div className={`text-3xl font-black ${accentClass}`}>{setup.keyakinan}<span className="text-lg">%</span></div>
              <div className="text-[8px] text-slate-500 uppercase tracking-widest">KEYAKINAN</div>
            </div>
          )}
          {setup?.rr && (
            <div className="text-center border-l border-[#2a2a2a] pl-6">
              <div className="text-xl font-black text-slate-200">{setup.rr}</div>
              <div className="text-[8px] text-slate-500 uppercase tracking-widest">RISK:REWARD</div>
            </div>
          )}
          {data.data_completeness && (
            <div className={`text-center border px-3 py-1 ${completenessColor}`}>
              <div className="text-xs font-black">{data.data_completeness}</div>
              <div className="text-[8px] uppercase tracking-widest opacity-70">DATA</div>
            </div>
          )}
        </div>
      </div>

      {/* ── DATA QUALITY NOTE ── */}
      {data.catatan_data && (
        <div className="border border-[#1e1e1e] bg-[#0f0f0f] px-4 py-2.5 flex items-start gap-2">
          <Info size={11} className="text-slate-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 italic leading-relaxed">{data.catatan_data}</p>
        </div>
      )}

      {/* ── LIVE SNAPSHOT STRIP ── */}
      {data.live_snapshot && (
        <div className="border border-neon/20 bg-neon/5 p-3">
          <div className="text-[9px] text-neon font-bold uppercase tracking-widest mb-2.5 flex items-center gap-2">
            <Activity size={10} /> LIVE MARKET SNAPSHOT // REAL-TIME
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { label: 'HARGA SPOT',    value: data.live_snapshot.harga_spot,     danger: false },
              { label: 'FUNDING RATE',  value: data.live_snapshot.funding_rate,   danger: false },
              { label: 'OPEN INTEREST', value: data.live_snapshot.open_interest,  danger: false },
              { label: 'ATR (4H)',      value: data.live_snapshot.atr_4h,         danger: false },
              { label: 'FEAR & GREED',  value: data.live_snapshot.fear_greed,     danger: false },
              { label: 'NEXT FUNDING',  value: data.live_snapshot.next_funding,   danger: false },
              { label: 'LIQ LONG',      value: data.live_snapshot.likuidasi_long, danger: true  },
              { label: 'LIQ SHORT',     value: data.live_snapshot.likuidasi_short,danger: true  },
            ].filter(s => s.value && s.value !== 'N/A').map((s, i) => (
              <div key={i} className="bg-[#050505] border border-[#1e1e1e] p-2.5">
                <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1">{s.label}</div>
                <div className={`text-xs font-black ${s.danger ? 'text-rose-400' : 'text-slate-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BIAS + SIGNALS (2-col grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* BIAS */}
        {data.bias && (
          <div className="border border-[#2a2a2a] bg-[#0f0f0f]">
            <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="text-[10px] font-bold text-neon uppercase tracking-widest flex items-center gap-2">
                <BarChart2 size={12} /> MARKET BIAS
              </span>
              <div className="flex gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 border ${
                  data.bias.arah === 'BULLISH' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
                  data.bias.arah === 'BEARISH' ? 'border-rose-500/40 text-rose-400 bg-rose-500/10' :
                  'border-slate-600/40 text-slate-400'
                }`}>{data.bias.arah}</span>
                <span className="text-[9px] text-slate-500 border border-[#2a2a2a] px-2 py-0.5">{data.bias.kekuatan}</span>
              </div>
            </div>
            <div className="divide-y divide-[#141414]">
              {data.bias.detail?.map((d: any, i: number) => (
                <div key={i} className="px-4 py-2.5 flex justify-between items-start gap-3">
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-neon/80 bg-neon/10 px-1.5 py-0.5 whitespace-nowrap">{d.tf}</span>
                    {d.sumber && (
                      <span className={`text-[8px] px-1 py-0.5 border ${
                        d.sumber === 'live_data'  ? 'border-emerald-600/40 text-emerald-500 bg-emerald-500/5' :
                        d.sumber === 'screenshot' ? 'border-sky-600/40 text-sky-400 bg-sky-500/5' :
                        'border-amber-600/40 text-amber-400 bg-amber-500/5'
                      }`}>{d.sumber}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed text-right">{d.kondisi}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIGNALS */}
        {data.sinyal && data.sinyal.length > 0 && (
          <div className="border border-[#2a2a2a] bg-[#0f0f0f]">
            <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="text-[10px] font-bold text-neon uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} /> SINYAL AKTIF
              </span>
              <span className="text-[9px] font-black text-neon">
                {data.sinyal.filter((s: any) => s.on).length}/{data.sinyal.length}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {data.sinyal.map((s: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 p-2 border ${
                  s.on ? 'border-neon/20 bg-neon/5' : 'border-[#1a1a1a] opacity-40'
                }`}>
                  {s.on
                    ? <CheckCircle2 size={11} className="text-neon shrink-0 mt-0.5" />
                    : <XCircle     size={11} className="text-slate-700 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold ${s.on ? 'text-slate-100' : 'text-slate-600'}`}>{s.nama}</span>
                      {s.sumber && (
                        <span className={`text-[8px] px-1 border ${
                          s.sumber === 'live_data'  ? 'border-emerald-600/40 text-emerald-500' :
                          s.sumber === 'screenshot' ? 'border-sky-600/40 text-sky-400' :
                          'border-amber-600/40 text-amber-400'
                        }`}>{s.sumber}</span>
                      )}
                    </div>
                    {s.catatan && <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{s.catatan}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SETUP CARDS ── */}
      {Array.isArray(data.setup) && data.setup.map((s: any, idx: number) => {
        const sLong  = s.arah === 'LONG';
        const sShort = s.arah === 'SHORT';
        const col = sLong  ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', slBg: 'bg-rose-900/10 border-rose-500/20 text-rose-400'   } :
                    sShort ? { border: 'border-rose-500/30',    bg: 'bg-rose-500/5',    text: 'text-rose-400',    slBg: 'bg-rose-900/10 border-rose-500/20 text-rose-400'   } :
                             { border: 'border-slate-700/40',   bg: 'bg-[#0a0a0a]',    text: 'text-slate-400',   slBg: 'bg-slate-900/30 border-slate-700 text-slate-400'   };
        const tps = [s.tp1, s.tp2, s.tp3, s.tp4, s.tp5].filter(Boolean);

        return (
          <div key={idx} className={`border ${col.border} ${col.bg}`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${col.border} flex flex-wrap items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                {sLong  && <TrendingUp  size={18} className="text-emerald-400" />}
                {sShort && <TrendingDown size={18} className="text-rose-400" />}
                {!sLong && !sShort && <Minus size={18} className="text-slate-500" />}
                <div>
                  <span className={`text-sm font-black tracking-widest ${col.text}`}>{s.arah}</span>
                  <span className="text-[9px] text-slate-500 ml-2 uppercase">
                    {idx === 0 ? '// PRIMARY SETUP' : '// SKENARIO ALTERNATIF'}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                {s.keyakinan != null && (
                  <div className="text-right">
                    <div className={`text-xl font-black ${col.text}`}>{s.keyakinan}%</div>
                    <div className="text-[8px] text-slate-600 uppercase">KEYAKINAN</div>
                  </div>
                )}
                {s.rr && (
                  <div className="text-right border-l border-[#2a2a2a] pl-4">
                    <div className="text-sm font-black text-slate-300">{s.rr}</div>
                    <div className="text-[8px] text-slate-600 uppercase">R:R RATIO</div>
                  </div>
                )}
                {s.sinyal_count != null && (
                  <div className="text-right border-l border-[#2a2a2a] pl-4">
                    <div className="text-sm font-black text-neon">{s.sinyal_count}</div>
                    <div className="text-[8px] text-slate-600 uppercase">SINYAL</div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Level Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-3 col-span-2">
                  <div className="text-[8px] text-slate-500 uppercase mb-1">ENTRY ZONE</div>
                  <div className="text-sm font-black text-slate-100 leading-tight">{s.entry || 'N/A'}</div>
                </div>
                <div className={`p-3 border col-span-2 ${col.slBg}`}>
                  <div className="text-[8px] text-rose-400 uppercase mb-1">STOP LOSS</div>
                  <div className="text-sm font-black text-rose-400 leading-tight">{s.sl || 'N/A'}</div>
                </div>
                {tps.map((tp: string, ti: number) => (
                  <div key={ti} className="bg-emerald-900/10 border border-emerald-500/20 p-3">
                    <div className="text-[8px] text-emerald-400 uppercase mb-1">TP {ti + 1}</div>
                    <div className="text-sm font-black text-emerald-400 leading-tight">{tp}</div>
                  </div>
                ))}
              </div>

              {/* Reasons */}
              {s.kenapa?.length > 0 && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                    <Layers size={10} /> ALASAN SETUP
                  </div>
                  <ul className="space-y-1.5">
                    {s.kenapa.map((k: string, ki: number) => (
                      <li key={ki} className="flex items-start gap-2 text-[10px] text-slate-300 leading-relaxed">
                        <span className="text-neon font-black shrink-0 mt-0.5">▸</span>{k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {s.kondisi_entry?.length > 0 && (
                  <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-3">
                    <div className="text-[9px] text-amber-400 uppercase mb-2 font-bold flex items-center gap-1.5">
                      <Target size={10} /> KONDISI ENTRY
                    </div>
                    <ul className="space-y-1">
                      {s.kondisi_entry.map((k: string, ki: number) => (
                        <li key={ki} className="text-[10px] text-slate-400 leading-relaxed">• {k}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.sizing && (
                  <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-3">
                    <div className="text-[9px] text-slate-500 uppercase mb-2 font-bold flex items-center gap-1.5">
                      <DollarSign size={10} /> POSITION SIZING
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{s.sizing}</p>
                  </div>
                )}
                {s.invalidasi && (
                  <div className="bg-rose-900/10 border border-rose-500/20 p-3">
                    <div className="text-[9px] text-rose-400 uppercase mb-2 font-bold flex items-center gap-1.5">
                      <XCircle size={10} /> INVALIDASI
                    </div>
                    <p className="text-[10px] text-rose-300 leading-relaxed">{s.invalidasi}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── SQUEEZE + RISK MANAGEMENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.squeeze && (
          <div className={`border p-4 ${
            data.squeeze.tipe !== 'NONE' && data.squeeze.probabilitas === 'TINGGI'
              ? 'border-amber-500/50 bg-amber-500/5'
              : data.squeeze.tipe !== 'NONE' && data.squeeze.probabilitas === 'SEDANG'
              ? 'border-amber-500/25 bg-amber-500/5'
              : 'border-[#2a2a2a] bg-[#0f0f0f]'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {data.squeeze.tipe !== 'NONE'
                ? <AlertTriangle size={12} className="text-amber-400" />
                : <Shield size={12} className="text-emerald-500" />
              }
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                data.squeeze.tipe !== 'NONE' ? 'text-amber-400' : 'text-slate-400'
              }`}>SQUEEZE: {data.squeeze.tipe}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 border ${
                data.squeeze.probabilitas === 'TINGGI' ? 'border-amber-500/50 text-amber-400' :
                data.squeeze.probabilitas === 'SEDANG' ? 'border-amber-500/30 text-amber-500/70' :
                'border-slate-700 text-slate-600'
              }`}>{data.squeeze.probabilitas}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{data.squeeze.catatan}</p>
          </div>
        )}

        {data.risk_management && (
          <div className="border border-[#2a2a2a] bg-[#0f0f0f]">
            <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] flex items-center gap-2">
              <Shield size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RISK MANAGEMENT</span>
            </div>
            <div className="p-3 space-y-2">
              {[
                { label: 'Leverage',           value: data.risk_management.leverage_used            },
                { label: 'Jarak ke Likuidasi', value: data.risk_management.jarak_likuidasi, warn: true },
                { label: 'Max Loss',           value: data.risk_management.max_loss_rekomendasi, warn: true },
              ].filter(r => r.value).map((r, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[#1a1a1a] pb-2 last:border-0">
                  <span className="text-[9px] text-slate-500 uppercase">{r.label}</span>
                  <span className={`text-[10px] font-bold ${r.warn ? 'text-amber-400' : 'text-slate-200'}`}>{r.value}</span>
                </div>
              ))}
              {data.risk_management.rekomendasi_sizing && (
                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">{data.risk_management.rekomendasi_sizing}</p>
              )}
              {data.risk_management.peringatan?.map((w: string, wi: number) => (
                <div key={wi} className="flex items-start gap-2 bg-rose-900/10 border border-rose-500/20 p-2">
                  <AlertTriangle size={10} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-rose-300 leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ANALYST NOTES ── */}
      {data.catatan_tambahan?.length > 0 && (
        <div className="border border-[#2a2a2a] bg-[#0f0f0f]">
          <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] flex items-center gap-2">
            <Info size={12} className="text-neon/50" />
            <span className="text-[10px] font-bold text-neon/50 uppercase tracking-widest">ANALYST NOTES</span>
          </div>
          <ul className="p-4 space-y-2">
            {data.catatan_tambahan.map((note: string, ni: number) => (
              <li key={ni} className="flex items-start gap-3 text-[10px] text-slate-400 leading-relaxed">
                <span className="text-neon font-black shrink-0">{String(ni + 1).padStart(2, '0')}</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── TIMESTAMP ── */}
      {data.timestamp_analisis && (
        <div className="flex items-center gap-2 text-[9px] text-slate-700 font-mono justify-end">
          <Clock size={9} />
          Dianalisis: {new Date(data.timestamp_analisis).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
        </div>
      )}
    </div>
  );
}

// ── Legacy fallback — handles data saved before schema upgrade ──
function LegacyPremiumVisualizer({ data, coinName }: { data: any; coinName: string }) {
  const isLong  = data.decision === 'BUY';
  const isShort = data.decision === 'SELL' || data.decision === 'SHORT';
  const col = isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className="font-mono text-[11px] bg-[#050505] p-4 space-y-3">
      <div className="border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className={`text-3xl font-black tracking-widest ${col} mb-1`}>{data.decision || 'WAIT'}</div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest">{coinName} // LEGACY RESULT</div>
        {data.main_reason && <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{data.main_reason}</p>}
      </div>
      {data.plans?.map((p: any, i: number) => (
        <div key={i} className="border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <div className={`text-xs font-black mb-2 ${p.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {p.direction} — {p.type}
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div><span className="text-slate-600">ENTRY</span><div className="text-slate-200 font-bold">{p.entry_zone}</div></div>
            <div><span className="text-slate-600">SL</span><div className="text-rose-400 font-bold">{p.stop_loss}</div></div>
            <div><span className="text-slate-600">TP1</span><div className="text-emerald-400 font-bold">{p.take_profit_1}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}
