'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Activity, BarChart2, TrendingUp, DollarSign, Database, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Define the exact slots needed mirroring the terminal HTML
const SLOT_SECTIONS = [
  {
    id: 's1',
    title: '01 // CHART KOIN — MULTI TIMEFRAME',
    icon: <BarChart2 size={18} />,
    slots: [
      { id: 'sl-1w', label: '1W', sub: 'Weekly' },
      { id: 'sl-1d', label: '1D', sub: 'Daily' },
      { id: 'sl-4h', label: '4H', sub: '4 Jam' },
      { id: 'sl-1h', label: '1H', sub: '1 Jam' },
      { id: 'sl-15m', label: '15M', sub: '15 Mnt' }
    ]
  },
  {
    id: 's2',
    title: '02 // COINGLASS — STANDARD DATA',
    icon: <Database size={18} />,
    slots: [
      { id: 'sl-hm', label: 'HEATMAP', sub: 'Liq Map' },
      { id: 'sl-fr', label: 'FUNDING', sub: 'Current' },
      { id: 'sl-ls', label: 'L/S RATIO', sub: 'Current' }
    ]
  },
  {
    id: 's3',
    title: '03 // EXHAUSTION SIGNALS — REVERSAL DETECTOR',
    icon: <Activity size={18} />,
    slots: [
      { id: 'sl-frh1', label: 'FUND.H 7D', sub: 'Funding' },
      { id: 'sl-frh2', label: 'FUND.H 30D', sub: 'Funding' },
      { id: 'sl-lsh1', label: 'L/S.H 7D', sub: 'L/S Ratio' },
      { id: 'sl-lsh2', label: 'L/S.H 30D', sub: 'L/S Ratio' },
      { id: 'sl-liqh1', label: 'LIQ.H 24H', sub: 'Liquidation' },
      { id: 'sl-liqh2', label: 'LIQ.H 7D', sub: 'Liquidation' },
      { id: 'sl-vp1d', label: 'VOL.P 1D', sub: 'TradingView' },
      { id: 'sl-vp4h', label: 'VOL.P 4H', sub: 'TradingView' }
    ]
  },
  {
    id: 's4',
    title: '04 // BTC PRICE — MACRO TO MICRO',
    icon: <TrendingUp size={18} />,
    slots: [
      { id: 'sl-btc1d', label: 'BTC 1D', sub: 'Daily' },
      { id: 'sl-btc4h', label: 'BTC 4H', sub: '4 Jam' },
      { id: 'sl-btc1h', label: 'BTC 1H', sub: '1 Jam' }
    ]
  },
  {
    id: 's5',
    title: '05 // DOMINANCE — LIQUIDITY FLOW',
    icon: <DollarSign size={18} />,
    slots: [
      { id: 'sl-btcd1d', label: 'BTC.D 1D', sub: 'Daily' },
      { id: 'sl-btcd4h', label: 'BTC.D 4H', sub: '4 Jam' },
      { id: 'sl-usdtd1d', label: 'USDT.D 1D', sub: 'Daily' },
      { id: 'sl-usdtd4h', label: 'USDT.D 4H', sub: '4 Jam' }
    ]
  }
];

// Flatten for easy mapping
const ALL_SLOT_IDS = SLOT_SECTIONS.flatMap(sec => sec.slots.map(s => s.id));

export default function PremiumTerminal() {
  const [images, setImages] = useState<Record<string, { file: File, preview: string, base64: string }>>({});
  const [activePasteSlot, setActivePasteSlot] = useState<string | null>(null);
  
  // Inputs
  const [coinName, setCoinName] = useState('');
  const [leverage, setLeverage] = useState('');
  const [capital, setCapital] = useState('');

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);

  // Focus empty slot logically
  const nextEmptySlot = ALL_SLOT_IDS.find(id => !images[id]);

  useEffect(() => {
    // Global Paste Listener
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      let imageFile: File | null = null;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          imageFile = item.getAsFile();
          break;
        }
      }
      if (!imageFile) return;
      
      e.preventDefault();
      
      const targetSlotId = activePasteSlot || nextEmptySlot;
      if (!targetSlotId) {
        toast.info("Semua slot sudah terisi.");
        return;
      }

      await handleFileSelect(imageFile, targetSlotId);
      setActivePasteSlot(null); // Clear active paste state
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activePasteSlot, images, nextEmptySlot]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (file: File, slotId: string) => {
    try {
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      setImages(prev => ({ ...prev, [slotId]: { file, preview, base64 } }));
      toast.success(`Gambar untuk ${slotId.replace('sl-', '').toUpperCase()} ditambahkan.`);
    } catch (e) {
      toast.error("Gagal membaca file gambar.");
    }
  };

  const removeImage = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    setImages(prev => {
      const next = { ...prev };
      if (next[slotId]?.preview) URL.revokeObjectURL(next[slotId].preview);
      delete next[slotId];
      return next;
    });
  };

  const executeAnalysis = async () => {
    if (!coinName) {
      toast.error('Masukkan nama koin terlebih dahulu.');
      return;
    }
    if (!leverage) {
      toast.error('Pilih leverage.');
      return;
    }

    setIsExecuting(true);
    setResultData(null);
    toast.loading('Menganalisa data market...', { id: 'analyze-toast' });

    try {
      const promptText = `
Kamu adalah analis trading crypto profesional dari Trenova Intelligence.
Data: ${Object.keys(images).length} screenshot koin ${coinName.toUpperCase()}, Leverage: ${leverage}, Modal: ${capital ? capital + ' USDT' : '-'}.

Screenshots terlampir (berdasarkan urutan waktu dan sumber data).
Fokus pada deteksi Liquidity sweep, Reversal pattern, dan Exhaustion (Buyer/Seller fatigue).

Analisa gambar-gambar ini secara holistik, pastikan tidak bias, dan kembalikan HANYA respons berformat JSON valid tanpa awalan/akhiran text markdown apapun, mengikuti struktur ini:
{
  "koin": "${coinName.toUpperCase()}",
  "bias": {
    "arah": "BEARISH" | "BULLISH" | "SIDEWAYS",
    "kekuatan": "KUAT" | "SEDANG" | "LEMAH",
    "detail": [{"tf": "Weekly/Daily/4H/BTC/USDTD", "kondisi": "penjelasan..."}]
  },
  "sinyal": [
    {"nama": "CVD Divergence", "on": true/false, "catatan": "..."},
    {"nama": "Funding Rate Ekstrem", "on": true/false, "catatan": "..."}
  ],
  "setup": [
    {
      "arah": "LONG" | "SHORT" | "SKIP",
      "keyakinan": 80,
      "sinyal_count": 5,
      "kenapa": ["alasan 1"],
      "entry": "$xxx - $yyy",
      "sl": "$xxx",
      "tp1": "$xxx", "tp2": "$yyy", "tp3": "$zzz",
      "rr": "1:3",
      "sizing": "2% modal",
      "kondisi_entry": ["tunggu reject dari xy"],
      "invalidasi": "kalau candle tembus zz"
    }
  ],
  "squeeze": {
    "tipe": "LONG SQUEEZE" | "SHORT SQUEEZE" | "NONE",
    "probabilitas": "TINGGI" | "SEDANG" | "RENDAH",
    "catatan": "..."
  },
  "catatan_tambahan": ["tips 1", "risiko utama..."]
}
`;

      const imagePayload = Object.entries(images).map(([id, data]) => ({
        label: `Screenshot [${id.replace('sl-', '').toUpperCase()}]`,
        media_type: data.file.type || 'image/png',
        data: data.base64.split(',')[1] // Just the raw b64
      }));

      const res = await fetch('/api/terminal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, images: imagePayload })
      });

      const resJson = await res.json();
      
      if (!res.ok) {
        throw new Error(resJson.error || 'API Error');
      }

      const cleanJsonStr = resJson.result.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanJsonStr);
      
      setResultData(parsedData);
      toast.success('Analisa selesai!', { id: 'analyze-toast' });
    } catch (e: any) {
      console.error(e);
      toast.error(`Error: ${e.message}`, { id: 'analyze-toast' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Rendering Helper for slots
  const renderSlot = (slot: {id: string, label: string, sub: string}) => {
    const hasImage = !!images[slot.id];
    const isPasteActive = activePasteSlot === slot.id;
    
    return (
      <div 
        key={slot.id} 
        onClick={() => document.getElementById(`fi-${slot.id}`)?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file?.type.startsWith('image/')) handleFileSelect(file, slot.id);
        }}
        className={`relative flex flex-col items-center justify-center p-2 h-28 lg:h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden group 
          ${hasImage ? 'border-solid border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 hover:border-neon hover:bg-neon/5'}
          ${isPasteActive ? 'ring-2 ring-neon border-neon' : ''}
        `}
      >
        <input 
          id={`fi-${slot.id}`} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelect(e.target.files[0], slot.id);
            e.target.value = ''; // reset so same file can be chosen again
          }} 
        />
        
        {hasImage ? (
          <>
            <img src={images[slot.id].preview} alt={slot.label} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <button 
              onClick={(e) => removeImage(e, slot.id)}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-md"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {slot.label}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center z-10">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-slate-400">
              <Upload size={16} />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-wider">{slot.label}</span>
            <span className="text-[10px] text-slate-500">{slot.sub}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setActivePasteSlot(slot.id); }}
              className={`mt-2 text-[9px] px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-bold hover:bg-neon hover:text-white transition-colors
                ${isPasteActive ? 'bg-neon text-white' : 'text-slate-500'}
              `}
            >
              {isPasteActive ? "READY TO PASTE" : "PASTE"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const filledCount = Object.keys(images).length;
  const progressPercent = Math.round((filledCount / ALL_SLOT_IDS.length) * 100);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 px-3 md:space-y-8 md:px-8 pt-4 md:pt-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold tracking-widest rounded uppercase">
              Premium Exclusive
            </div>
          </div>
          <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-foreground mb-1 md:mb-2 flex items-center gap-2">
            <Sparkles className="text-neon w-6 h-6 md:w-8 md:h-8" /> Data Terminal
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Upload market structure screenshots for deep holistic AI analysis.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider">DATA COMPLETENESS</span>
          <span className="text-xl font-bold text-neon">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-neon transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold text-slate-400">
           <span>{filledCount} of {ALL_SLOT_IDS.length} slots filled</span>
           <span className="opacity-50">•</span>
           <span>Tip: Use Ctrl+V to quickly paste directly to slots</span>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Koin (Wajib)</label>
            <input 
              value={coinName} onChange={e => setCoinName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-neon"
              placeholder="BTC / ETH / SOL..."
            />
         </div>
         <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Leverage</label>
            <select 
              value={leverage} onChange={e => setLeverage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-neon"
            >
              <option value="">PILIH LEVERAGE</option>
              <option value="Spot">Spot (1x)</option>
              <option value="5x">5x</option>
              <option value="10x">10x</option>
              <option value="20x">20x</option>
              <option value="50x">50x</option>
            </select>
         </div>
         <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Modal (Opsional)</label>
            <div className="relative">
              <input 
                type="number" value={capital} onChange={e => setCapital(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-12 text-sm font-bold text-foreground focus:outline-none focus:border-neon"
                placeholder="1000..."
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USDT</span>
            </div>
         </div>
      </div>

      {/* Slots Rendering */}
      <div className="space-y-6">
        {SLOT_SECTIONS.map((sec, secIdx) => (
           <div key={sec.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
               <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-neon border border-slate-200 dark:border-slate-800">
                 {sec.icon}
               </div>
               <h2 className="text-sm md:text-base font-black tracking-wider text-slate-800 dark:text-slate-200">
                 {sec.title}
               </h2>
               <div className="ml-auto text-xs font-bold px-2 py-1 rounded bg-slate-50 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800">
                 {sec.slots.filter(s => images[s.id]).length} / {sec.slots.length}
               </div>
             </div>
             
             {/* Responsive grid depending on slot count inside section */}
             <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-${Math.min(5, sec.slots.length)} gap-3 md:gap-4`}>
                {sec.slots.map(renderSlot)}
             </div>
           </div>
        ))}
      </div>

      {/* Action Area */}
      <div className="sticky bottom-6 z-20">
        <button 
          onClick={executeAnalysis}
          disabled={isExecuting || !coinName || !leverage}
          className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-black py-4 rounded-2xl font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:-translate-y-1 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed border border-slate-800 dark:border-white shadow-neon/10"
        >
          {isExecuting ? (
            <><Loader2 className="animate-spin" size={20} /> Menganalisa Data AI...</>
          ) : (
            <><Activity size={20} className="text-neon" /> Execute AI Deep Diagnosis</>
          )}
        </button>
      </div>

      {/* Result Display */}
      {resultData && (
        <div className="mt-12 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-8 mt-12 block" id="result-view">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                 <p className="text-sm font-bold text-slate-500 tracking-wider mb-1">TERMINAL VERDICT</p>
                 <h2 className="text-3xl font-black text-foreground">{resultData.koin}</h2>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                   resultData.bias?.arah === 'BULLISH' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 
                   resultData.bias?.arah === 'BEARISH' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' : 
                   'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                }`}>
                  BIAS: {resultData.bias?.arah} 
                  <span className="opacity-60">({resultData.bias?.kekuatan})</span>
                </span>
              </div>
           </div>

           {/* Setups */}
           {resultData.setup && resultData.setup.length > 0 && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
               {resultData.setup.map((st: any, idx: number) => {
                 const isLong = st.arah === 'LONG';
                 const isShort = st.arah === 'SHORT';
                 
                 return (
                 <div key={idx} className={`border rounded-2xl overflow-hidden ${
                    isLong ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10' :
                    isShort ? 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10' :
                    'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                 }`}>
                    <div className={`p-4 border-b flex justify-between items-center ${
                      isLong ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-100/50 dark:bg-emerald-900/20' :
                      isShort ? 'border-red-100 dark:border-red-900/50 bg-red-100/50 dark:bg-red-900/20' :
                      'border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900'
                    }`}>
                      <span className={`font-black text-lg ${isLong?'text-emerald-700 dark:text-emerald-400':isShort?'text-red-700 dark:text-red-400':'text-slate-600'}`}>{st.arah} SETUP</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-foreground">{st.keyakinan}%</span>
                        <p className="text-[10px] text-slate-500 font-bold tracking-wider">CONFIDENCE</p>
                      </div>
                    </div>
                    
                    <div className="p-5 space-y-3">
                       <div className="grid grid-cols-2 gap-2 text-sm">
                         <div className="space-y-2">
                           <p><span className="text-slate-500 text-xs">Entry Area</span><br/><span className="font-bold font-mono">{st.entry}</span></p>
                           <p><span className="text-red-500/80 text-xs">Stop Loss</span><br/><span className="font-bold font-mono text-red-500">{st.sl}</span></p>
                         </div>
                         <div className="space-y-2">
                           <p><span className="text-emerald-500/80 text-xs">Take Profit</span><br/><span className="font-bold font-mono text-emerald-500">{st.tp1}</span></p>
                           <p><span className="text-slate-500 text-xs">Risk:Reward</span><br/><span className="font-bold text-neon">{st.rr}</span></p>
                         </div>
                       </div>
                       
                       {st.invalidasi && (
                         <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
                           <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block mb-1">INVALIDATION</span>
                           <span className="text-xs text-red-800 dark:text-red-200">{st.invalidasi}</span>
                         </div>
                       )}
                    </div>
                 </div>
               )})}
             </div>
           )}

           {/* Sinyal Highlights */}
           {resultData.sinyal && resultData.sinyal.length > 0 && (
             <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">EXHAUSTION SIGNALS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resultData.sinyal.map((syn: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl border flex gap-3 items-start ${syn.on ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                       <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${syn.on ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                       <div>
                         <p className={`text-xs font-bold mb-1 ${syn.on ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500'}`}>{syn.nama}</p>
                         <p className="text-[10px] text-slate-500 leading-snug">{syn.catatan}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* Squeeze & Notes */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resultData.squeeze && resultData.squeeze.tipe !== 'NONE' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                   <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-wider mb-2 flex items-center gap-2">
                     <Activity size={14} /> SQUEEZE WARNING ({resultData.squeeze.probabilitas})
                   </h3>
                   <p className="text-sm font-black text-amber-800 dark:text-amber-200">{resultData.squeeze.tipe}</p>
                   <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{resultData.squeeze.catatan}</p>
                </div>
              )}
              
              {resultData.catatan_tambahan && resultData.catatan_tambahan.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                   <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3">ADDITIONAL NOTES</h3>
                   <ul className="space-y-2">
                     {resultData.catatan_tambahan.map((note: string, i: number) => (
                       <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                         <ArrowRight size={12} className="text-neon mt-0.5 flex-shrink-0" />
                         <span>{note}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              )}
           </div>

        </div>
      )}

    </div>
  );
}

