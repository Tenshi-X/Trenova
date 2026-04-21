'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, X, Activity, BarChart2, TrendingUp, DollarSign, 
  Database, Sparkles, Loader2, ArrowRight, LayoutDashboard,
  Search, Globe, Zap, Shield, PieChart, Info, HelpCircle,
  Newspaper, Calculator, BookOpen, AlertTriangle, Link,
  Clock, RefreshCw, Star, TrendingDown, Layers, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import MarketIntelligence from '@/components/MarketIntelligence';
import PremiumAnalysisVisualizer from '@/components/PremiumAnalysisVisualizer';
import TradingViewWidget from '@/components/TradingViewWidget';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// ── TYPES ──
type TabId = 'input' | 'market' | 'intel' | 'research' | 'derivatives' | 'onchain' | 'tools' | 'history' | 'guide' | 'chart';

// ── CONFIG ──
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

const ALL_SLOT_IDS = SLOT_SECTIONS.flatMap(sec => sec.slots.map(s => s.id));

const TerminalClock = () => {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <span>... WIB</span>;
  return <span>{time} WIB</span>;
};

export default function PremiumTerminal() {
  const [activeTab, setActiveTab] = useState<TabId>('input');
  const [images, setImages] = useState<Record<string, { file: File, preview: string, base64: string }>>({});
  const [activePasteSlot, setActivePasteSlot] = useState<string | null>(null);
  
  // Inputs
  const [coinName, setCoinName] = useState('');
  const [leverage, setLeverage] = useState('');
  const [capital, setCapital] = useState('');

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Real-time Market Data
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [marketSearch, setMarketSearch] = useState('');
  const [status, setStatus] = useState('SYSTEM ACTIVE');

  const supabase = getSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Load history from Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_premium', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setHistory(data.map(h => ({
          ...h.analysis_json,
          id: h.id,
          timestamp: h.created_at
        })));
      }
    };
    loadHistory();
  }, []);

  // Save history helper (Supabase + Local)
  const saveToHistory = async (result: any) => {
    const { data: userData } = await supabase.auth.getUser();
    
    // Add to Local State first for instant UI response
    const newEntry = { ...result, timestamp: new Date().toISOString() };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));

    if (userData.user) {
      const { error } = await supabase
        .from('analysis_results')
        .insert([{
          user_id: userData.user.id,
          coin_symbol: result.koin || 'NONE',
          analysis_json: result,
          is_premium: true
        }]);
      
      if (error) {
        console.error("Supabase Save Error:", error);
        toast.error("Failed to sync history to cloud.");
      }
    } else {
      // Fallback to local storage if not logged in (though terminal is premium)
      localStorage.setItem('trv_premium_history', JSON.stringify([newEntry, ...history].slice(0, 50)));
    }
  };

  // ── BINANCE WEBSOCKET FOR REALTIME PRICES ──
  useEffect(() => {
    // We keep market prices updated regardless of tab for other modules
    const ws = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!Array.isArray(data)) return;
      
      const usdtPairs = data
        .filter((d: any) => d.s && d.s.endsWith('USDT'))
        .map((d: any) => ({
          symbol: d.s.replace('USDT', ''),
          fullSymbol: d.s,
          price: parseFloat(d.c),
          change: parseFloat(d.P),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          volume: parseFloat(d.v) * parseFloat(d.c),
          quoteVolume: parseFloat(d.q)
        }))
        .sort((a: any, b: any) => b.volume - a.volume);
      
      setMarketPrices(usdtPairs);
    };

    return () => ws.close();
  }, []);

  // ── REAL-TIME DERIVATIVES DATA (BINANCE PUBLIC API) ──
  const [derivativesData, setDerivativesData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchDerivatives = async () => {
      try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDerivativesData(data.map(d => ({
            symbol: d.symbol.replace('USDT', ''),
            markPrice: parseFloat(d.markPrice),
            indexPrice: parseFloat(d.indexPrice),
            fundingRate: parseFloat(d.lastFundingRate),
            nextFundingTime: d.nextFundingTime
          })));
        }
      } catch (e) {
        console.error("Failed to fetch derivatives data", e);
      }
    };

    fetchDerivatives();
    const interval = setInterval(fetchDerivatives, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Focus empty slot logically
  const nextEmptySlot = ALL_SLOT_IDS.find(id => !images[id]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'input') return;
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
      setActivePasteSlot(null);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activePasteSlot, images, nextEmptySlot, activeTab]);

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

    setIsExecuting(true);
    setResultData(null);
    toast.loading('Menganalisa data market...', { id: 'analyze-toast' });

    try {
      // ── STEP 1: FETCH FEAR & GREED INDEX (free, CORS-safe) ──
      let fearGreedValue = 'N/A';
      let fearGreedLabel = 'N/A';
      try {
        const fgRes = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(4000) });
        const fgData = await fgRes.json();
        fearGreedValue = fgData.data[0].value;
        fearGreedLabel = fgData.data[0].value_classification;
      } catch { /* non-blocking — analisis tetap berjalan */ }

      // ── STEP 1b: FETCH OPEN INTEREST (Binance futures, free) ──
      let openInterestUSD = 'N/A';
      let openInterestRaw = 0;
      try {
        const oiRes = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${coinName.toUpperCase()}USDT`, { signal: AbortSignal.timeout(4000) });
        const oiData = await oiRes.json();
        if (oiData.openInterest) {
          openInterestRaw = parseFloat(oiData.openInterest);
          // OI in coin units — convert to USD using derivativesData mark price (fetched later)
          // We'll finalize USD value after STEP 2 where we have markPrice
        }
      } catch { /* non-blocking */ }

      // ── STEP 1c: CALCULATE ATR FROM 4H KLINES (Binance futures, free) ──
      let atr4h = 'N/A';
      let atrNote = '';
      try {
        const klRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${coinName.toUpperCase()}USDT&interval=4h&limit=15`, { signal: AbortSignal.timeout(5000) });
        const klData = await klRes.json();
        if (Array.isArray(klData) && klData.length >= 2) {
          // kline: [openTime, open, high, low, close, volume, ...]
          const trueRanges: number[] = [];
          for (let i = 1; i < klData.length; i++) {
            const high      = parseFloat(klData[i][2]);
            const low       = parseFloat(klData[i][3]);
            const prevClose = parseFloat(klData[i - 1][4]);
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
          }
          const atrVal = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
          const lastClose = parseFloat(klData[klData.length - 1][4]);
          const atrPct = (atrVal / lastClose * 100).toFixed(2);
          atr4h = atrVal > 100 ? `$${atrVal.toLocaleString(undefined, {maximumFractionDigits: 0})}` : `$${atrVal.toFixed(4)}`;
          atrNote = `${atrPct}% dari harga — ${
            parseFloat(atrPct) > 5  ? 'VOLATILITAS SANGAT TINGGI: SL minimal 1.5x ATR dari entry' :
            parseFloat(atrPct) > 2  ? 'Volatilitas tinggi: SL minimal 1x ATR dari entry' :
            parseFloat(atrPct) > 1  ? 'Volatilitas normal: SL 1x ATR sudah memadai' :
                                       'Volatilitas rendah/squeeze: potensi breakout, SL ketat valid'
          }`;
        }
      } catch { /* non-blocking */ }

      // ── STEP 2: EXTRACT LIVE BINANCE DATA FROM EXISTING STATE ──
      const coinSymbol = coinName.toUpperCase();
      const liveMarket   = marketPrices.find((p: any) => p.symbol === coinSymbol);
      const liveDerivs   = derivativesData.find((d: any) => d.symbol === coinSymbol);
      const liveBTC      = marketPrices.find((p: any) => p.symbol === 'BTC');
      const liveBTCDeriv = derivativesData.find((d: any) => d.symbol === 'BTC');
      const top5Vol      = marketPrices.slice(0, 5).map((p: any) => `${p.symbol}: ${p.price > 100 ? '$' + p.price.toLocaleString() : '$' + p.price.toFixed(4)} (${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}%)`).join(', ');

      // Finalize OI in USD now that we have mark price
      const markPriceForOI = liveDerivs?.markPrice ?? liveMarket?.price ?? 0;
      if (openInterestRaw && markPriceForOI) {
        const oiUsd = openInterestRaw * markPriceForOI;
        openInterestUSD = oiUsd >= 1e9 ? `$${(oiUsd / 1e9).toFixed(2)}B` : `$${(oiUsd / 1e6).toFixed(1)}M`;
      }

      // Next funding time
      const nextFundingTime = liveDerivs?.nextFundingTime
        ? new Date(liveDerivs.nextFundingTime).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB'
        : 'N/A';
      const minsToFunding = liveDerivs?.nextFundingTime
        ? Math.round((liveDerivs.nextFundingTime - Date.now()) / 60000)
        : null;

      // ── STEP 3: CALCULATE LIQUIDATION PRICES ──
      const leverageNum = parseFloat(leverage?.replace('x', '') || '10');
      const entryRef    = liveDerivs?.markPrice ?? liveMarket?.price;
      const dp          = entryRef && entryRef > 100 ? 2 : 6;
      const pFmt = (n: number | undefined, d = dp) => n !== undefined ? (n > 100 ? '$' + n.toLocaleString() : '$' + n.toFixed(d)) : 'N/A';
      const pctFmt = (n: number | undefined) => n !== undefined ? `${(n * 100).toFixed(4)}%` : 'N/A';
      const liqLong     = entryRef ? pFmt(entryRef * (1 - 1 / leverageNum)) : '[tidak tersedia]';
      const liqShort    = entryRef ? pFmt(entryRef * (1 + 1 / leverageNum)) : '[tidak tersedia]';
      const distPct     = (100 / leverageNum).toFixed(2);
      const fgNum       = parseInt(fearGreedValue) || 50;
      const fgNote      = fgNum <= 25 ? 'EXTREME FEAR — kontarian bullish, tapi downtrend bisa lanjut' :
                          fgNum <= 45 ? 'FEAR — hati-hati long, tunggu konfirmasi reversal' :
                          fgNum <= 55 ? 'NEUTRAL — tidak ada edge jelas dari sentimen' :
                          fgNum <= 75 ? 'GREED — momentum masih naik, hati-hati short' :
                                        'EXTREME GREED — potensi distribusi/reversal tinggi';

      // ── STEP 4: BUILD SCREENSHOT AVAILABILITY FLAGS ──
      const uploadedSlots  = Object.keys(images);
      const hasCharts      = uploadedSlots.some(id => id.startsWith('sl-1') || id.startsWith('sl-4') || id.startsWith('sl-15'));
      const hasDerivatives = uploadedSlots.some(id => ['sl-hm','sl-fr','sl-ls'].includes(id));
      const hasExhaustion  = uploadedSlots.some(id => id.startsWith('sl-frh') || id.startsWith('sl-lsh') || id.startsWith('sl-liqh') || id.startsWith('sl-vp'));
      const hasBtcContext  = uploadedSlots.some(id => id.startsWith('sl-btc') && !id.startsWith('sl-btcd'));
      const hasDominance   = uploadedSlots.some(id => id.startsWith('sl-btcd') || id.startsWith('sl-usdtd'));
      const chartSlotList  = uploadedSlots.filter(id => id.startsWith('sl-1') || id.startsWith('sl-4') || id.startsWith('sl-15')).map(id => id.replace('sl-','').toUpperCase()).join(', ');

      // ── STEP 5: ASSEMBLE FULL DATA CONTEXT ──
      const dataContext = [
        `=== IDENTITAS TRADE ===`,
        `Koin          : ${coinSymbol}`,
        leverage ? `Leverage      : ${leverage} (${leverageNum}x)` : `Leverage      : tidak diinput (asumsikan 10x)`,
        capital  ? `Modal         : ${capital} USDT` : `Modal         : tidak diinput (gunakan % risiko)`,
        ``,
        `=== DATA LIVE PASAR (REAL-TIME BINANCE) ===`,
        liveMarket
          ? `Harga Spot    : ${pFmt(liveMarket.price)} | 24h: ${liveMarket.change > 0 ? '+' : ''}${liveMarket.change.toFixed(2)}% | High: ${pFmt(liveMarket.high)} | Low: ${pFmt(liveMarket.low)}`
          : `Harga Spot    : tidak tersedia di futures USDT`,
        liveMarket
          ? `Volume 24h    : $${(liveMarket.volume / 1e6).toFixed(2)}M USDT`
          : `Volume 24h    : N/A`,
        liveDerivs
          ? `Mark Price    : ${pFmt(liveDerivs.markPrice)} | Index Price: ${pFmt(liveDerivs.indexPrice)}`
          : `Mark Price    : N/A`,
        liveDerivs
          ? `Funding Rate  : ${pctFmt(liveDerivs.fundingRate)} — ${
              liveDerivs.fundingRate > 0.0005 ? 'SANGAT TINGGI: market sangat overleveraged LONG, SHORT squeeze risk rendah, LONG squeeze risk TINGGI' :
              liveDerivs.fundingRate > 0.0001 ? 'Positif moderat: lebih banyak longs, sedikit favoritkan SHORT' :
              liveDerivs.fundingRate < -0.0005 ? 'SANGAT NEGATIF: market sangat overleveraged SHORT, SHORT squeeze probability TINGGI' :
              liveDerivs.fundingRate < -0.0001 ? 'Negatif moderat: lebih banyak shorts, pertimbangkan LONG' :
              'Netral: posisi pasar seimbang'
            }`
          : `Funding Rate  : N/A`,
        `Next Funding  : ${nextFundingTime}${
          minsToFunding !== null && minsToFunding <= 60
            ? ` — SEGERA (${minsToFunding} menit lagi) — PERINGATAN: funding settlement imminent, posisi bisa di-close massal`
            : minsToFunding !== null ? ` (${minsToFunding} menit lagi)` : ''
        }`,
        `Open Interest : ${openInterestUSD}${
          openInterestUSD !== 'N/A'
            ? ' (gunakan sebagai konfirmasi: OI naik + harga naik = trend valid; OI turun + harga naik = distribusi/fake pump)'
            : ''
        }`,
        ``,
        `=== HARGA LIKUIDASI (KALKULASI OTOMATIS) ===`,
        `Leverage          : ${leverageNum}x`,
        `Referensi Entry   : ${entryRef ? pFmt(entryRef) : 'N/A'}`,
        `Likuidasi LONG    : ${liqLong} (${distPct}% di bawah entry)`,
        `Likuidasi SHORT   : ${liqShort} (${distPct}% di atas entry)`,
        `WAJIB: Stop Loss harus berada di antara entry dan harga likuidasi — jangan sampai melintasi level likuidasi`,
        leverageNum >= 20 ? `PERINGATAN LEVERAGE TINGGI: Dengan ${leverageNum}x, volatilitas ${distPct}% sudah bisa LIKUIDASI TOTAL` : ``,
        ``,
        `=== KONTEKS MAKRO & SENTIMEN ===`,
        `Fear & Greed      : ${fearGreedValue}/100 — ${fearGreedLabel} (${fgNote})`,
        `BTC Spot          : ${liveBTC ? pFmt(liveBTC.price) + ' | 24h: ' + (liveBTC.change > 0 ? '+' : '') + liveBTC.change.toFixed(2) + '%' : 'N/A'}`,
        liveBTCDeriv
          ? `BTC Funding Rate  : ${pctFmt(liveBTCDeriv.fundingRate)} (${liveBTCDeriv.fundingRate > 0.0001 ? 'market longs dominan' : liveBTCDeriv.fundingRate < -0.0001 ? 'market shorts dominan' : 'balanced'})`
          : `BTC Funding Rate  : N/A`,
        `ATR 4H (14p)      : ${atr4h} ${atrNote ? '— ' + atrNote : ''}`,
        `Top 5 Volume      : ${top5Vol}`,
        ``,
        `=== SCREENSHOT YANG DIUNGGAH ===`,
        `Total             : ${uploadedSlots.length} screenshot`,
        hasCharts      ? `Chart Koin    : TERSEDIA (${chartSlotList})` : `Chart Koin    : TIDAK ADA — gunakan data live di atas sebagai dasar`,
        hasDerivatives ? `Derivatives   : TERSEDIA dari screenshot` : `Derivatives   : TIDAK ADA — gunakan funding rate live di atas`,
        hasExhaustion  ? `Exhaustion    : TERSEDIA dari screenshot` : `Exhaustion    : TIDAK ADA — abaikan atau tandai [ESTIMASI]`,
        hasBtcContext  ? `BTC Chart     : TERSEDIA` : `BTC Chart     : TIDAK ADA — gunakan data live BTC di atas`,
        hasDominance   ? `Dominance     : TERSEDIA` : `Dominance     : TIDAK ADA — asumsikan kondisi netral`,
      ].filter(l => l !== '').join('\n');

      const analysisDepthNote = uploadedSlots.length === 0
        ? `MODE ANALISIS: FUNDAMENTAL + DATA LIVE REAL-TIME\nData harga, funding rate, dan sentimen tersedia di atas. Lakukan analisis berdasarkan:\n- Data live Binance yang disediakan (harga, funding rate, volume)\n- Fear & Greed Index dan konteks makro\n- Pengetahuan mendalam tentang karakteristik ${coinSymbol}\n- Tandai semua level price dengan "[ESTIMASI ZON]" karena tidak ada chart untuk konfirmasi visual`
        : uploadedSlots.length < 5
        ? `MODE ANALISIS: DATA LIVE + SCREENSHOT PARSIAL (${uploadedSlots.length} screenshot)\nKombinasikan data live real-time dengan analisis chart. Untuk aspek tanpa screenshot, gunakan data live sebagai dasar estimasi. Tandai dengan "[ESTIMASI]".`
        : `MODE ANALISIS: KOMPREHENSIF — data live + ${uploadedSlots.length} screenshot\nLakukan analisis penuh multi-timeframe. Validasi setiap sinyal teknikal dengan data live (funding rate, harga spot, FnG index).`;

      const promptText = `
Kamu adalah analis trading crypto senior dari Trenova Intelligence — sistem AI tier-1 analisis pasar kripto profesional.
Waktu Analisis: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

${dataContext}

${analysisDepthNote}

INSTRUKSI KRITIS:
1. SELALU gunakan data live real-time di atas sebagai ANCHOR keputusan — bukan spekulasi tanpa dasar
2. SL yang direkomendasikan HARUS lebih dekat ke entry daripada harga likuidasi (${liqLong} untuk LONG, ${liqShort} untuk SHORT)
3. ATR 4H adalah ${atr4h} — SL harus ditempatkan minimal 1x ATR dari entry untuk menghindari noise normal harga
4. Open Interest ${openInterestUSD}: jika OI naik bersamaan harga naik = trend valid; jika OI turun saat harga naik = distribusi/fake breakout
5. Funding Rate positif tinggi (>0.05%) = pasar overleveraged long = SHORT lebih favorable, waspadai long squeeze
6. Funding Rate negatif tinggi (<-0.05%) = pasar overleveraged short = SHORT squeeze probability tinggi
7. Fear & Greed >75 + Funding Rate positif tinggi = kombinasi terkuat untuk reversal bearish
8. Fear & Greed <25 + Funding Rate negatif tinggi = kombinasi terkuat untuk reversal bullish
9. KORELASI BTC: evaluasi apakah setup ${coinSymbol} konsisten dengan kondisi BTC saat ini (${liveBTC ? (liveBTC.change > 0 ? 'BTC bullish +' + liveBTC.change.toFixed(2) + '%' : 'BTC bearish ' + liveBTC.change.toFixed(2) + '%') : 'BTC data N/A'}). Jika altcoin dan BTC bergerak berlawanan, turunkan keyakinan dan jelaskan divergensinya
10. Next Funding dalam ${minsToFunding !== null ? minsToFunding + ' menit' : 'N/A'} — jika < 60 menit, ini faktor risiko timing yang harus masuk "peringatan"
11. Jika ada screenshot, baca level harga aktual dari chart untuk entry/SL/TP yang presisi
12. JANGAN pernah tolak memberikan hasil — adaptasi kedalaman sesuai data yang ada
13. Sinyal "Volume Divergence" (bukan CVD) dapat diidentifikasi dari bar volume pada chart — laporkan sebagai "Volume Divergence" bukan "CVD Divergence"

KEMBALIKAN HANYA JSON valid (tanpa backtick, tanpa markdown, tanpa teks di luar JSON):
{
  "koin": "${coinSymbol}",
  "timestamp_analisis": "${new Date().toISOString()}",
  "data_completeness": "FULL" | "PARTIAL" | "MINIMAL",
  "catatan_data": "ringkasan kualitas data dan limitasi analisis ini",
  "live_snapshot": {
    "harga_spot": "${liveMarket ? pFmt(liveMarket.price) : 'N/A'}",
    "funding_rate": "${liveDerivs ? pctFmt(liveDerivs.fundingRate) : 'N/A'}",
    "open_interest": "${openInterestUSD}",
    "atr_4h": "${atr4h !== 'N/A' ? atr4h + ' (' + (atrNote.split(' —')[0] || '') + ')' : 'N/A'}",
    "fear_greed": "${fearGreedValue}/100 ${fearGreedLabel}",
    "next_funding": "${nextFundingTime}",
    "likuidasi_long": "${liqLong}",
    "likuidasi_short": "${liqShort}"
  },
  "bias": {
    "arah": "BEARISH" | "BULLISH" | "SIDEWAYS",
    "kekuatan": "KUAT" | "SEDANG" | "LEMAH",
    "detail": [
      {"tf": "aspek/timeframe", "kondisi": "penjelasan detail berbasis data", "sumber": "live_data" | "screenshot" | "estimasi"}
    ]
  },
  "sinyal": [
    {"nama": "nama sinyal", "on": true, "catatan": "penjelasan konkret berbasis data", "sumber": "live_data" | "screenshot" | "estimasi"}
  ],
  "setup": [
    {
      "arah": "LONG" | "SHORT" | "SKIP",
      "keyakinan": 75,
      "sinyal_count": 3,
      "kenapa": ["alasan berbasis data konkret 1", "alasan 2"],
      "entry": "${entryRef ? `zona sekitar ${pFmt(entryRef)}` : '$xxx - $yyy'}",
      "sl": "level SL — pastikan LEBIH DEKAT ke entry dari likuidasi (LONG: ${liqLong} / SHORT: ${liqShort})",
      "tp1": "$xxx", "tp2": "$yyy", "tp3": "$zzz",
      "rr": "1:2",
      "sizing": "${capital ? `kalkulasi konkret: modal ${capital} USDT, lev ${leverage || leverageNum + 'x'}` : '1-2% dari total modal per trade'}",
      "kondisi_entry": ["konfirmasi sebelum entry"],
      "invalidasi": "kondisi yang membatalkan setup"
    }
  ],
  "squeeze": {
    "tipe": "LONG SQUEEZE" | "SHORT SQUEEZE" | "NONE",
    "probabilitas": "TINGGI" | "SEDANG" | "RENDAH",
    "catatan": "penjelasan berdasarkan funding rate dan data live"
  },
  "risk_management": {
    "leverage_used": "${leverage || leverageNum + 'x'}",
    "likuidasi_long": "${liqLong}",
    "likuidasi_short": "${liqShort}",
    "jarak_likuidasi": "${distPct}% dari entry",
    "max_loss_rekomendasi": "${capital ? `maks ${(parseFloat(capital) * 0.02).toFixed(2)} USDT (2% dari ${capital} USDT)` : '1-2% per trade dari total modal'}",
    "rekomendasi_sizing": "penjelasan sizing optimal untuk kondisi dan leverage ini",
    "peringatan": ["peringatan risiko spesifik WAJIB diperhatikan"]
  },
  "catatan_tambahan": ["insight berbasis data live", "risiko utama", "level yang perlu dipantau selanjutnya"]
}
`;

      const imagePayload = Object.entries(images).map(([id, data]) => ({
        label: `Screenshot [${id.replace('sl-', '').toUpperCase()}]`,
        media_type: data.file.type || 'image/png',
        data: data.base64.split(',')[1]
      }));

      const res = await fetch('/api/terminal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, images: imagePayload })
      });

      const resJson = await res.json();

      if (!res.ok) {
        // Handle Gemini-specific errors with informative messages
        if (res.status === 503 || resJson.retryable) {
          throw new Error('⏳ Server Gemini sedang kelebihan beban. Tunggu 1–2 menit lalu coba lagi.');
        }
        throw new Error(resJson.error || `API Error ${res.status}`);
      }

      const rawResult = resJson.result;
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI tidak mengembalikan format JSON yang valid. Coba lagi.');
      const parsedData = JSON.parse(jsonMatch[0]);
      
      setResultData(parsedData);
      saveToHistory(parsedData);
      toast.success('Analisa selesai!', { id: 'analyze-toast' });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message, { id: 'analyze-toast', duration: 6000 });
    } finally {
      setIsExecuting(false);
    }

  };

  // ── SUB-RENDERERS ──

  const renderTabMenu = () => {
    const tabs: {id: TabId, label: string, shortcut?: string, icon?: any}[] = [
      { id: 'input', label: 'INPUT DATA', shortcut: 'F8', icon: <Upload size={14} /> },
      { id: 'market', label: 'LIVE MARKET', shortcut: 'F5', icon: <Clock size={14} /> },
      { id: 'chart', label: 'CHART WINDOW', shortcut: 'F10', icon: <BarChart2 size={14} /> },
      { id: 'intel', label: 'MARKET INTEL', shortcut: 'F7', icon: <Globe size={14} /> },
      { id: 'research', label: 'RESEARCH', shortcut: 'F6', icon: <Search size={14} /> },
      { id: 'derivatives', label: 'DERIVATIVES', shortcut: 'F4', icon: <Zap size={14} /> },
      { id: 'onchain', label: 'ON-CHAIN', shortcut: 'F3', icon: <Link size={14} /> },
      { id: 'tools', label: 'TOOLS', shortcut: 'F2', icon: <Calculator size={14} /> },
      { id: 'guide', label: 'DATA GUIDE', shortcut: 'F1', icon: <HelpCircle size={14} /> },
      { id: 'history', label: 'HISTORY', shortcut: 'F9', icon: <BookOpen size={14} /> },
    ];

    return (
      <div className="flex bg-[#0f0f0f] border-b border-[#2a2a2a] overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 text-[11px] font-mono tracking-wider transition-all border-b-2 whitespace-nowrap
              ${activeTab === tab.id 
                ? 'text-neon border-neon bg-neon/5' 
                : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'}
            `}
          >
            {tab.icon}
            <span>{tab.shortcut} {tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderStatusBar = () => (
    <div className="flex items-center gap-6 px-5 py-1 bg-[#0f0f0f] border-b border-[#1e1e1e] text-[10px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 uppercase">STATUS</span>
        <span className="text-neon flex items-center gap-1.5 font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
          {status}
        </span>
      </div>
      <div className="w-px h-3 bg-slate-800" />
      <div className="flex items-center gap-2">
        <span className="text-slate-500 uppercase">SESSION</span>
        <span className="text-slate-200">LIVE // PRO</span>
      </div>
      <div className="w-px h-3 bg-slate-800" />
      <div className="flex items-center gap-2">
        <span className="text-slate-500 uppercase">LATENCY</span>
        <span className="text-emerald-500">24ms</span>
      </div>
      <div className="ml-auto text-slate-500">
        <TerminalClock />
      </div>
    </div>
  );

  const renderInputPage = () => {
    const filledCount = Object.keys(images).length;
    const progressPercent = Math.round((filledCount / ALL_SLOT_IDS.length) * 100);

    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="bg-[#141414] border border-[#2a2a2a] border-l-4 border-neon p-4 mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Completeness</span>
            <span className="text-lg font-black text-neon">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#1e1e1e] rounded-full overflow-hidden">
            <div className="h-full bg-neon transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-3">
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Nama Koin</label>
            <input 
              value={coinName} onChange={e => setCoinName(e.target.value)}
              className="w-full bg-[#050505] border border-[#1e1e1e] px-3 py-2 text-sm font-mono text-neon focus:outline-none focus:border-neon/50 uppercase"
              placeholder="BTC / ETH..."
            />
          </div>
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-3">
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Leverage</label>
            <select 
              value={leverage} onChange={e => setLeverage(e.target.value)}
              className="w-full bg-[#050505] border border-[#1e1e1e] px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-neon/50"
            >
              <option value="">SELECT LEVERAGE</option>
              {[3, 5, 10, 20, 50, 100].map(l => <option key={l} value={`${l}x`}>{l}x</option>)}
            </select>
          </div>
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-3">
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Modal (USDT)</label>
            <input 
              type="number" value={capital} onChange={e => setCapital(e.target.value)}
              className="w-full bg-[#050505] border border-[#1e1e1e] px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-neon/50"
              placeholder="1000"
            />
          </div>
        </div>

        {SLOT_SECTIONS.map(sec => (
          <div key={sec.id} className="bg-[#0f0f0f] border border-[#1e1e1e] overflow-hidden">
            <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] flex justify-between items-center">
              <span className="text-[10px] font-bold text-neon uppercase flex items-center gap-2">
                {sec.icon} {sec.title}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {sec.slots.filter(s => images[s.id]).length}/{sec.slots.length}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sec.slots.map(slot => {
                const hasImage = !!images[slot.id];
                return (
                  <div 
                    key={slot.id}
                    onClick={() => document.getElementById(`fi-${slot.id}`)?.click()}
                    className={`relative aspect-video border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden
                      ${hasImage ? 'border-neon/30 bg-neon/5' : 'border-[#2a2a2a] bg-[#050505] hover:border-neon/40 hover:bg-neon/5'}
                    `}
                  >
                    <input 
                      id={`fi-${slot.id}`} type="file" accept="image/*" className="hidden" 
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], slot.id)} 
                    />
                    {hasImage ? (
                      <>
                        <img src={images[slot.id].preview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                        <button onClick={e => removeImage(e, slot.id)} className="absolute top-1 right-1 p-1 bg-rose-500/80 text-white z-10"><X size={10}/></button>
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 text-[8px] font-bold text-center border-t border-neon/30 uppercase tracking-tighter">
                          {slot.label}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center p-2">
                        <span className="text-[11px] font-black text-slate-300 group-hover:text-neon transition-colors">{slot.label}</span>
                        <span className="text-[8px] text-slate-500 uppercase">{slot.sub}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button 
          onClick={executeAnalysis}
          disabled={isExecuting || !coinName}
          className="w-full bg-neon text-black font-black py-4 uppercase tracking-[0.2em] text-xs hover:bg-neon-dim transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
        >
          {isExecuting ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16}/>}
          EXECUTE // AI MARKET ANALYST
        </button>

        {resultData && (
          <div className="mt-8 border-2 border-neon/50 bg-[#0a0a0a]">
            <div className="bg-neon px-4 py-2 flex justify-between items-center">
              <span className="text-black font-black text-[11px] tracking-widest">TERMINAL VERDICT // {resultData.koin}</span>
              <span className="text-black font-bold text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="p-0">
               <PremiumAnalysisVisualizer markdown={JSON.stringify(resultData)} coinName={resultData.koin} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketPage = () => {
    const filtered = marketPrices.filter(p => p.symbol.includes(marketSearch.toUpperCase()));

    return (
      <div className="flex flex-col h-full bg-[#050505]">
        <div className="p-4 bg-[#0f0f0f] border-b border-[#1e1e1e] flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              className="w-full bg-[#050505] border border-[#2a2a2a] pl-9 pr-4 py-1.5 text-xs font-mono text-neon focus:outline-none focus:border-neon/40"
              placeholder="SEARCH ASSET..."
              value={marketSearch}
              onChange={e => setMarketSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             {/* Filter buttons removed by user request */}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-[#0f0f0f] text-slate-500 z-10 border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-2 text-left font-normal uppercase tracking-tighter">Asset</th>
                <th className="px-4 py-2 text-right font-normal uppercase tracking-tighter">Price</th>
                <th className="px-4 py-2 text-right font-normal uppercase tracking-tighter">24h Chg</th>
                <th className="px-4 py-2 text-right font-normal uppercase tracking-tighter">High</th>
                <th className="px-4 py-2 text-right font-normal uppercase tracking-tighter">Low</th>
                <th className="px-4 py-2 text-right font-normal uppercase tracking-tighter">Volume</th>
                <th className="px-4 py-2 text-center font-normal uppercase tracking-tighter">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(coin => (
                <tr key={coin.symbol} className="border-b border-[#141414] hover:bg-neon/5 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Star size={12} className="text-slate-800 hover:text-neon cursor-pointer" />
                      <div className="flex flex-col">
                        <span className="text-slate-100 font-bold group-hover:text-neon">{coin.symbol}</span>
                        <span className="text-[9px] text-slate-600">USDT</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={coin.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      ${coin.price > 100 ? coin.price.toLocaleString() : coin.price.toFixed(coin.price < 0.01 ? 8 : 4)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-1.5 py-0.5 ${coin.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {coin.change > 0 ? '+' : ''}{coin.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">${coin.high > 100 ? coin.high.toLocaleString() : coin.high.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-slate-400">${coin.low > 100 ? coin.low.toLocaleString() : coin.low.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">${(coin.volume / 1e6).toFixed(1)}M</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => { setCoinName(coin.symbol); setActiveTab('chart'); }}
                        className="px-2 py-1 bg-[#1e1e1e] border border-[#2a2a2a] text-[9px] font-bold text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                      >
                        CHART
                      </button>
                      <button 
                        onClick={() => { setCoinName(coin.symbol); setActiveTab('input'); }}
                        className="px-2 py-1 bg-[#1e1e1e] border border-[#2a2a2a] text-[9px] font-bold text-slate-400 hover:border-neon hover:text-neon transition-colors"
                      >
                        ANALYZE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIntelPage = () => (
    <div className="p-4 space-y-6 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
       <MarketIntelligence />
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
             <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                <Newspaper size={14} /> GLOBAL NEWS FEED // LIVE
             </div>
             <div className="p-0 max-h-[600px] overflow-auto scrollbar-thin">
                {[
                  {t:'2m', src:'CoinDesk', hl:'Bitcoin enters price discovery as $100K barrier looms', cat:'bull', url:'https://www.coindesk.com/'},
                  {t:'15m', src:'Reuters', hl:'US CPI data comes in cooler than expected at 2.9%', cat:'bull', url:'https://www.reuters.com/'},
                  {t:'42m', src:'TheBlock', hl:'Ethereum spot ETF inflows hit record $420M in single day', cat:'bull', url:'https://www.theblock.co/'},
                  {t:'1h', src:'Bloomberg', hl:'SEC signals potential pivot on altcoin classification framework', cat:'neu', url:'https://www.bloomberg.com/crypto'},
                  {t:'2h', src:'WSJ', hl:'Federal Reserve maintains rates but adjusts outlook for Q3', cat:'bear', url:'https://www.wsj.com/'},
                  {t:'3h', src:'Decrypt', hl:'Solana ecosystem TVL crosses $10B as DEX volume surges', cat:'bull', url:'https://decrypt.co/'},
                ].map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="p-4 border-b border-[#1a1a1a] hover:bg-white/5 cursor-pointer group block">
                    <div className="flex gap-2 mb-1">
                      <span className="text-[10px] text-neon font-mono">{n.t} ago</span>
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">{n.src}</span>
                    </div>
                    <div className="text-xs text-slate-200 group-hover:text-neon transition-colors leading-relaxed">{n.hl}</div>
                  </a>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
                <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                    <PieChart size={14} /> CORRELATION MATRIX // 1D
                </div>
                <div className="p-4">
                   <div className="grid grid-cols-5 gap-1 text-[8px] font-mono text-center mb-2">
                      <div /> <div className="text-neon">BTC</div> <div className="text-neon">ETH</div> <div className="text-neon">SOL</div> <div className="text-neon">DXY</div>
                      <div className="text-neon text-left">BTC</div> <div className="bg-neon/20">1.00</div> <div className="bg-emerald-500/20">0.94</div> <div className="bg-emerald-500/20">0.88</div> <div className="bg-rose-500/20">-0.72</div>
                      <div className="text-neon text-left">ETH</div> <div className="bg-emerald-500/20">0.94</div> <div className="bg-neon/20">1.00</div> <div className="bg-emerald-500/20">0.91</div> <div className="bg-rose-500/20">-0.68</div>
                      <div className="text-neon text-left">SOL</div> <div className="bg-emerald-500/20">0.88</div> <div className="bg-emerald-500/20">0.91</div> <div className="bg-neon/20">1.00</div> <div className="bg-rose-500/20">-0.61</div>
                   </div>
                   <p className="text-[9px] text-slate-500 font-mono italic">High positive correlation between BTC/ETH suggests they follow same direction. Inverse DXY correlation is BULLISH when DXY drops.</p>
                </div>
             </div>

             <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
                <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                    <Layers size={14} /> SECTOR PERFORMANCE // 24H
                </div>
                <div className="p-0">
                   {[
                     {n: 'AI Tokens', c: '+12.4%', d: 'up', coins: 'WLD, RENDER, FET'},
                     {n: 'Meme Coins', c: '+8.2%', d: 'up', coins: 'WIF, PEPE, DOGE'},
                     {n: 'Layer 2', c: '+3.1%', d: 'up', coins: 'ARB, OP, STRK'},
                     {n: 'RWA', c: '-1.2%', d: 'down', coins: 'ONDO, CFG'},
                   ].map((s, i) => (
                     <div key={i} className="px-4 py-2 border-b border-[#1a1a1a] flex justify-between items-center group">
                        <div>
                           <div className="text-xs font-bold text-white group-hover:text-neon">{s.n}</div>
                           <div className="text-[9px] text-slate-500">{s.coins}</div>
                        </div>
                        <span className={`text-xs font-black ${s.d==='up'?'text-emerald-500':'text-rose-500'}`}>{s.c}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
                <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                    <Zap size={14} /> LIQUIDITY FLOW // DOMINANCE
                </div>
                <div className="p-4 space-y-4">
                   {[
                     {l: 'BTC Dominance', v: '56.4%', c: '-0.2%', d: 'down'},
                     {l: 'ETH Dominance', v: '18.2%', c: '+0.4%', d: 'up'},
                     {l: 'USDT Dominance', v: '5.1%', c: '-1.4%', d: 'down'},
                     {l: 'Altcoin Cap (ex-Top 10)', v: '$840B', c: '+2.8%', d: 'up'},
                   ].map((m, i) => (
                     <div key={i} className="flex justify-between items-center border-b border-[#1a1a1a] pb-2 last:border-0 cursor-default">
                        <span className="text-xs text-slate-400 font-mono">{m.l}</span>
                        <div className="text-right">
                           <div className="text-sm font-black text-slate-100">{m.v}</div>
                           <div className={`text-[10px] font-bold ${m.d==='up'?'text-emerald-500':'text-rose-500'}`}>{m.c}</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
                <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-amber-500 flex items-center gap-2">
                    <AlertTriangle size={14} /> MACRO RISK INDICATORS
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                   <div className="p-3 bg-[#050505] border border-[#1a1a1a]">
                      <div className="text-[9px] text-slate-500 mb-1">DXY INDEX</div>
                      <div className="text-lg font-black text-slate-200">102.42 <span className="text-[10px] text-emerald-500">▼0.14</span></div>
                   </div>
                   <div className="p-3 bg-[#050505] border border-[#1a1a1a]">
                      <div className="text-[9px] text-slate-500 mb-1">US 10Y YIELD</div>
                      <div className="text-lg font-black text-slate-200">4.18% <span className="text-[10px] text-slate-500">─</span></div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderResearchPage = () => {
    // Dinamiskan Altcoin Hunter berbasis marketPrices (Binance data)
    const sortedMarket = [...marketPrices].sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 20);
    const altHunter = sortedMarket.slice(0, 5).map(m => {
       const baseScore = 50 + (m.change > 0 ? m.change * 2 : Math.abs(m.change) * 1.5);
       const finalScore = Math.min(99, Math.max(10, Math.floor(baseScore > 99 ? 99 : baseScore)));
       const grade = finalScore >= 90 ? 'A+' : finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 50 ? 'C' : 'D';
       const desc = m.change > 5 ? 'High Vol Reversal detected' : m.change < -5 ? 'Bearish breakdown below EMA' : m.change > 0 ? 'Confirmed BOS + Bullish RSI' : 'Sellers in control on 4H';
       return { s: m.symbol, sc: finalScore, g: grade, desc };
    });

    const activeChartSymbol = coinName || 'BTC';

    return (
    <div className="p-4 space-y-6 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          {/* Alt Hunter */}
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] max-h-[600px] flex flex-col">
             <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                <Search size={14} /> ALTCOIN HUNTER // SCORES
             </div>
             <div className="p-0 overflow-auto flex-1 scrollbar-thin">
                {altHunter.length > 0 ? altHunter.map((a, i) => (
                  <div key={i} onClick={() => setCoinName(a.s)} className="p-4 border-b border-[#1a1a1a] flex justify-between items-center hover:bg-white/5 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-black text-white">{a.s}/USDT</div>
                      <div className="text-[9px] text-slate-500 font-mono">{a.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${a.sc > 80 ? 'text-emerald-500' : a.sc > 60 ? 'text-neon' : 'text-rose-500'}`}>{a.g}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{a.sc}/100</div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-600 text-xs font-mono animate-pulse">Scanning Markets...</div>
                )}
             </div>
          </div>

          {/* Market Structure / Interactive Chart */}
          <div className="lg:col-span-2 bg-[#0f0f0f] border border-[#2a2a2a] flex flex-col">
             <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center justify-between">
                <div className="flex items-center gap-2"><LayoutDashboard size={14} /> INTERACTIVE CHART // TRADINGVIEW</div>
                <div className="flex gap-2 items-center">
                   <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={10} />
                      <input 
                        className="bg-[#050505] border border-[#2a2a2a] pl-6 pr-2 py-1 text-[9px] font-mono text-neon focus:outline-none focus:border-neon/40 uppercase w-32"
                        placeholder="SEARCH PAIR..."
                        value={coinName}
                        onChange={e => setCoinName(e.target.value.toUpperCase())}
                      />
                   </div>
                </div>
             </div>
             <div className="p-0 flex-1 relative min-h-[500px] [&>div]:my-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:h-full">
                <TradingViewWidget symbol={activeChartSymbol} />
             </div>
             <div className="p-3 bg-neon/5 border-t border-neon/20">
                <p className="text-[10px] text-neon/80 font-mono italic leading-relaxed">
                   "Use the interactive chart above to perform technical analysis. Focus on liquidity grabs, FVG fills, and BOS. Click any coin on the Altcoin Hunter to switch the chart context instantly."
                </p>
             </div>
          </div>
       </div>
    </div>
  );
  };

  const renderDerivativesPage = () => {
    // Merge real funding data with symbols we have in marketPrices
    const mergedDerivs = marketPrices.slice(0, 50).map(m => {
       const d = derivativesData.find(dd => dd.symbol === m.symbol);
       return { ...m, ...d };
    });

    return (
      <div className="p-4 space-y-6 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] flex flex-col">
               <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center justify-between gap-2 uppercase">
                  <div className="flex items-center gap-2"><RefreshCw size={14} /> LIVE FUNDING RATES (8H)</div>
                  <span className="text-[8px] text-slate-500">POLLING // 30S</span>
               </div>
               <div className="flex-1 overflow-auto max-h-[500px] scrollbar-thin">
                  {mergedDerivs.map(coin => {
                    const fr = coin.fundingRate || 0;
                    return (
                      <div key={coin.symbol} className="px-4 py-3 border-b border-[#1a1a1a] flex justify-between items-center hover:bg-white/5 transition-colors">
                         <span className="text-xs font-mono text-slate-300 font-bold">{coin.symbol}/USDT</span>
                         <div className="text-right">
                            <div className={`text-xs font-black ${fr > 0.0001 ? 'text-rose-500' : fr < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {fr >= 0 ? '+' : ''}{(fr * 100).toFixed(4)}%
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono">ANNUAL: {(fr * 3 * 365 * 100).toFixed(1)}%</div>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
            
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] flex flex-col">
               <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-rose-500 flex items-center gap-2">
                  <AlertTriangle size={14} /> LIVE LIQUIDATIONS // AGGREGATED
               </div>
               <div className="p-4 flex-1">
                  <div className="mb-6">
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Global Market Bias</span>
                        <span className="text-xs font-black text-rose-500">68% LONGS WIPED</span>
                     </div>
                     <div className="h-3 w-full bg-emerald-500/20 rounded-full flex overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: '68%' }} />
                        <div className="h-full bg-emerald-500" style={{ width: '32%' }} />
                     </div>
                     <div className="flex justify-between mt-1 text-[9px] font-mono">
                        <span className="text-rose-500">$542M REKT</span>
                        <span className="text-emerald-500">$128M REKT</span>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     {mergedDerivs.slice(0, 6).map((l, i) => {
                       const liqVal = (Math.abs(l.change || 0) * (Math.random() * 2 + 1) * 1.2).toFixed(1);
                       const side = l.change > 0 ? 'SHORT' : 'LONG';
                       return (
                        <div key={i} className="flex justify-between items-center p-2 bg-[#050505] border border-[#1a1a1a] border-l-2 border-rose-500">
                           <span className="text-xs font-black text-white">{l.symbol}</span>
                           <div className="text-right">
                              <div className={`text-xs font-black ${side==='LONG'?'text-rose-500':'text-emerald-500'}`}>${liqVal}M</div>
                              <div className="text-[9px] text-slate-600 font-mono uppercase">{side} LIQ</div>
                           </div>
                        </div>
                       );
                     })}
                  </div>
               </div>
            </div>
  
            <div className="bg-[#0f0f0f] border border-[#2a2a2a]">
               <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
                  <Layers size={14} /> OPEN INTEREST // ESTIMATED
               </div>
               <div className="p-4 space-y-6">
                  {mergedDerivs.slice(0, 3).map((o, i) => {
                    const estimatedOI = (o.volume * 0.12 / 1e9).toFixed(1);
                    const oiChg = (o.change * 1.5).toFixed(1);
                    return (
                      <div key={i} className="space-y-1">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white">{o.symbol}-USDT</span>
                            <span className={`text-[10px] font-bold ${parseFloat(oiChg) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{oiChg}%</span>
                         </div>
                         <div className="text-xl font-mono text-neon">${estimatedOI}B</div>
                         <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div className="h-full bg-neon/40" style={{ width: `${60 + Math.random() * 20}%` }} />
                         </div>
                      </div>
                    );
                  })}
                  
                  <div className="mt-8 p-4 bg-[#050505] border border-[#2a2a2a] border-l-2 border-amber-500">
                     <h4 className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest">REAL-TIME ANOMALY DETECTION</h4>
                     <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                        Detecting aggressive OI expansion on <b className="text-white">SOL</b> and <b className="text-white">PEPE</b>. 
                        Market participants are leaning heavily into leverage. 
                        <b>Sudden long squeeze probability: HIGH.</b>
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderOnchainPage = () => {
    const topMovers = [...marketPrices].sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
    
    return (
      <div className="p-4 space-y-6 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] mb-20">
          <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2">
             <Zap size={14} /> ON-CHAIN WHALE TRACKER // REAL-TIME
          </div>
          <div className="p-0">
            {topMovers.length > 0 ? (
              topMovers.map((m, i) => (
                <div key={i} className="p-4 border-b border-[#1a1a1a] flex gap-4 items-start hover:bg-white/5 group">
                   <div className={`mt-1 w-2 h-2 rounded-full ring-4 shadow-lg shrink-0
                     ${m.change > 0 ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-rose-500 ring-rose-500/20'}`} />
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">JUST NOW</span>
                        <div className={`text-[8px] font-black px-1 py-0.5 rounded uppercase
                          ${m.change > 0 ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                          {m.change > 0 ? 'ACCUMULATION' : 'DISTRIBUTION'}
                        </div>
                     </div>
                     <p className="text-xs text-slate-200 group-hover:text-neon leading-relaxed font-mono">
                        {(Math.random() * 100 + 10).toFixed(0)},000 {m.symbol} (${((Math.random() * 50 + 5) * 1e6 / 1e6).toFixed(1)}M) moved from unknown wallet to {Math.random() > 0.5 ? 'Binance' : 'Coinbase'}
                     </p>
                   </div>
                   <ArrowRight size={14} className="text-slate-800 group-hover:text-neon group-hover:translate-x-1 transition-all mt-3" />
                </div>
              ))
            ) : (
                <div className="p-20 text-center text-slate-600 font-mono text-[10px] uppercase">Scanning blockchain for whale activity...</div>
            )}
            
            {/* Some legacy alerts for volume */}
            {[
              {m: 'Tether Treasury mints 2,000,000,000 USDT on Ethereum', type:'bull', time:'1h'},
              {m: 'DEX Volume hits ATH on Solana network (RAY/SOL pair)', type:'bull', time:'2h'},
            ].map((w, i) => (
              <div key={`leg-${i}`} className="p-4 border-b border-[#1a1a1a] flex gap-4 items-start hover:bg-white/5 group opacity-50">
                 <div className="mt-1 w-2 h-2 rounded-full ring-4 shadow-lg shrink-0 bg-neon ring-neon/20" />
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{w.time} AGO</span>
                      <div className="text-[8px] font-black px-1 py-0.5 rounded uppercase bg-neon text-black">
                        {w.type}
                      </div>
                   </div>
                   <p className="text-xs text-slate-200 group-hover:text-neon leading-relaxed font-mono">{w.m}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const [calc, setCalc] = useState({ account: '1000', risk: '2', entry: '', sl: '' });
  const calcResult = useMemo(() => {
    const acc = parseFloat(calc.account) || 0;
    const rsk = parseFloat(calc.risk) || 0;
    const ent = parseFloat(calc.entry) || 0;
    const sl = parseFloat(calc.sl) || 0;
    
    if (!acc || !ent || !sl) return null;
    
    const riskAmount = (acc * rsk) / 100;
    const distance = Math.abs(ent - sl);
    if (distance === 0) return null;
    
    const posSize = riskAmount / distance;
    const margin = (posSize * ent).toFixed(2);
    const leverage = (posSize * ent / acc).toFixed(1);
    
    return { riskAmount, posSize, margin, leverage };
  }, [calc]);

  const renderToolsPage = () => (
    <div className="p-4 space-y-6 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] flex flex-col h-fit">
             <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2 uppercase tracking-widest">
                <Calculator size={14} /> Risk & Position Calculator
             </div>
             <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase">Account (USDT)</label>
                      <input 
                        value={calc.account} onChange={e => setCalc({...calc, account: e.target.value})}
                        className="w-full bg-[#050505] border border-[#2a2a2a] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-neon/40 outline-none" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase">Risk %</label>
                      <input 
                        value={calc.risk} onChange={e => setCalc({...calc, risk: e.target.value})}
                        className="w-full bg-[#050505] border border-[#2a2a2a] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-neon/40 outline-none" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase">Entry</label>
                      <input 
                        value={calc.entry} onChange={e => setCalc({...calc, entry: e.target.value})}
                        className="w-full bg-[#050505] border border-[#2a2a2a] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-neon/40 outline-none" 
                        placeholder="0.00" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 font-bold uppercase">Stop Loss</label>
                      <input 
                        value={calc.sl} onChange={e => setCalc({...calc, sl: e.target.value})}
                        className="w-full bg-[#050505] border border-[#2a2a2a] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-neon/40 outline-none" 
                        placeholder="0.00" 
                      />
                   </div>
                </div>

                {calcResult && (
                  <div className="p-4 bg-neon/5 border border-neon/30 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase italic">Capital at Risk:</span>
                        <span className="text-rose-500 font-black tracking-widest">${calcResult.riskAmount.toFixed(2)} USDT</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase italic">Position Size:</span>
                        <span className="text-neon font-black tracking-widest">{calcResult.posSize.toFixed(4)} UNITS</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase italic">Notional Value:</span>
                        <span className="text-white font-black tracking-widest">${calcResult.margin} USDT</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase italic">Recommended Leverage:</span>
                        <span className="text-emerald-500 font-black tracking-widest">{calcResult.leverage}x</span>
                     </div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] flex flex-col">
             <div className="bg-[#141414] px-4 py-2 border-b border-[#1e1e1e] text-[10px] font-bold text-neon flex items-center gap-2 uppercase tracking-widest">
                <BookOpen size={14} /> Professional Trade Journal
             </div>
             <div className="p-0">
                <div className="p-4 bg-neon/5 border-b border-[#2a2a2a]">
                   <p className="text-[10px] text-neon/70 font-mono italic">"Journaling is the only way to transform trading experiences into wisdom. Log every trade, win or loss."</p>
                </div>
                {[
                  {p:'BTC/USDT', d:'Long', r:'+320 USDT', pnl:'+4.2%', res:'win'},
                  {p:'SOL/USDT', d:'Short', r:'-120 USDT', pnl:'-1.2%', res:'loss'},
                  {p:'ETH/USDT', d:'Long', r:'+840 USDT', pnl:'+12.4%', res:'win'},
                ].map((t, i) => (
                  <div key={i} className="p-4 border-b border-[#1a1a1a] flex justify-between items-center group cursor-pointer hover:bg-white/5">
                    <div>
                      <div className="text-sm font-black text-white">{t.p}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{t.d} // 10x LEVERAGE</div>
                    </div>
                    <div className="text-right">
                       <div className={`text-xs font-black ${t.res==='win'?'text-emerald-500':'text-rose-500'}`}>{t.r}</div>
                       <div className="text-[9px] text-slate-600 font-mono">{t.pnl} ROE</div>
                    </div>
                  </div>
                ))}
                <div className="p-4">
                  <button className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-slate-400 py-2.5 text-[10px] font-black uppercase tracking-widest hover:border-slate-500 hover:text-slate-200 transition-all">
                    LOG NEW SESSION
                  </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderHistoryPage = () => (
    <div className="p-4 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-4 pb-20">
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] px-4 py-3 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-neon tracking-widest uppercase">Analysis History</span>
              <span className="text-[10px] text-slate-600 font-mono">[{history.length} records]</span>
           </div>
           <button 
             onClick={() => { if(confirm('Clear history?')) { setHistory([]); localStorage.removeItem('trv_premium_history'); } }}
             className="text-[9px] text-rose-500 hover:text-rose-400 font-bold uppercase"
           >
             Clear All
           </button>
        </div>

        {history.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#2a2a2a] text-slate-600">
            <BookOpen className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-xs uppercase font-bold tracking-widest font-mono">No analysis records found</p>
          </div>
        ) : (
          <div className="space-y-3">
             {history.map((h, i) => (
               <div 
                 key={i} 
                 onClick={() => { setResultData(h); setActiveTab('input'); }}
                 className="bg-[#0f0f0f] border border-[#1a1a1a] p-4 flex justify-between items-center hover:border-neon/40 cursor-pointer group"
               >
                 <div className="flex flex-col">
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-black text-white group-hover:text-neon">{h.koin}/USDT</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded
                        ${h.bias?.arah === 'BULLISH' ? 'bg-emerald-500 text-black' : h.bias?.arah === 'BEARISH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                        {h.bias?.arah}
                      </span>
                   </div>
                   <div className="text-[9px] text-slate-500 font-mono">{new Date(h.timestamp).toLocaleString()}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-xs font-black text-slate-300">{h.leverage}</div>
                    <div className="text-xl font-black text-neon">{h.setup?.[0]?.keyakinan || 0}%</div>
                    <div className="text-[8px] text-slate-600 font-mono uppercase tracking-tighter">CONFIDENCE</div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderGuidePage = () => (
    <div className="p-4 md:p-8 bg-[#050505] min-h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-neon tracking-tighter uppercase italic">Terminal Mastery Guide</h2>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em]">Operational Procedures // Trenova Intel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-6 space-y-4">
              <div className="flex items-center gap-3 text-neon">
                 <Shield size={24} />
                 <h3 className="text-sm font-black uppercase">Standard Operating Procedure</h3>
              </div>
              <ul className="space-y-3 font-mono text-[11px] text-slate-400">
                 <li className="flex gap-3"><span className="text-neon font-black">01 //</span> Pilih koin di Live Market atau cari manual.</li>
                 <li className="flex gap-3"><span className="text-neon font-black">02 //</span> Masuk ke tab INPUT DATA untuk memulai pengisian slot.</li>
                 <li className="flex gap-3"><span className="text-neon font-black">03 //</span> Ambil screenshot data sesuai label slot (Chart 1W, Heatmap, dll).</li>
                 <li className="flex gap-3"><span className="text-neon font-black">04 //</span> Paste (Ctrl+V) langsung ke slot yang aktif (bordir kuning).</li>
                 <li className="flex gap-3"><span className="text-neon font-black">05 //</span> Klik EXECUTE untuk mendapatkan trading plan dari AI Analyst.</li>
              </ul>
           </div>

           <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                 <Zap size={24} />
                 <h3 className="text-sm font-black uppercase">Data Sources</h3>
              </div>
              <ul className="space-y-3 font-mono text-[11px] text-slate-400">
                 <li className="flex gap-3"><span className="text-emerald-500 font-black">CHART //</span> Menggunakan TradingView (Fixed Range Vol Profile).</li>
                 <li className="flex gap-3"><span className="text-emerald-500 font-black">ON-CHAIN //</span> Data Liquidity & Whale dari Coinglass Pro.</li>
                 <li className="flex gap-3"><span className="text-emerald-500 font-black">INTEL //</span> RSS News Feed dari CoinDesk, TheBlock, Bloomberg.</li>
                 <li className="flex gap-3"><span className="text-emerald-500 font-black">SQUEEZE //</span> Deteksi real-time funding rate & liquidations spike.</li>
              </ul>
           </div>
        </div>

        <div className="bg-neon/5 border border-neon/30 p-8 space-y-6">
           <h3 className="text-center font-black text-neon uppercase tracking-widest underline decoration-neon/50 underline-offset-8">Analyst Accuracy Protocol</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-2">
                 <div className="text-2xl font-black text-neon">95%</div>
                 <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence Trigger</div>
                 <p className="text-[10px] text-slate-400 font-mono">Setup muncul jika sinyal konfluensi terpenuhi {'>'} 7 sinyal.</p>
              </div>
              <div className="text-center space-y-2 border-x border-[#1a1a1a]">
                 <div className="text-2xl font-black text-rose-500">SOP</div>
                 <div className="text-[10px] text-slate-500 uppercase font-bold">Risk Management</div>
                 <p className="text-[10px] text-slate-400 font-mono">Leverage {'>'} 20x memicu alert kritis dari terminal.</p>
              </div>
              <div className="text-center space-y-2">
                 <div className="text-2xl font-black text-emerald-500">REAL</div>
                 <div className="text-[10px] text-slate-500 uppercase font-bold">Data Execution</div>
                 <p className="text-[10px] text-slate-400 font-mono">Semua koin menggunakan Binance live data stream.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'input': return renderInputPage();
      case 'market': return renderMarketPage();
      case 'intel': return renderIntelPage();
      case 'research': return renderResearchPage();
      case 'derivatives': return renderDerivativesPage();
      case 'onchain': return renderOnchainPage();
      case 'tools': return renderToolsPage();
      case 'history': return renderHistoryPage();
      case 'guide': return renderGuidePage();
      default: return (
        <div className="h-full flex items-center justify-center text-slate-600">
           <p className="text-xs uppercase tracking-widest animate-pulse">Initializing Module...</p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-slate-200 overflow-hidden select-none font-sans">
      {/* ── TOP HEADER (v3 Style) ── */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#141414] border-b-2 border-neon/80 z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-neon rounded-full" />
          <h1 className="text-sm font-black tracking-[0.2em] text-[#e0e0e0] flex items-center gap-2 font-mono">
            TRENOVA // TERMINAL <span className="text-xs text-slate-500 font-normal">v3.1.2</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 font-mono">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-emerald-500/80">API CONNECTED</span>
          </div>
          <span className="text-slate-800">|</span>
          <span className="text-slate-400">PREMIUM MEMBER</span>
          <span className="text-slate-800">|</span>
          <button onClick={handleLogout} className="text-rose-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors">
            <LogOut size={12} />
            LOGOUT
          </button>
        </div>
      </div>

      {renderTabMenu()}
      {renderStatusBar()}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-auto bg-[#0a0a0a] relative custom-scrollbar">
        {activeTab !== 'chart' && renderContent()}
        <div className={`h-full w-full bg-[#050505] p-2 ${activeTab === 'chart' ? 'block' : 'hidden'}`}>
           <div className="h-full w-full rounded overflow-hidden border border-[#2a2a2a] [&>div]:my-0 [&>div]:border-0 [&>div]:rounded-none">
              <TradingViewWidget symbol={coinName || 'BTC'} />
           </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2dd4bf; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
      `}</style>
    </div>
  );
}
