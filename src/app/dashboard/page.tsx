'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Database, Sparkles, TrendingUp, BarChart3, Upload, X, MousePointerClick, Loader2, Search, FileText, AppWindow, Radio, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { checkUsageLimit, incrementUsage, saveAnalysis, getUserUsage, searchTVSymbols } from './actions';
import CoinSelector, { Coin } from '@/components/CoinSelector';
import CoinGeckoChart from '@/components/CoinGeckoChart';
import TradingViewWidget from '@/components/TradingViewWidget';
import SentimentChart from '@/components/SentimentChart';
import MarketIntelligence from '@/components/MarketIntelligence';
import AnalysisVisualizer from '@/components/AnalysisVisualizer';
import LiveMarketTable from '@/components/LiveMarketTable';
import CryptoNews from '@/components/CryptoNews';
import { useLanguage } from '@/context/LanguageContext';



function buildEnrichedPrompt(
  coin: Coin,
  market: any,
  hasImage: boolean,
  lang: 'id' | 'en',
  tradingStyle: string,
  timeframe: string,
  userPrompt: string
): string {
  const sym = coin.symbol.toUpperCase();
  const isId = lang === 'id';
  const dp = market.price > 100 ? 2 : 6;
  const pFmt = (n: number) => n > 100 ? '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '$' + n.toFixed(dp);
  const pctFmt = (n: number) => `${(n * 100).toFixed(4)}%`;

  // Build OHLC context from recent candles
  let ohlcCtx = isId ? 'Data OHLC tidak tersedia.' : 'OHLC data unavailable.';
  if (market.recentCandles && market.recentCandles.length > 0) {
    const candles = market.recentCandles;
    ohlcCtx = candles.map((c: any, i: number) =>
      `Candle ${i + 1}: O:${pFmt(c.open)} H:${pFmt(c.high)} L:${pFmt(c.low)} C:${pFmt(c.close)}`
    ).join('\n');
  }

  // Funding rate interpretation
  let fundingNote = 'N/A';
  if (market.fundingRate !== null) {
    const fr = market.fundingRate;
    fundingNote = fr > 0.0005 ? 'SANGAT TINGGI: market overleveraged LONG, hati-hati long squeeze' :
                  fr > 0.0001 ? 'Positif moderat: lebih banyak longs' :
                  fr < -0.0005 ? 'SANGAT NEGATIF: market overleveraged SHORT, potensi short squeeze TINGGI' :
                  fr < -0.0001 ? 'Negatif moderat: lebih banyak shorts' : 'Netral: posisi seimbang';
  }

  // Fear & Greed interpretation
  const fgNum = parseInt(market.fearGreedValue) || 50;
  const fgNote = fgNum <= 25 ? 'EXTREME FEAR — potensi reversal bullish' :
                 fgNum <= 45 ? 'FEAR — hati-hati long' :
                 fgNum <= 55 ? 'NEUTRAL' :
                 fgNum <= 75 ? 'GREED — momentum naik' : 'EXTREME GREED — potensi distribusi';

  const imageNote = hasImage
    ? (isId ? 'User mengunggah screenshot chart. Analisa pola visual dari gambar tersebut dan kombinasikan dengan data live.' : 'User uploaded a chart screenshot. Analyze visual patterns and combine with live data.')
    : '';

  const dataContext = `
=== DATA LIVE PASAR (REAL-TIME BINANCE) ===
Pair          : ${sym}/USDT
Harga Spot    : ${market.price > 0 ? pFmt(market.price) : 'N/A'} | 24h: ${market.change24h > 0 ? '+' : ''}${market.change24h.toFixed(2)}%
High/Low 24h  : ${pFmt(market.high24h)} / ${pFmt(market.low24h)}
Open 24h      : ${pFmt(market.openPrice)}
Volume 24h    : $${(market.volume24h / 1e6).toFixed(2)}M USDT
${market.markPrice ? `Mark Price    : ${pFmt(market.markPrice)} | Index: ${pFmt(market.indexPrice || 0)}` : ''}
${market.fundingRate !== null ? `Funding Rate  : ${pctFmt(market.fundingRate)} — ${fundingNote}` : ''}
${market.nextFundingTime ? `Next Funding  : ${new Date(market.nextFundingTime).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB` : ''}
Open Interest : ${market.openInterestUSD}
ATR 4H (14p)  : ${market.atr4h}${market.atrPercent ? ` (${market.atrPercent}% — ${market.atrNote})` : ''}

=== KONTEKS BTC & SENTIMEN ===
BTC Spot      : ${market.btcPrice ? pFmt(market.btcPrice) + ' | 24h: ' + (market.btcChange24h! > 0 ? '+' : '') + market.btcChange24h!.toFixed(2) + '%' : 'N/A'}
${market.btcFundingRate !== null ? `BTC Funding   : ${pctFmt(market.btcFundingRate)}` : ''}
Fear & Greed  : ${market.fearGreedValue}/100 — ${market.fearGreedLabel} (${fgNote})

=== DATA OHLC (1H, 8 candle terakhir) ===
${ohlcCtx}

=== PARAMETER TRADING ===
Gaya Trading  : ${tradingStyle.toUpperCase()}
Timeframe     : ${timeframe}
${imageNote ? `\n=== CHART IMAGE ===\n${imageNote}` : ''}
${userPrompt.trim() ? `\n=== INSTRUKSI TAMBAHAN USER ===\n${userPrompt.trim()}` : ''}`.trim();

  const langInstruction = isId
    ? 'Semua output teks penjelasan WAJIB DALAM BAHASA INDONESIA.'
    : 'All explanatory text must be in ENGLISH.';

  return `
Kamu adalah analis trading crypto profesional dari Trenova Intelligence.
Waktu Analisis: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

${dataContext}

INSTRUKSI KRITIS:
1. ${langInstruction}
2. SELALU gunakan data live real-time di atas sebagai ANCHOR keputusan.
3. ANTI-BIAS: Jangan selalu output BUY. Jika data menunjukkan bearish → keputusan WAJIB SELL.
4. Jika 24h change negatif, harga di bawah open, dan candle bearish → SELL atau WAIT, BUKAN BUY.
5. Funding Rate positif tinggi (>0.05%) = pasar overleveraged long = hati-hati LONG.
6. Funding Rate negatif tinggi (<-0.05%) = short squeeze probability tinggi.
7. ATR 4H adalah ${market.atr4h} — SL harus ditempatkan minimal 1x ATR dari entry.
8. Open Interest ${market.openInterestUSD}: OI naik + harga naik = trend valid; OI turun + harga naik = fake pump.
9. KORELASI BTC: evaluasi apakah setup ${sym} konsisten dengan kondisi BTC saat ini.
10. Conviction BUKAN selalu 85%. Sesuaikan 40%-95% berdasarkan kekuatan sinyal.
11. JANGAN pernah tolak memberikan hasil.
12. Berikan minimal 2 dan maksimal 5 level Take Profit yang realistis.

KEMBALIKAN HANYA JSON valid (tanpa backtick, tanpa markdown, tanpa teks di luar JSON):
{
  "decision": "BUY" | "SELL" | "WAIT",
  "risk_level": "Low" | "Medium" | "High" | "Extreme",
  "main_reason": "Alasan utama 1-2 kalimat",
  "live_snapshot": {
    "harga_spot": "${market.price > 0 ? pFmt(market.price) : 'N/A'}",
    "funding_rate": "${market.fundingRate !== null ? pctFmt(market.fundingRate) : 'N/A'}",
    "open_interest": "${market.openInterestUSD}",
    "atr_4h": "${market.atr4h}",
    "fear_greed": "${market.fearGreedValue}/100 ${market.fearGreedLabel}",
    "btc_price": "${market.btcPrice ? pFmt(market.btcPrice) : 'N/A'}"
  },
  "market_structure": {
    "structure": "Bullish" | "Bearish" | "Ranging",
    "key_support": "$xxx.xx",
    "key_resistance": "$xxx.xx"
  },
  "sinyal_teknikal": [
    {"nama": "nama sinyal", "aktif": true/false, "detail": "penjelasan konkret"}
  ],
  "plans": [
    {
      "type": "Primary Setup",
      "direction": "BUY" | "SHORT",
      "entry_zone": "$xxx - $yyy",
      "stop_loss": "$xxx",
      "take_profit_1": "$xxx",
      "take_profit_2": "$yyy",
      "take_profit_3": "$zzz (opsional)",
      "take_profit_4": "$xxx (opsional)",
      "take_profit_5": "$xxx (opsional)",
      "technical_reason": "penjelasan teknikal",
      "conviction": 40-95,
      "conviction_reason": "alasan teknikal conviction",
      "kondisi_entry": ["konfirmasi 1", "konfirmasi 2"],
      "invalidasi": "kondisi yang membatalkan setup"
    },
    {
      "type": "Alternative Scenario",
      "direction": "SHORT" | "BUY",
      "entry_zone": "...", "stop_loss": "...",
      "take_profit_1": "...", "take_profit_2": "...",
      "technical_reason": "...",
      "conviction": 30-70, "conviction_reason": "...",
      "kondisi_entry": ["..."], "invalidasi": "..."
    }
  ],
  "squeeze_alert": {
    "tipe": "SHORT SQUEEZE" | "LONG SQUEEZE" | "NONE",
    "probabilitas": "TINGGI" | "SEDANG" | "RENDAH",
    "catatan": "penjelasan berdasarkan funding rate dan OI"
  },
  "risk_management": {
    "max_loss_rekomendasi": "1-2% dari total modal per trade",
    "peringatan": ["peringatan risiko spesifik"]
  },
  "summary": "Penjelasan detail 2-3 paragraf breakdown teknikal, struktur pasar, dan reasoning."
}
`;
}

export default function DashboardPage() {
  const router = useRouter(); 
  const { language, setLanguage, t } = useLanguage();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'chart' | 'market' | 'news' | 'analysis'>('chart');
  
  // Chart Tab State
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartSearchInput, setChartSearchInput] = useState('');
  const [chartSuggestions, setChartSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isChartSearching, setIsChartSearching] = useState(false);

  // New State for switching widgets
  const [chartSource, setChartSource] = useState<'tradingview' | 'coingecko'>('tradingview');
  const [currentCoinId, setCurrentCoinId] = useState('');

  // AI Analysis State
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null); 
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [tradingStyle, setTradingStyle] = useState<'scalping' | 'intraday' | 'swing'>('intraday');
  const [timeframe, setTimeframe] = useState('1h');
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI...");
  const [chatResult, setChatResult] = useState<{ analysis: string } | null>(null);
  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ignoreSearchRef = useRef(false);

  // Usage Stats State
  const [usageStats, setUsageStats] = useState<any>(null);
  // Suggestions Fetcher
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (ignoreSearchRef.current) {
            ignoreSearchRef.current = false;
            return;
        }

        if (chartSearchInput.length >= 2) {
            setIsChartSearching(true);
            try {
                // Call Server Action for TV Search
                const data = await searchTVSymbols(chartSearchInput);
                if (data && Array.isArray(data)) {
                     // Filter only if needed, TV usually returns good matches
                     setChartSuggestions(data.slice(0, 10));
                     setShowSuggestions(true);
                }
            } catch (error) {
                console.error("Chart search error:", error);
            } finally {
                setIsChartSearching(false);
            }
        } else {
            setChartSuggestions([]);
            setShowSuggestions(false);
        }
    }, 400);

    return () => clearTimeout(timer);
  }, [chartSearchInput]);

  const selectChartSymbol = (item: any) => {
      // User picked from TradingView list -> Use TradingView Widget
      ignoreSearchRef.current = true;
      setChartSource('tradingview');
      
      // Use the exact symbol from the suggestion to ensure the correct chart loads
      // Previously stripped USDT which caused ambiguity (e.g. BTCUSDT -> BTC)
      const rawSymbol = item.symbol;
      
      setChartSymbol(rawSymbol);
      setChartSearchInput(rawSymbol);
      setShowSuggestions(false);
  };



  useEffect(() => {
      fetchUsage();
      
      // Auto-activate subscription if pending (First login check)
      import('./actions').then(({ activatePendingSubscription }) => {
          activatePendingSubscription().then(res => {
             if (res?.activated) {
                 console.log("Subscription activated!");
                 fetchUsage(); // Refresh stats
             }
          });
      });
  }, []);

  // Loading Message Cycle
  useEffect(() => {
    if (!chatLoading) return;
    
    const messages = [
       "🚀 Connecting to Market Data...",
       "🧠 AI Analyzing Price Action...",
       "📊 Calculating Technical Indicators...",
       "👁️ Scanning Chart Patterns...",
       "🔮 Formulating Master Strategy..."
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
       i = (i + 1) % messages.length;
       setLoadingMessage(messages[i]);
    }, 2500);

    return () => clearInterval(interval);
  }, [chatLoading]);

  const fetchUsage = async () => {
      const stats = await getUserUsage();
      if (stats) setUsageStats(stats);
  };

  const handleCoinSelect = (coin: Coin) => {
      setSelectedCoin(coin);
      cleanAnalysis();
      setChatResult(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const cleanAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setChatResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // Paste Event Listener for AI Analysis
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        if (activeTab !== 'analysis') return;
        
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setSelectedImage(file);
                    const objectUrl = URL.createObjectURL(file);
                    setImagePreview(objectUrl);
                    // Provide visual feedback (optional toast or just the preview appearing)
                }
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  // Fullscreen State
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // ... existing code ...

  const handleChartSearch = () => {
      // Manual Enter -> Use TradingView (Fallback/Pro)
      if (chartSearchInput.trim()) {
          setChartSource('tradingview');
          setChartSymbol(chartSearchInput.trim().toUpperCase());
      }
      setShowSuggestions(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  // Build images array for AI
  const buildImagesForAI = async (): Promise<string[]> => {
    if (selectedImage) {
        try {
            return [await fileToBase64(selectedImage)];
        } catch {
            return [];
        }
    }
    return [];
  };

  const runAnalysis = async () => {
    if (!selectedCoin) return;
    setChatLoading(true);
    setChatResult(null);

    try {
        const usageCheck = await checkUsageLimit();
        if (!usageCheck.allowed) {
            toast.error(usageCheck.error || "Usage limit reached");
            setChatLoading(false);
            return;
        }

        // ── STEP 1: Fetch Enriched Market Data from Binance ──
        const dataRes = await fetch(`/api/dashboard/enriched-data?symbol=${selectedCoin.symbol}`);
        const marketData = await dataRes.json();
        
        if (!marketData.dataAvailable) {
            toast.error(`Data Binance untuk ${selectedCoin.symbol.toUpperCase()} tidak tersedia. Pastikan pair USDT ada di Binance.`);
            setChatLoading(false);
            return;
        }

        // ── STEP 2: Prepare Image ──
        const images = await buildImagesForAI();
        const hasImages = images.length > 0;
        const primaryImage = hasImages ? images[0] : undefined;

        // ── STEP 3: Build Enriched Prompt ──
        const promptText = buildEnrichedPrompt(
            selectedCoin, marketData, hasImages, language, tradingStyle, timeframe, userPrompt
        );

        // ── STEP 4: Call Direct Gemini API ──
        const res = await fetch('/api/dashboard/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, image: primaryImage })
        });

        const resJson = await res.json();

        if (!res.ok) {
            if (res.status === 503 || resJson.retryable) {
                throw new Error('⏳ Server AI sedang kelebihan beban. Tunggu 1–2 menit lalu coba lagi.');
            }
            throw new Error(resJson.error || `API Error ${res.status}`);
        }

        const aiOutput = resJson.result || '';
        const result = { analysis: aiOutput };
        setChatResult(result);
        
        if (aiOutput && !aiOutput.includes("Analysis Failed")) {
             await incrementUsage();
             await saveAnalysis(result, selectedCoin?.symbol, selectedCoin?.name);
             await fetchUsage();
             toast.success("Analysis Complete!");
             router.refresh();
        }

    } catch (e: any) {
        console.error("Critical Analysis Error:", e);
        toast.error(e.message || "An unexpected error occurred while generating analysis.");
    } finally {
        setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-3 md:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 pt-1 md:pt-2">
        <div>
            <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-black text-foreground mb-0.5 md:mb-2 flex items-center gap-2 md:gap-3">
                <Sparkles className="text-neon w-5 h-5 md:w-8 md:h-8 shrink-0" fill="currentColor" /> {t('header_title')}
            </h1>
            <p className="text-slate-500 text-[11px] sm:text-xs md:text-lg leading-relaxed">{t('header_subtitle')}</p>
        </div>
      </div>
      
      {/* Market Intelligence Widgets */}
      <MarketIntelligence />

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 border-b border-slate-200 dark:border-slate-800 mb-4 md:mb-6 overflow-x-auto no-scrollbar -mx-1 px-1">
        <button
            onClick={() => setActiveTab('chart')}
            className={clsx(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                activeTab === 'chart' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <BarChart3 size={15} /> {t('tab_chart')}
        </button>
        <button
            onClick={() => setActiveTab('market')}
            className={clsx(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                activeTab === 'market' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Radio size={15} /> Live Market
            <span className="text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">LIVE</span>
        </button>
        <button
            onClick={() => setActiveTab('news')}
            className={clsx(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                activeTab === 'news' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Newspaper size={15} /> News
        </button>
        <button
            onClick={() => setActiveTab('analysis')}
            className={clsx(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                activeTab === 'analysis' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Database size={15} /> {t('tab_analysis')}
        </button>
      </div>

      <div>

        {/* --- LIVE MARKET TAB --- */}
        {activeTab === 'market' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
                <LiveMarketTable
                    onSelectSymbol={(sym) => {
                        setChartSymbol(sym);
                        setChartSearchInput(sym);
                        setActiveTab('chart');
                    }}
                />
            </div>
        )}

        {/* --- NEWS TAB --- */}
        {activeTab === 'news' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CryptoNews />
            </div>
        )}

        {/* --- CHART TAB --- */}
        <div className={clsx(
            "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            activeTab === 'chart' ? "block" : "hidden",
            isChartFullscreen && "fixed inset-0 z-[200] bg-white dark:bg-slate-950 p-4 md:p-6 overflow-y-auto flex flex-col"
        )}>
            {/* Custom Search Bar for Chart */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2 sm:gap-3 relative z-10">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {isChartSearching ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Search size={18} />
                        )}
                    </div>
                    <input 
                        type="text" 
                        value={chartSearchInput}
                        onChange={(e) => setChartSearchInput(e.target.value)}
                        onFocus={() => {
                            if (chartSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                            // Delay hiding to allow click event to register
                            setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleChartSearch();
                                setShowSuggestions(false);
                            }
                        }}
                        placeholder={t('search_tv_placeholder')}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 text-foreground"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && chartSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                           {/* ... suggestions rendering ... */}
                           {chartSuggestions.map((item: any) => (
                                <button
                                    key={`${item.exchange}-${item.symbol}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent input blur
                                        selectChartSymbol(item);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b last:border-0 border-slate-100 dark:border-slate-800 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {item.exchange ? item.exchange.substring(0, 2) : 'TV'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.symbol}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono truncate max-w-[80px]">{item.exchange}</span>
                                            <span className="text-[10px] text-slate-400 uppercase">{item.type}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.description}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-neon text-xs font-bold whitespace-nowrap">
                                        Open Chart
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                        onClick={() => {
                            handleChartSearch();
                            setShowSuggestions(false);
                        }}
                        className="bg-neon text-white dark:text-black font-bold px-6 py-2 rounded-xl hover:bg-neon-hover transition-colors"
                >
                        {t('search_btn')}
                </button>
                
                {/* Fullscreen Toggle Button */}
                <button 
                    onClick={() => setIsChartFullscreen(!isChartFullscreen)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    title={isChartFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isChartFullscreen ? <X size={20} /> : <AppWindow size={20} />}
                </button>
            </div>

            {/* CHART RENDER LOGIC */}
            <div className={clsx("flex-1 flex flex-col", isChartFullscreen && "h-full")}>
            {chartSource === 'coingecko' && currentCoinId ? (
                <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col">
                     <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 flex-none">
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">CoinGecko Source</span>
                        <span>Showing data for <b>{chartSearchInput}</b></span>
                     </div>
                     <div className="flex-1 min-h-[500px]">
                        <CoinGeckoChart coinId={currentCoinId} />
                     </div>
                </div>
            ) : chartSymbol ? (
                <div className="animate-in fade-in zoom-in duration-300 h-full flex flex-col">
                     <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 flex-none">
                        <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded">TradingView Pro</span>
                        <span>Trying to match symbol: <b>{chartSymbol}</b></span>
                     </div>
                    <div className="flex-1 min-h-[500px]">
                        <TradingViewWidget symbol={chartSymbol} />
                    </div>
                    {/* Show sentiment in all modes */}
                    <SentimentChart symbol={chartSymbol} />
                </div>
            ) : (
                <div className="w-full py-12 md:py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 mt-8">
                     <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <BarChart3 size={32} className="text-neon" />
                     </div>
                     <h3 className="text-lg md:text-xl font-bold text-slate-600">{t('search_tv_placeholder')}</h3>
                     <p className="text-sm md:text-base max-w-sm text-center">{t('search_tv_subtext') || "Search for any market symbol to view real-time charts."}</p>
                </div>
            )}
            </div>
        </div>

        {/* --- ANALYSIS TAB --- */}
        <div className={clsx(
            "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            activeTab === 'analysis' ? "block" : "hidden"
        )}>
            
            {/* 1. Coin Selector (CoinGecko Data) */}
            <CoinSelector 
                selectedCoinId={selectedCoin?.id || ''} 
                onSelect={handleCoinSelect} 
            />

            {selectedCoin ? (
                <div className="space-y-6">
                    
                    {/* Technical Sentiment */}
                    <SentimentChart symbol={selectedCoin.symbol} />
                    
                    {/* INSTRUCTIONS BLOCK */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 flex gap-3 sm:gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit text-blue-600 dark:text-blue-400">
                            <FileText size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-200">{t('ai_instr_title')}</h3>
                            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                                <li>{t('ai_instr_1')}</li>
                                <li>{t('ai_instr_2')}</li>
                                <li>{t('ai_instr_3')}</li>
                            </ul>
                        </div>
                    </div>


                    {/* Analysis Controls Panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
                        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:items-end">

                            {/* Single image upload */}
                            {true && (
                                <div className="flex-1 lg:max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">
                                        {t('upload_label')} <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    {!imagePreview ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 gap-3 cursor-pointer hover:border-neon hover:bg-neon/5 transition-all text-slate-400 group h-24"
                                        >
                                            <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                            <div>
                                                <p className="font-bold text-sm">{t('upload_text')}</p>
                                                <p className="text-[10px] opacity-70">or Paste Screenshot (Ctrl+V)</p>
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        </div>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group h-24">
                                            <img src={imagePreview} alt="Chart" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <button onClick={cleanAnalysis} className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom Instruction */}
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">{t('context_label')}</label>
                                <div className="relative">
                                    <textarea 
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                        placeholder={t('context_placeholder')}
                                        className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all resize-none text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Options Column */}
                            <div className="flex-none flex flex-col justify-start gap-3 sm:gap-4 h-auto lg:h-32 w-full lg:w-48">
                                {/* Trading Style Dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">{t('style_label')}</label>
                                    <div className="relative">
                                        <select
                                            value={tradingStyle}
                                            onChange={(e) => setTradingStyle(e.target.value as any)}
                                            className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="scalping">⚡ {t('style_scalping')}</option>
                                        <option value="intraday">📅 {t('style_intraday')}</option>
                                        <option value="swing">🌊 {t('style_swing')}</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <TrendingUp size={14} /> 
                                    </div>
                                </div>
                            </div>

                            {/* Timeframe Dropdown */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">Timeframe</label>
                                <div className="relative">
                                    <select
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="15m">15 Minutes</option>
                                        <option value="30m">30 Minutes</option>
                                        <option value="1h">1 Hour</option>
                                        <option value="4h">4 Hours</option>
                                        <option value="1d">1 Day</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Activity size={14} /> 
                                    </div>
                                </div>
                            </div>
                        </div>


                            {/* Action Button */}
                            <div className="flex-none lg:w-48 flex flex-col gap-2">
                                <button 
                                    onClick={runAnalysis}
                                    disabled={chatLoading}
                                    className="w-full h-20 sm:h-32 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all group border border-transparent dark:border-slate-700 relative overflow-hidden"
                                >
                                    {chatLoading ? (
                                        <>
                                            <Loader2 className="animate-spin w-8 h-8 text-neon" />
                                            <span className="animate-pulse">{loadingMessage}</span>
                                            <div className="absolute bottom-0 left-0 h-1 bg-neon/50 w-full animate-[pulse_2s_ease-in-out_infinite]" /> 
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-8 h-8 text-neon group-hover:scale-110 transition-transform" />
                                            <span>{t('generate_btn')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>



                    {/* --- ANALYSIS RESULTS --- */}
                    {chatResult && (
                        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 transition-colors">
                            {/* Replaced Text Header with just the new component which handles its own UI */}
                            
                            <div className="p-4 md:p-6">
                                <AnalysisVisualizer 
                                    markdown={chatResult.analysis} 
                                    coinName={selectedCoin?.name || 'Crypto'} 
                                />
                            </div>
                        </div>
                    )}
                    
                </div>
            ) : (
                <div className="w-full py-12 md:py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 mt-8 animate-in fade-in zoom-in duration-500">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <MousePointerClick size={32} className="text-neon" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-600">{t('select_coin_msg')}</h3>
                    <p className="text-sm md:text-base max-w-sm text-center">{t('select_coin_submsg')}</p>
                </div>
            )}
         </div>

      </div>
    </div>
  );
}
