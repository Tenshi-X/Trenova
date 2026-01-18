'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Zap, Activity, Database, Sparkles, TrendingUp, BarChart3, AlertTriangle, Upload, X, MousePointerClick, Loader2, Search, FileText, Globe } from 'lucide-react';
import clsx from 'clsx';
import { askChatbot } from '@/lib/api';
import { checkUsageLimit, incrementUsage, saveAnalysis, getUserUsage } from './actions';
import CoinSelector, { Coin } from '@/components/CoinSelector';
import TradingViewWidget from '@/components/TradingViewWidget';
import { useLanguage } from '@/context/LanguageContext';

async function fetchCoinGeckoData(coinId: string) {
    try {
        const timestamp = new Date().getTime();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!res.ok) throw new Error("API Limit");
        const data = await res.json();
        return data[coinId];
    } catch (e) {
        console.warn("CoinGecko API failed (likely rate limit), using fallback.");
        return null;
    }
}

const GLOBAL_ANALYSIS_PROMPT = `
Kamu adalah TRADER CRYPTO PROFESIONAL yang mampu menyesuaikan gaya trading {{TRADING_STYLE}}.

Pendekatan analisa WAJIB:
- PRICE ACTION murni
- MARKET STRUCTURE
- OBJEKTIF, DISIPLIN, dan BERBASIS PROBABILITAS
(BUKAN prediksi dan BUKAN kepastian)

**DATA PASAR LIVE:**
- Pair: {{COIN_NAME}} ({{SYMBOL}}/USDT)
- Harga Saat Ini: \${{PRICE}}
- Perubahan 24h: {{CHANGE_24H}}%
- Market Cap: \${{MARKET_CAP}}
- Volume 24h: \${{VOLUME_24H}}
{{IMAGE_CONTEXT}}

===================================================
A. DETAIL CHART

1. Pair: {{SYMBOL}}/USDT
2. Timeframe utama: {{TIMEFRAME}}
3. Gaya trading: {{TRADING_STYLE}}

===================================================
B. ANALISA MARKET STRUCTURE

1. Tentukan kondisi market saat ini berdasarkan struktur harga:
   - Uptrend  → HH–HL
   - Downtrend → LH–LL
   - Sideways → Range

2. Identifikasi:
   - Range harga aktif
   - Support & resistance intraday
   - Area liquidity penting (EQH, EQL, range high, range low, equal high/low)

3. Tentukan bias utama timeframe {{TIMEFRAME}}:
   - Bullish / Bearish / Netral
   Sertakan alasan teknikal singkat.

===================================================
C. SETUP ENTRY (PRICE ACTION ONLY)

Turunkan setup entry HANYA jika valid, berdasarkan:
- Break & retest
- Rejection di level penting
- Range play

Jika market tidak memberikan setup valid, WAJIB tulis:
WAIT / NO TRADE.

===================================================
D. SKENARIO TRADING (WAJIB MINIMAL 2)
1. Skenario Utama (Probabilitas Tertinggi)
2. Skenario Alternatif (Jika harga gagal / berlawanan)

===================================================
E. OUTPUT TRADING PLAN (WAJIB FORMAT DI BAWAH)
HASIL AKHIR ANALISA HARUS DITULIS PERSIS DENGAN FORMAT INI:

TRADING PLAN
ENTRY        : "harga"
STOP LOSS   : "harga"

TAKE PROFIT 1 : "harga"
- Target aman / reaksi awal / struktur minor

TAKE PROFIT 2 : "harga"
- Target realistis / intraday range / S&R utama

TAKE PROFIT 3 : "harga" (KONDISIONAL)
- HANYA diambil jika momentum kuat
- Target diarahkan ke area liquidity terdekat

TAKE PROFIT 4 : "harga" (KONDISIONAL)
- HANYA diambil jika terjadi continuation / expansion
- Target diarahkan ke liquidity BESAR (EQH/EQL / range high-low utama)

===================================================
F. RISK MANAGEMENT
1. Stop loss harus:
   - Ketat
   - Logis
   - Berbasis invalidasi struktur

2. Jelaskan:
   - Risk–Reward Ratio
   - Invalidation level (level harga yang MEMBATALKAN setup)

===================================================
G. Conviction Level (TINGKAT KEYAKINAN SETUP)
Berikan nilai conviction dalam bentuk persentase (0%–100%) untuk SETIAP skenario, berdasarkan kualitas setup.

Gunakan standar berikut:
A. 10% – 30% (Low Conviction)
1. Market choppy / tidak jelas
2. Struktur lemah atau bertentangan
3. Disarankan WAIT / NO TRADE

B. 40% – 60% (Medium Conviction)
1. Struktur cukup jelas
2. Setup valid tapi belum ideal
3. Trade boleh diambil dengan risk kecil

C. 70% – 80% (High Conviction)
1. Struktur market jelas & searah bias
2. Level kuat + konfirmasi price action
3. Setup layak dieksekusi

D. 90%+ (Rare / Exceptional)
1. Multi-konfirmasi kuat
2. Bias HTF & LTF selaras
3. Tetap disiplin risk management (tidak overconfidence)

Sertakan alasan singkat mengapa conviction berada di level tersebut.

===================================================
H. TARGET JANGKA PENDEK & MENENGAH

Jelaskan proyeksi pergerakan harga berdasarkan waktu:

1. Jangka Pendek (1-7 hari):
   - Estimasi range konsolidasi atau target breakout terdekat.
   - Level krusial yang harus ditembus atau dijaga.

2. Jangka Menengah (1-4 minggu):
   - Target profit maksimal jika tren berlanjut.
   - Risiko koreksi terdalam jika trend berbalik.

===================================================
I. FINAL DECISION (WAJIB & TEGAS)

Pilih SATU keputusan:
- OPEN LONG
- OPEN SHORT
- WAIT / NO TRADE

Jelaskan secara ringkas:
1. Mengapa keputusan ini PALING rasional secara probabilitas
2. Maksimal 3 faktor teknikal utama (struktur, level, reaksi harga)

Sebutkan:
- Skenario yang DIUTAMAKAN
- Skenario yang HARUS DIHINDARI

===================================================
FORMAT PENUTUP (WAJIB)
👉 Kesimpulan: [OPEN LONG / OPEN SHORT / WAIT]  
👉 Alasan utama: (maks. 3 poin teknikal terkuat)  
👉 Conviction akhir: XX%  
👉 Catatan disiplin: 1 kalimat pengingat risk management
`;

function constructPrompt(template: string, coin: any, market: any, hasImage: boolean, lang: 'id' | 'en', tradingStyle: string, timeframe: string) {
  const imageContext = hasImage ? "Note: User has uploaded a chart image. Please focus on visual pattern recognition." : "";
  const langInstruction = lang === 'id' 
    ? "**IMPORTANT:** PLEASE PROVIDE THE ENTIRE RESPONSE IN INDONESIAN LANGUAGE (BAHASA INDONESIA)." 
    : "**IMPORTANT:** Please provide the response in English.";

  return template
    .replace(/{{COIN_NAME}}/g, coin.name)
    .replace(/{{SYMBOL}}/g, coin.symbol.toUpperCase())
    .replace(/{{PRICE}}/g, market?.usd?.toLocaleString() || '0')
    .replace(/{{CHANGE_24H}}/g, market?.usd_24h_change?.toFixed(2) || '0')
    .replace(/{{VOLUME_24H}}/g, market?.usd_24h_vol ? market.usd_24h_vol.toLocaleString() : 'N/A')
    .replace(/{{MARKET_CAP}}/g, market?.usd_market_cap ? market.usd_market_cap.toLocaleString() : 'N/A')
    .replace(/{{TRADING_STYLE}}/g, tradingStyle.toUpperCase())
    .replace(/{{TIMEFRAME}}/g, timeframe)
    .replace(/{{IMAGE_CONTEXT}}/g, imageContext + "\n" + langInstruction);
}

export default function DashboardPage() {
  const router = useRouter(); 
  const { language, setLanguage, t } = useLanguage();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'chart' | 'analysis'>('chart');
  
  // Chart Tab State
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartSearchInput, setChartSearchInput] = useState('');

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

  // Usage Stats State
  const [usageStats, setUsageStats] = useState<any>(null);

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

  const handleChartSearch = () => {
      if (chartSearchInput.trim()) {
          setChartSymbol(chartSearchInput.trim().toUpperCase());
      }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const runAnalysis = async () => {
    if (!selectedCoin) return;
    setChatLoading(true);
    setChatResult(null); // Clear previous

    try {
        // 1. Check Usage Limit (Read Only)
        const usageCheck = await checkUsageLimit();
        if (!usageCheck.allowed) {
            alert(usageCheck.error);
            setChatLoading(false);
            return;
        }

        // 2. Fetch Market Data
        let marketData = await fetchCoinGeckoData(selectedCoin.id);
        if (!marketData) {
            console.warn("Market data fetch failed, using fallback/zeros");
            marketData = { usd: 0, usd_24h_change: 0 };
        }

        // 3. Prepare Image
        let imageBase64: string | undefined = undefined;
        if (selectedImage) {
            try {
                imageBase64 = await fileToBase64(selectedImage);
            } catch (err) {
                console.error("Failed to convert image", err);
            }
        }

        // 4. Construct Prompt
        let promptText = constructPrompt(GLOBAL_ANALYSIS_PROMPT, selectedCoin, marketData, !!selectedImage, language, tradingStyle, timeframe);

        // Specific adjustments for logic requirements
        if (selectedImage) {
            promptText = `[PRIORITY INSTRUCTION: ANALYZE THE UPLOADED CHART IMAGE FOR ${selectedCoin.name}. Focus on ${tradingStyle.toUpperCase()} setup. Use the text data as context, but the IMAGE is the primary source for Technical Analysis.]\n\n` + promptText;
        }

        // Add additional user prompt if present
        if (userPrompt.trim()) {
            promptText += `\n\n**ADDITIONAL USER INSTRUCTION:**\n${userPrompt}`;
        }

        // 5. Call AI
        let aiOutput = "";
        try {
            console.log("Sending prompt to AI:", promptText.length, "chars", imageBase64 ? "+ Image" : "");
            const apiRes = await askChatbot(promptText, imageBase64);
            
            if (apiRes && apiRes.analysis) {
                aiOutput = apiRes.analysis;
            } else {
                console.error("AI returned malformed response:", apiRes);
                throw new Error("AI response missing analysis field");
            }
        } catch(e) { 
            console.error("AI Execution Error:", e);
            aiOutput = `### ⚠️ Analysis Failed
            
**Reason:** Unable to reach the AI service. 
**Details:** The server might be busy, or your connection is unstable. 
            
Please try again in a few moments.`;
        }

        const result = { analysis: aiOutput };
        setChatResult(result);
        
        // 6. Save & Increment Quota ONLY on Success
        if (aiOutput && !aiOutput.includes("Analysis Failed")) {
             // Increment Quota
             await incrementUsage();
             
             // Save Result
             await saveAnalysis(result, selectedCoin?.symbol, selectedCoin?.name);
             
             // Refresh Stats on UI
             await fetchUsage();
             router.refresh();
        }

    } catch (e) {
        console.error("Critical Analysis Error:", e);
        alert("An unexpected error occurred while generating analysis.");
    } finally {
        setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 px-3 md:space-y-8 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-foreground mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
                <Sparkles className="text-neon w-5 h-5 md:w-8 md:h-8" fill="currentColor" /> {t('header_title')}
            </h1>
            <p className="text-slate-500 text-xs md:text-lg">{t('header_subtitle')}</p>
        </div>
        
        {/* Language Toggler */}
        <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
            <button
                onClick={() => setLanguage('id')}
                className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    language === 'id' ? "bg-neon/10 text-neon" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
            >
                🇮🇩 ID
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    language === 'en' ? "bg-neon/10 text-neon" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
            >
                🇺🇸 EN
            </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
            onClick={() => setActiveTab('chart')}
            className={clsx(
                "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                activeTab === 'chart' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <BarChart3 size={18} /> {t('tab_chart')}
        </button>
        <button
            onClick={() => setActiveTab('analysis')}
            className={clsx(
                "px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                activeTab === 'analysis' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Database size={18} /> {t('tab_analysis')}
        </button>
      </div>

      <div>
        {/* --- CHART TAB --- */}
        <div className={clsx(
            "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            activeTab === 'chart' ? "block" : "hidden"
        )}>
            {/* Custom Search Bar for Chart */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={chartSearchInput}
                        onChange={(e) => setChartSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChartSearch()}
                        placeholder={t('search_tv_placeholder')}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 text-foreground"
                    />
                </div>
                <button 
                        onClick={handleChartSearch}
                        className="bg-neon text-white dark:text-black font-bold px-6 py-2 rounded-xl hover:bg-neon-hover transition-colors"
                >
                        {t('search_btn')}
                </button>
            </div>

            {chartSymbol ? (
                <TradingViewWidget symbol={chartSymbol} />
            ) : (
                <div className="w-full py-12 md:py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 mt-8">
                     <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <BarChart3 size={32} className="text-neon" />
                     </div>
                     <h3 className="text-lg md:text-xl font-bold text-slate-600">{t('search_tv_placeholder')}</h3>
                     <p className="text-sm md:text-base max-w-sm text-center">Search for any market symbol to view real-time charts.</p>
                </div>
            )}
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
                    
                    {/* INSTRUCTIONS BLOCK */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 md:p-6 flex gap-4">
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

                    {/* Analysis Controls */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
                        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                            
                            {/* Image Upload Section */}
                            <div className="flex-1 lg:max-w-md">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">{t('upload_label')}</label>
                                {!imagePreview ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 gap-3 cursor-pointer hover:border-neon hover:bg-neon/5 transition-all text-slate-400 group h-32"
                                    >
                                        <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                        <div>
                                            <p className="font-bold text-sm">{t('upload_text')}</p>
                                            <p className="text-[10px] opacity-70">{t('upload_subtext')}</p>
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group h-32">
                                        <img src={imagePreview} alt="Chart" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button 
                                            onClick={cleanAnalysis}
                                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

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
                            <div className="flex-none flex flex-col justify-start gap-4 h-32 w-full lg:w-48">
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
                                    className="w-full h-32 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-2xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 transition-all group border border-transparent dark:border-slate-700 relative overflow-hidden"
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
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-4 md:p-6 flex items-center gap-3 transition-colors">
                                <div className="p-2 bg-neon/10 rounded-xl text-neon">
                                    <Database size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t('result_title')}</h2>
                            </div>
                            <div className="p-6 md:p-10 prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:text-slate-600 dark:prose-li:text-slate-400">
                                {chatResult.analysis.split('\n').map((line, i) => (
                                    <p key={i} className={clsx(
                                        "mb-2",
                                        line.startsWith('###') && "text-xl md:text-2xl mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2",
                                        line.startsWith('**') && "font-semibold text-slate-800 dark:text-slate-200"
                                    )}>
                                        {line.replace(/###|[*]/g, '')}
                                    </p>
                                ))}
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
