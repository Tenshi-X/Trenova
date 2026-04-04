'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Upload, X, FileText, Loader2, Sparkles, TrendingUp, Activity,
  ChevronRight, Link as LinkIcon, CheckCircle2, Circle
} from 'lucide-react';
import clsx from 'clsx';

// ─── Types ───────────────────────────────────────────────────────
interface SlotDef {
  id: string;
  label: string;
  sublabel: string;
  required: boolean;
  guideText: string;
  guideLink?: string;
  guideLinkLabel?: string;
  section: number;
}

interface SlotData {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

// ─── Slot Definitions (from v3) ───────────────────────────────────
const SLOT_DEFS: SlotDef[] = [
  // Section 1: Chart Koin
  { id: 'chart-1w',  label: '1W',     sublabel: 'Weekly',   required: true,  guideText: 'EMA 5/10/30 · Volume · CVD · OI — Screenshot chart 1W', section: 1 },
  { id: 'chart-1d',  label: '1D',     sublabel: 'Daily',    required: true,  guideText: 'EMA 5/10/30 · Volume · CVD — Screenshot chart 1D', section: 1 },
  { id: 'chart-4h',  label: '4H',     sublabel: '4 Jam',    required: true,  guideText: 'EMA 5/10/30 · Volume · CVD · OI — Screenshot chart 4H', section: 1 },
  { id: 'chart-1h',  label: '1H',     sublabel: '1 Jam',    required: true,  guideText: 'EMA 5/10/30 · Volume · CVD — Screenshot chart 1H', section: 1 },
  { id: 'chart-15m', label: '15M',    sublabel: '15 Mnt',   required: true,  guideText: 'EMA 5/10/30 · Volume · CVD — Screenshot chart 15M', section: 1 },
  // Section 2: Coinglass
  { id: 'cg-hm',    label: 'HEATMAP', sublabel: 'Liq Map',  required: true,
    guideText: 'Liquidation Heatmap — Screenshot seluruh chart heatmap',
    guideLink: 'https://www.coinglass.com/pro/futures/LiquidationHeatMap', guideLinkLabel: 'Buka Coinglass ↗', section: 2 },
  { id: 'cg-fr',    label: 'FUNDING', sublabel: 'Current',  required: true,
    guideText: 'Funding Rate — Cari koinmu di tabel → screenshot',
    guideLink: 'https://www.coinglass.com/FundingRate', guideLinkLabel: 'Buka Coinglass ↗', section: 2 },
  { id: 'cg-ls',    label: 'L/S RATIO', sublabel: 'Current', required: true,
    guideText: 'Long/Short Ratio — Scroll ke L/S Ratio → screenshot',
    guideLink: 'https://www.coinglass.com/LongShortRatio', guideLinkLabel: 'Buka Coinglass ↗', section: 2 },
  // Section 3: Exhaustion (optional)
  { id: 'ex-frh7',  label: 'FUND.H',  sublabel: '7D',       required: false,
    guideText: 'Funding History 7D — Pilih koin → ganti range 7D',
    guideLink: 'https://www.coinglass.com/FundingRate', guideLinkLabel: 'Buka Coinglass ↗', section: 3 },
  { id: 'ex-frh30', label: 'FUND.H',  sublabel: '30D',      required: false,
    guideText: 'Funding History 30D — Ganti ke 30D',
    guideLink: 'https://www.coinglass.com/FundingRate', guideLinkLabel: 'Buka Coinglass ↗', section: 3 },
  { id: 'ex-lsh7',  label: 'L/S.H',   sublabel: '7D',       required: false,
    guideText: 'L/S History 7D — Scroll ke L/S Ratio → ganti 7D',
    guideLink: 'https://www.coinglass.com/LongShortRatio', guideLinkLabel: 'Buka Coinglass ↗', section: 3 },
  { id: 'ex-lsh30', label: 'L/S.H',   sublabel: '30D',      required: false,
    guideText: 'L/S History 30D — Ganti ke 30D',
    guideLink: 'https://www.coinglass.com/LongShortRatio', guideLinkLabel: 'Buka Coinglass ↗', section: 3 },
];

const SECTION_LABELS: Record<number, { title: string; required: boolean }> = {
  1: { title: '01 // CHART KOIN — MULTI TIMEFRAME', required: true },
  2: { title: '02 // COINGLASS — STANDARD DATA', required: true },
  3: { title: '03 // EXHAUSTION SIGNALS (Opsional)', required: false },
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

interface AIInputSlotsProps {
  coinName: string;
  leverage: string;
  modal: string;
  onLeverageChange: (v: string) => void;
  onModalChange: (v: string) => void;
  onSlotsChange: (slots: SlotData[]) => void;
  onReset?: () => void;
}

export default function AIInputSlots({
  coinName,
  leverage,
  modal,
  onLeverageChange,
  onModalChange,
  onSlotsChange,
  onReset,
}: AIInputSlotsProps) {
  const [slots, setSlots] = useState<Map<string, SlotData>>(new Map());
  const [activeSection, setActiveSection] = useState<number | null>(1);
  const [activePasteSlot, setActivePasteSlot] = useState<string | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const sections = [...new Set(SLOT_DEFS.map(s => s.section))];

  // Completeness
  const requiredSlots = SLOT_DEFS.filter(s => s.required);
  const filledRequired = requiredSlots.filter(s => slots.has(s.id)).length;
  const totalRequired = requiredSlots.length;
  const completeness = Math.round((filledRequired / totalRequired) * 100);

  // Count per section
  const sectionCounts = sections.map(sec => ({
    sec,
    total: SLOT_DEFS.filter(s => s.section === sec && s.required).length,
    filled: SLOT_DEFS.filter(s => s.section === sec && slots.has(s.id)).length,
  }));

  // Notify parent
  useEffect(() => {
    onSlotsChange([...slots.values()]);
  }, [slots, onSlotsChange]);

  // Paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!activePasteSlot) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) await setSlotFile(activePasteSlot, file);
          setActivePasteSlot(null);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activePasteSlot]);

  const setSlotFile = async (slotId: string, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      setSlots(prev => {
        const next = new Map(prev);
        next.set(slotId, { id: slotId, file, preview, base64 });
        return next;
      });
    } catch (e) {
      console.error('Failed to process file:', e);
    }
  };

  const removeSlot = (slotId: string) => {
    setSlots(prev => {
      const next = new Map(prev);
      const old = next.get(slotId);
      if (old) URL.revokeObjectURL(old.preview);
      next.delete(slotId);
      return next;
    });
  };

  const handleFileInput = async (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await setSlotFile(slotId, file);
    e.target.value = '';
  };

  // Drag & Drop per slot
  const handleDrop = async (slotId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await setSlotFile(slotId, file);
    }
  };

  const resetAll = () => {
    slots.forEach(s => URL.revokeObjectURL(s.preview));
    setSlots(new Map());
    onReset?.();
  };

  const getCompletionColor = () => {
    if (completeness >= 100) return 'bg-emerald-500';
    if (completeness >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            DATA COMPLETENESS
          </span>
          <span className={clsx(
            'text-sm font-black',
            completeness >= 100 ? 'text-emerald-500' : completeness >= 60 ? 'text-amber-500' : 'text-rose-500'
          )}>
            {completeness}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', getCompletionColor())}
            style={{ width: `${completeness}%` }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {sectionCounts.map(({ sec, total, filled }) => (
            <button
              key={sec}
              onClick={() => setActiveSection(activeSection === sec ? null : sec)}
              className={clsx(
                'text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                activeSection === sec
                  ? 'bg-neon/10 border-neon text-neon'
                  : filled >= total
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500',
              )}
            >
              [{filled >= total ? '✓' : `${filled}/${total}`}] {SECTION_LABELS[sec].title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map(sec => {
        const def = SECTION_LABELS[sec];
        const { filled, total } = sectionCounts.find(s => s.sec === sec)!;
        const slotsInSec = SLOT_DEFS.filter(s => s.section === sec);
        const isOpen = activeSection === sec;

        return (
          <div key={sec} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Section Header */}
            <button
              onClick={() => setActiveSection(isOpen ? null : sec)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {filled >= total && total > 0 ? (
                  <CheckCircle2 size={16} className="text-emerald-500 flex-none" />
                ) : (
                  <Circle size={16} className={clsx('flex-none', def.required ? 'text-rose-400' : 'text-slate-300')} />
                )}
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {def.title}
                </span>
                {!def.required && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded">
                    OPSIONAL
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs font-bold', filled >= total ? 'text-emerald-500' : 'text-slate-400')}>
                  {filled}/{total}
                </span>
                <ChevronRight size={14} className={clsx('text-slate-400 transition-transform', isOpen && 'rotate-90')} />
              </div>
            </button>

            {/* Section Body */}
            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 mt-2 mb-3">
                  Klik slot untuk pilih file, 📋 PASTE setelah screenshot, atau drag & drop
                </p>
                <div className={clsx(
                  'grid gap-3',
                  slotsInSec.length <= 3 ? 'grid-cols-3' :
                  slotsInSec.length === 4 ? 'grid-cols-4' :
                  'grid-cols-5'
                )}>
                  {slotsInSec.map(slotDef => {
                    const slotData = slots.get(slotDef.id);
                    const isPasteActive = activePasteSlot === slotDef.id;

                    return (
                      <div key={slotDef.id} className="flex flex-col gap-1">
                        {/* Slot box */}
                        <div
                          onClick={() => !slotData && fileInputRefs.current.get(slotDef.id)?.click()}
                          onDrop={e => handleDrop(slotDef.id, e)}
                          onDragOver={e => e.preventDefault()}
                          className={clsx(
                            'relative rounded-xl border-2 aspect-square overflow-hidden cursor-pointer transition-all',
                            slotData
                              ? 'border-emerald-400 dark:border-emerald-600 bg-slate-900'
                              : isPasteActive
                              ? 'border-neon bg-neon/5 animate-pulse'
                              : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-neon hover:bg-neon/5'
                          )}
                        >
                          {slotData ? (
                            <>
                              <img src={slotData.preview} alt={slotDef.label} className="w-full h-full object-cover opacity-90" />
                              <div className="absolute top-1 right-1 bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold">✓</div>
                              <button
                                onClick={e => { e.stopPropagation(); removeSlot(slotDef.id); }}
                                className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full"
                              >
                                <X size={10} />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                              <Upload size={14} className={clsx('transition-colors', isPasteActive ? 'text-neon' : 'text-slate-300 dark:text-slate-600')} />
                              <span className={clsx('text-[9px] font-bold', isPasteActive ? 'text-neon' : 'text-slate-300 dark:text-slate-600')}>
                                {isPasteActive ? 'CTRL+V' : 'PILIH'}
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => { if (el) fileInputRefs.current.set(slotDef.id, el); }}
                            onChange={e => handleFileInput(slotDef.id, e)}
                            className="hidden"
                          />
                        </div>

                        {/* Label + Paste Button */}
                        <div className="text-center">
                          <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 leading-none">{slotDef.label}</div>
                          <div className="text-[9px] text-slate-400 leading-none">{slotDef.sublabel}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setActivePasteSlot(isPasteActive ? null : slotDef.id)}
                            className={clsx(
                              'flex-1 text-[9px] font-bold py-0.5 rounded border transition-all',
                              isPasteActive
                                ? 'bg-neon text-white dark:text-black border-neon'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-neon hover:text-neon'
                            )}
                          >
                            📋 PASTE
                          </button>
                        </div>

                        {/* Guide Link */}
                        {slotDef.guideLink && (
                          <a
                            href={slotDef.guideLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[9px] text-center text-blue-400 hover:text-blue-500 underline underline-offset-1 truncate"
                          >
                            {slotDef.guideLinkLabel}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Position Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          06 // POSITION INFO
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Leverage</label>
            <select
              value={leverage}
              onChange={e => onLeverageChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-neon/50 appearance-none"
            >
              <option value="">Pilih Leverage...</option>
              {['3x','5x','10x','15x','20x','25x','50x','75x','100x'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Modal (USDT)</label>
            <input
              type="number"
              value={modal}
              onChange={e => onModalChange(e.target.value)}
              placeholder="Jumlah USDT..."
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-neon/50"
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      {slots.size > 0 && (
        <button
          onClick={resetAll}
          className="w-full py-2 text-xs font-bold text-rose-400 hover:text-rose-500 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
        >
          ↺ RESET SEMUA DATA
        </button>
      )}
    </div>
  );
}
