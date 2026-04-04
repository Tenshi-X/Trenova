'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Zap, Activity, Database, Sparkles, TrendingUp, BarChart3, AlertTriangle, Upload, X, MousePointerClick, Loader2, Search, FileText, Globe, AppWindow, Radio, Layers } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { askChatbot } from '@/lib/api';
import { checkUsageLimit, incrementUsage, saveAnalysis, getUserUsage, searchTVSymbols, fetchCoinGeckoData, fetchMarketSentiment } from './actions';
import CoinSelector, { Coin } from '@/components/CoinSelector';
import CoinGeckoChart from '@/components/CoinGeckoChart';
import TradingViewWidget from '@/components/TradingViewWidget';
import SentimentChart from '@/components/SentimentChart';
import MarketIntelligence from '@/components/MarketIntelligence';
import AnalysisVisualizer from '@/components/AnalysisVisualizer';
import LiveMarketTable from '@/components/LiveMarketTable';
import AIInputSlots from '@/components/AIInputSlots';
import { useLanguage } from '@/context/LanguageContext';



const PROMPT_TEMPLATE_ID = `
Kamu adalah TRADER CRYPTO PROFESIONAL yang OBJEKTIF dan tidak memiliki bias apapun. Tugasmu adalah memberikan analisa market yang sangat akurat dan berbasis data mentah.

**INSTRUKSI KRITIKAL BAGI AI:**
1. **BAHASA OUTPUT:** Semua teks penjelasan (\`summary\`, \`main_reason\`, \`technical_reason\`, \`conviction_reason\`) **WAJIB DALAM BAHASA INDONESIA**.
2. **JANGAN GUNAKAN BAHASA INGGRIS** untuk penjelasan.
3. Keluaran HARUS dalam format **JSON VALID** (RFC 8259). Jangan tambahkan markdown block seperti \`\`\`json.
4. Jangan pernah output "N/A" atau "TIDAK ADA". Selalu cari peluang terbaik meskipun itu "Wait & See".
5. Fokus pada Price Action dan Market Structure.
6. **ANTI-BIAS (SANGAT PENTING):**
   - JANGAN selalu mengeluarkan keputusan BUY. Analisa data secara JUJUR.
   - Jika data 24h menunjukkan penurunan signifikan, harga berada di bawah resistance, dan candle menunjukkan tekanan jual → market_structure WAJIB "Bearish" dan decision WAJIB "SELL".
   - Jika harga membuat Lower High dan Lower Low → itu BEARISH, bukan Bullish.
   - Jika perubahan 24h negatif dan harga di bawah open → pertimbangkan SELL atau WAIT, BUKAN BUY.
   - Hanya keluarkan BUY jika ada konfirmasi teknikal yang kuat (bounce dari support, higher low, candle reversal bullish).
7. **ATURAN DIRECTION (WAJIB DIPATUHI):**
   - Tentukan dulu apakah trend saat ini **Bullish** atau **Bearish** dari data OHLC dan perubahan harga.
   - **Jika Bullish:** Plan Primary (Trend Following) = direction "BUY", Plan Alternative (Counter-Trend) = direction "SHORT"
   - **Jika Bearish:** Plan Primary (Trend Following) = direction "SHORT", Plan Alternative (Counter-Trend) = direction "BUY"
   - **Jika Ranging:** Pilih direction yang paling masuk akal secara teknikal untuk masing-masing plan.
   - Field "direction" WAJIB diisi "BUY" atau "SHORT" di setiap plan. JANGAN KOSONG.
8. **TAKE PROFIT:** Berikan minimal 2 dan maksimal 5 level Take Profit. Semakin jauh TP, semakin kecil probabilitasnya. Jika hanya ada 2-3 level yang valid, cukup berikan segitu saja. Jangan memaksakan 5 TP jika tidak realistis.
9. **CONVICTION:** Conviction BUKAN selalu 85%. Sesuaikan antara 40%-95% berdasarkan kekuatan sinyal teknikal. Jelaskan ALASAN teknikal conviction di field "conviction_reason".

**DATA PASAR LIVE:**
- Pair: {{COIN_NAME}} ({{SYMBOL}}/USDT)
- Harga Saat Ini: \${{PRICE}}
- Perubahan 24h: {{CHANGE_24H}}%
- Market Cap: \${{MARKET_CAP}}
- Volume 24h: \${{VOLUME_24H}}

**DATA OHLC:**
{{MARKET_CTX}}

{{IMAGE_CONTEXT}}

**FORMAT OUTPUT YANG DIMINTA (JSON VALID):**
{
  "decision": "BUY" | "SELL" | "WAIT",
  "risk_level": "Low" | "Medium" | "High" | "Extreme",
  "main_reason": "Alasan singkat 1 kalimat (Bahasa Indonesia)",
  "market_structure": {
      "structure": "Bullish" | "Bearish" | "Ranging",
      "key_support": "$xxx.xx",
      "key_resistance": "$xxx.xx"
  },
  "plans": [
    {
      "type": "Primary Setup",
      "direction": "BUY" atau "SHORT",
      "entry_zone": "$xxx.xx - $xxx.xx",
      "stop_loss": "$xxx.xx",
      "take_profit_1": "$xxx.xx",
      "take_profit_2": "$xxx.xx",
      "take_profit_3": "$xxx.xx (opsional)",
      "take_profit_4": "$xxx.xx (opsional)",
      "take_profit_5": "$xxx.xx (opsional)",
      "technical_reason": "Penjelasan teknikal singkat kenapa entry di zona ini (Bahasa Indonesia)",
      "conviction": 40-95,
      "conviction_reason": "Jelaskan secara teknikal kenapa conviction X%, misal: Berdasarkan 3 konfirmasi: bouncing dari support $0.97, RSI oversold di 28, dan volume spike 2x rata-rata (Bahasa Indonesia)"
    },
    {
      "type": "Alternative Scenario",
      "direction": "SHORT" atau "BUY" (kebalikan dari Primary),
      "entry_zone": "$xxx.xx - $xxx.xx",
      "stop_loss": "$xxx.xx",
      "take_profit_1": "$xxx.xx",
      "take_profit_2": "$xxx.xx",
      "take_profit_3": "$xxx.xx (opsional)",
      "take_profit_4": "$xxx.xx (opsional)",
      "take_profit_5": "$xxx.xx (opsional)",
      "technical_reason": "Penjelasan teknikal singkat (Bahasa Indonesia)",
      "conviction": 30-70,
      "conviction_reason": "Jelaskan secara teknikal kenapa conviction X% (Bahasa Indonesia)"
    }
  ],
  "summary": "Penjelasan detail mengenai breakdown teknikal, struktur pasar, dan alasan di balik keputusan (2-3 paragraf). WAJIB BAHASA INDONESIA."
}
`;

const PROMPT_TEMPLATE_EN = `
You are a PROFESSIONAL CRYPTO TRADER who is completely OBJECTIVE and FREE FROM BIAS. Your task is to provide a strictly data-driven market analysis.

**CRITICAL INSTRUCTIONS:**
1. Output MUST be in **VALID JSON** (RFC 8259). Do not add markdown blocks like \`\`\`json.
2. NEVER output "N/A" or "NO SETUP". Always find the best opportunity even if it is "Wait & See".
3. Focus on Price Action and Market Structure.
4. **ANTI-BIAS (CRITICAL):**
   - DO NOT always output BUY. Analyze data HONESTLY.
   - If 24h change is negative, price is below open, and candles show sell pressure → market_structure MUST be "Bearish" and decision MUST be "SELL".
   - If price is making Lower Highs and Lower Lows → that is BEARISH, not Bullish.
   - If 24h change is negative and price is below open → consider SELL or WAIT, NOT BUY.
   - Only output BUY if there is strong technical confirmation (bounce from support, higher low, bullish reversal candle).
5. **DIRECTION RULES (MUST FOLLOW):**
   - First determine the current trend from OHLC data and price changes.
   - **If Bullish:** Primary (Trend Following) direction = "BUY", Alternative (Counter-Trend) direction = "SHORT"
   - **If Bearish:** Primary (Trend Following) direction = "SHORT", Alternative (Counter-Trend) direction = "BUY"
   - **If Ranging:** Pick the most technically sound direction for each plan.
   - The "direction" field is MANDATORY in every plan. It must be "BUY" or "SHORT".
6. **TAKE PROFIT:** Provide a minimum of 2 and maximum of 5 Take Profit levels. Only include as many TP levels as are technically valid.
7. **CONVICTION:** Conviction is NOT always 85%. Adjust between 40%-95% based on signal strength. Provide technical justification in "conviction_reason".

**LIVE MARKET DATA:**
- Pair: {{COIN_NAME}} ({{SYMBOL}}/USDT)
- Current Price: \${{PRICE}}
- 24h Change: {{CHANGE_24H}}%
- Market Cap: \${{MARKET_CAP}}
- 24h Volume: \${{VOLUME_24H}}

**OHLC DATA:**
{{MARKET_CTX}}

{{IMAGE_CONTEXT}}

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "decision": "BUY" | "SELL" | "WAIT",
  "risk_level": "Low" | "Medium" | "High" | "Extreme",
  "main_reason": "Short 1 sentence reason",
  "market_structure": {
      "structure": "Bullish" | "Bearish" | "Ranging",
      "key_support": "$xxx.xx",
      "key_resistance": "$xxx.xx"
  },
  "plans": [
    {
      "type": "Primary Setup",
      "direction": "BUY" or "SHORT",
      "entry_zone": "$xxx.xx - $xxx.xx",
      "stop_loss": "$xxx.xx",
      "take_profit_1": "$xxx.xx",
      "take_profit_2": "$xxx.xx",
      "take_profit_3": "$xxx.xx (optional)",
      "take_profit_4": "$xxx.xx (optional)",
      "take_profit_5": "$xxx.xx (optional)",
      "technical_reason": "Technical explanation for entry zone",
      "conviction": 40-95,
      "conviction_reason": "Technical justification for conviction %, e.g.: Based on 3 confirmations: bounce from $0.97 support, RSI oversold at 28, and 2x avg volume spike"
    },
    {
      "type": "Alternative Scenario",
      "direction": "SHORT" or "BUY" (opposite of Primary),
      "entry_zone": "$xxx.xx - $xxx.xx",
      "stop_loss": "$xxx.xx",
      "take_profit_1": "$xxx.xx",
      "take_profit_2": "$xxx.xx",
      "take_profit_3": "$xxx.xx (optional)",
      "take_profit_4": "$xxx.xx (optional)",
      "take_profit_5": "$xxx.xx (optional)",
      "technical_reason": "Technical explanation",
      "conviction": 30-70,
      "conviction_reason": "Technical justification for conviction %"
    }
  ],
  "summary": "Detailed technical breakdown explaining the market structure, price action, and reasoning (1-2 paragraphs)."
}
`;

function constructPrompt(templateId: string, templateEn: string, coin: any, market: any, ohlc: any[], hasImage: boolean, lang: 'id' | 'en', tradingStyle: string, timeframe: string) {
  const imageContext = hasImage ? "Note: User has uploaded a chart image. Please focus on visual pattern recognition from the image." : "";
  
  // Select Template
  const template = lang === 'id' ? templateId : templateEn;

  // Generate Market Context from OHLC
  let marketCtx = lang === 'id' ? "Data OHLC tidak tersedia." : "OHLC data unavailable.";
  if (ohlc && ohlc.length > 0) {
      const highs = ohlc.map((item: any) => item[2]);
      const lows = ohlc.map((item: any) => item[3]);
      const maxPrice = Math.max(...highs);
      const minPrice = Math.min(...lows);
      const openPrice = ohlc[0][1];
      const closePrice = ohlc[ohlc.length - 1][4];
      
      marketCtx = `
      - Open (24h ago): $${openPrice}
      - 24h High: $${maxPrice}
      - 24h Low: $${minPrice}
      - Close (Current): $${closePrice}
      
      Recent OHLC Data (H/L/C):
      ${ohlc.slice(-5).map((candle: any) => `- Candle: H:${candle[2]} L:${candle[3]} C:${candle[4]}`).join('\n')}
      `;
  }

  return template
    .replace(/{{COIN_NAME}}/g, coin.name)
    .replace(/{{SYMBOL}}/g, coin.symbol.toUpperCase())
    .replace(/{{PRICE}}/g, market?.usd?.toLocaleString() || '0')
    .replace(/{{CHANGE_24H}}/g, market?.usd_24h_change?.toFixed(2) || '0')
    .replace(/{{VOLUME_24H}}/g, market?.usd_24h_vol ? market.usd_24h_vol.toLocaleString() : 'N/A')
    .replace(/{{MARKET_CAP}}/g, market?.usd_market_cap ? market.usd_market_cap.toLocaleString() : 'N/A')
    .replace(/{{MARKET_CTX}}/g, marketCtx)
    .replace(/{{TRADING_STYLE}}/g, tradingStyle.toUpperCase())
    .replace(/{{TIMEFRAME}}/g, timeframe)
    .replace(/{{IMAGE_CONTEXT}}/g, imageContext);
}

export default function DashboardPage() {
  const router = useRouter(); 
  const { language, setLanguage, t } = useLanguage();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'chart' | 'analysis' | 'market'>('chart');
  
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
  
  // Multi-Slot AI Input State (v3 Style)
  const [aiSlots, setAiSlots] = useState<any[]>([]);
  const [aiLeverage, setAiLeverage] = useState('');
  const [aiModal, setAiModal] = useState('');
  
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
  
  // Build images array for AI: slots first (primary), then fallback to single selectedImage
  const buildImagesForAI = async (): Promise<string[]> => {
    // If AI slots contain images, use those (v3 multi-slot system)
    if (aiSlots.length > 0) {
        return aiSlots.map(s => s.base64);
    }
    // Fallback: single image upload (legacy)
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

        // Fetch Market Data
        let marketDataRaw = await fetchCoinGeckoData(selectedCoin.id);
        let marketData = { usd: 0, usd_24h_change: 0, usd_24h_vol: 0, usd_market_cap: 0 };
        let ohlcData: any[] = [];
        if (marketDataRaw && marketDataRaw.price) {
           marketData = marketDataRaw.price;
           ohlcData = marketDataRaw.ohlc || [];
        }

        // Prepare Images (multi-slot or single)
        const images = await buildImagesForAI();
        const hasImages = images.length > 0;
        const primaryImage = hasImages ? images[0] : undefined;

        // Construct Prompt
        let promptText = constructPrompt(PROMPT_TEMPLATE_ID, PROMPT_TEMPLATE_EN, selectedCoin, marketData, ohlcData, hasImages, language, tradingStyle, timeframe);

        // Inject slot metadata into prompt if multi-slot
        if (aiSlots.length > 0) {
            const slotSummary = aiSlots.map((s: any) => s.id).join(', ');
            promptText = `[PRIORITY: USER PROVIDED ${aiSlots.length} CHART IMAGES via Multi-Slot Analysis System. Slots: ${slotSummary}. Analyze ALL images comprehensively for ${selectedCoin.name} (${tradingStyle.toUpperCase()}).${aiLeverage ? ` Leverage: ${aiLeverage}.` : ''}${aiModal ? ` Capital: $${aiModal} USDT.` : ''}]\n\n` + promptText;
        } else if (selectedImage) {
            promptText = `[PRIORITY: ANALYZE THE UPLOADED CHART IMAGE FOR ${selectedCoin.name}. Focus on ${tradingStyle.toUpperCase()} setup.]\n\n` + promptText;
        }

        if (userPrompt.trim()) {
            promptText += `\n\n**ADDITIONAL USER INSTRUCTION:**\n${userPrompt}`;
        }

        let aiOutput = "";
        try {
            const apiRes = await askChatbot(promptText, primaryImage);
            if (apiRes && apiRes.analysis) {
                aiOutput = apiRes.analysis;
            } else {
                throw new Error("AI response missing analysis field");
            }
        } catch(e) { 
            console.error("AI Execution Error:", e);
            aiOutput = `### ⚠️ Analysis Failed`;
            toast.error("Failed to connect to AI. Please try again.");
        }

        const result = { analysis: aiOutput };
        setChatResult(result);
        
        if (aiOutput && !aiOutput.includes("Analysis Failed")) {
             await incrementUsage();
             await saveAnalysis(result, selectedCoin?.symbol, selectedCoin?.name);
             await fetchUsage();
             toast.success("Analysis Complete!");
             router.refresh();
        }

    } catch (e) {
        console.error("Critical Analysis Error:", e);
        toast.error("An unexpected error occurred while generating analysis.");
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
        
        {/* Language Toggler Moved to Layout */}
        <div />
      </div>
      
      {/* Market Intelligence Widgets */}
      <MarketIntelligence />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
        <button
            onClick={() => setActiveTab('chart')}
            className={clsx(
                "px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'chart' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <BarChart3 size={16} /> {t('tab_chart')}
        </button>
        <button
            onClick={() => setActiveTab('market')}
            className={clsx(
                "px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'market' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Radio size={16} /> Live Market
            <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">LIVE</span>
        </button>
        <button
            onClick={() => setActiveTab('analysis')}
            className={clsx(
                "px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'analysis' 
                    ? "border-neon text-neon" 
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Database size={16} /> {t('tab_analysis')}
        </button>
      </div>

      <div>

        {/* --- LIVE MARKET TAB --- */}
        {activeTab === 'market' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
                <LiveMarketTable
                    onSelectSymbol={(sym) => {
                        setChartSymbol(sym);
                        setChartSearchInput(sym);
                        setActiveTab('chart');
                    }}
                />
            </div>
        )}

        {/* --- CHART TAB --- */}
        <div className={clsx(
            "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
            activeTab === 'chart' ? "block" : "hidden",
            isChartFullscreen && "fixed inset-0 z-[200] bg-white dark:bg-slate-950 p-4 md:p-6 overflow-y-auto flex flex-col"
        )}>
            {/* Custom Search Bar for Chart */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-3 relative z-10">
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

                    {/* V3 Multi-Slot AI Input System */}
                    <AIInputSlots
                        coinName={selectedCoin.name}
                        leverage={aiLeverage}
                        modal={aiModal}
                        onLeverageChange={setAiLeverage}
                        onModalChange={setAiModal}
                        onSlotsChange={setAiSlots}
                        onReset={() => {
                            setAiSlots([]);
                            cleanAnalysis();
                        }}
                    />

                    {/* Analysis Controls Panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">

                            {/* Optional: Single image upload (if slots are empty) */}
                            {aiSlots.length === 0 && (
                                <div className="flex-1 lg:max-w-xs">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">
                                        {t('upload_label')} <span className="text-slate-400 font-normal">(Opsional — gunakan slot di atas)</span>
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
