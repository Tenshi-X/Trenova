'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Database, Sparkles, TrendingUp, BarChart3, Upload, X, MousePointerClick, Loader2, Search, FileText, AppWindow, Radio, Newspaper, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { getUserUsage, searchTVSymbols } from './actions';
import { Lock, ArrowRight } from 'lucide-react';
import CoinSelector, { Coin } from '@/components/CoinSelector';
import CoinGeckoChart from '@/components/CoinGeckoChart';
import TradingViewWidget from '@/components/TradingViewWidget';
import SentimentChart from '@/components/SentimentChart';
import MarketIntelligence from '@/components/MarketIntelligence';
import AnalysisResultV2 from '@/components/AnalysisResultV2';
import { CONFIRMATION_TIMEFRAME, type AnalysisInput, type AnalysisV2, type Timeframe } from '@/lib/analysis/core';
import { getPreferences, savePreferences, type UserPreset } from './preferences/actions';
import LiveMarketTable from '@/components/LiveMarketTable';
import CryptoNews from '@/components/CryptoNews';
import { useLanguage } from '@/context/LanguageContext';



type ChartSuggestion = { symbol: string; exchange: string; description: string; type: string };

export default function DashboardPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<'chart' | 'market' | 'news' | 'analysis'>('chart');

  // Chart Tab State
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartSearchInput, setChartSearchInput] = useState('');
  const [chartSuggestions, setChartSuggestions] = useState<ChartSuggestion[]>([]);
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
  const [riskTolerance, setRiskTolerance] = useState('Medium Risk');
  const [strategyFocus, setStrategyFocus] = useState('All-Round');
  const [indicatorPref, setIndicatorPref] = useState('Default');
  const [targetRR, setTargetRR] = useState('1:2');
  const [marketType, setMarketType] = useState<AnalysisInput['marketType']>('futures');
  const [directionPreference, setDirectionPreference] = useState<AnalysisInput['directionPreference']>('auto');
  const [higherTimeframeConfirmation, setHigherTimeframeConfirmation] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI...");
  const [chatResult, setChatResult] = useState<AnalysisV2 | null>(null);
  const [analysisIssue, setAnalysisIssue] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [savedPresets, setSavedPresets] = useState<UserPreset[]>([]);
  const [adminPresets, setAdminPresets] = useState<Array<Record<string, string>>>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisInFlightRef = useRef(false);
  const pendingAnalysisRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const ignoreSearchRef = useRef(false);

  // Usage Stats State
  const [usageStats, setUsageStats] = useState<Awaited<ReturnType<typeof getUserUsage>>>(null);
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

  const selectChartSymbol = (item: ChartSuggestion) => {
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
      getPreferences().then((prefs) => {
        if (prefs.error) return;
        setSavedPresets(prefs.presets ?? []);
        setWatchlist(prefs.watchlist ?? []);
        setAdminPresets((prefs.adminPresets ?? []) as Array<Record<string, string>>);
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

  const applyPreset = (preset: UserPreset) => {
    setTradingStyle(preset.tradingStyle as typeof tradingStyle);
    setTimeframe(preset.timeframe);
    setRiskTolerance(preset.riskTolerance);
    setStrategyFocus(preset.strategyFocus);
    setIndicatorPref(preset.indicatorPref);
    setTargetRR(preset.targetRR);
    setMarketType(preset.marketType ?? 'futures');
    setDirectionPreference(preset.marketType === 'spot' && preset.directionPreference === 'short' ? 'auto' : preset.directionPreference ?? 'auto');
    setHigherTimeframeConfirmation(preset.higherTimeframeConfirmation ?? false);
  };

  const saveCurrentPreset = async () => {
    const name = window.prompt('Nama preset (2–40 karakter):');
    if (!name) return;
    const next = [...savedPresets, { name: name.trim(), tradingStyle, timeframe,
      riskTolerance, strategyFocus, indicatorPref, targetRR, marketType, directionPreference, higherTimeframeConfirmation }];
    const result = await savePreferences(next, watchlist);
    if (result.error) toast.error(result.error);
    else { setSavedPresets(next); toast.success('Preset tersimpan.'); }
  };

  const toggleFavorite = async () => {
    if (!selectedCoin) return;
    const symbol = selectedCoin.symbol.toUpperCase();
    const next = watchlist.includes(symbol) ? watchlist.filter((item) => item !== symbol) : [...watchlist, symbol];
    const result = await savePreferences(savedPresets, next);
    if (result.error) toast.error(result.error);
    else setWatchlist(next);
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
    setAnalysisIssue('');
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
             resolve(event.target?.result as string);
             return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = error => reject(error);
    });
  };

  const runAnalysis = async () => {
    if (!selectedCoin || analysisInFlightRef.current) return;
    analysisInFlightRef.current = true;
    setChatLoading(true);
    setChatResult(null);
    setAnalysisIssue('');
    try {
      const image = selectedImage ? await compressImage(selectedImage) : undefined;
      const options = { symbol: selectedCoin.symbol.toUpperCase(), coinName: selectedCoin.name,
        language, tradingStyle, timeframe, riskTolerance, strategyFocus, indicatorPref, targetRR,
        marketType, directionPreference, higherTimeframeConfirmation,
        context: userPrompt.slice(0,400), image };
      const fingerprint = JSON.stringify(options);
      if (pendingAnalysisRef.current?.fingerprint !== fingerprint) {
        pendingAnalysisRef.current = { fingerprint, key: crypto.randomUUID() };
      }
      const res = await fetch('/api/dashboard/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...options, requestKey: pendingAnalysisRef.current.key }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status !== 409) pendingAnalysisRef.current = null;
        throw new Error(payload.error || `Analisis gagal (${res.status}).`);
      }
      pendingAnalysisRef.current = null;
      setChatResult(payload.result as AnalysisV2);
      await fetchUsage();
      toast.success(payload.charged === false ? 'Hasil belum tervalidasi; kuota dikembalikan.' : t('dash_toast_done'));
      router.refresh();
    } catch (error) {
      setAnalysisIssue(error instanceof Error ? error.message : t('dash_toast_fail'));
      toast.error(error instanceof Error ? error.message : t('dash_toast_fail'));
    } finally {
      analysisInFlightRef.current = false;
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
            <Radio size={15} /> {t('nav_market')}
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
            <Newspaper size={15} /> {t('nav_news')}
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

      {usageStats?.isRestricted ? (
        <div className="animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto mt-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{t('dash_limit_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                {t('dash_limit_desc')}
            </p>
            <Link
                href="/#pricing"
                className="inline-flex items-center gap-3 px-8 py-4 bg-neon text-white font-bold rounded-xl shadow-lg hover:shadow-neon/50 hover:-translate-y-1 transition-all"
            >
                {t('dash_limit_btn')} <ArrowRight size={20} />
            </Link>
            <p className="text-xs text-slate-400 mt-6">
                {t('dash_limit_desc')}
            </p>
        </div>
      ) : (
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
                    onAnalyzeSymbol={(symbol) => {
                        handleCoinSelect({ id: symbol.toLowerCase(), symbol, name: symbol,
                          image: '', current_price: 0, price_change_percentage_24h: 0 });
                        setActiveTab('analysis');
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
                           {chartSuggestions.map((item: ChartSuggestion) => (
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
                                        {t('dash_view_chart')}
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
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {watchlist.map((symbol) => <button key={symbol} onClick={() => handleCoinSelect({ id: symbol.toLowerCase(), symbol, name: symbol,
                image: '', current_price: 0, price_change_percentage_24h: 0 })} className="rounded-full border border-neon px-3 py-1 text-neon">★ {symbol}</button>)}
              {selectedCoin && <button onClick={toggleFavorite} className="rounded-full border px-3 py-1">
                {watchlist.includes(selectedCoin.symbol.toUpperCase()) ? 'Hapus favorit' : '☆ Tambah favorit'}
              </button>}
            </div>

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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors space-y-4 sm:space-y-6">
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                          <span className="font-bold">Preset:</span>
                          {adminPresets.map((preset) => <button key={preset.code} onClick={() => applyPreset({
                            name: preset.name_id, tradingStyle: preset.trading_style, timeframe: preset.timeframe,
                            riskTolerance: preset.risk_tolerance, strategyFocus: preset.strategy_focus,
                            indicatorPref: preset.indicator_pref, targetRR: preset.target_rr,
                          })} className="rounded-lg border px-3 py-1">{language === 'en' ? preset.name_en : preset.name_id}</button>)}
                          {savedPresets.map((preset, index) => <div key={`${preset.name}-${index}`} className="flex rounded-lg border border-neon text-neon">
                            <button onClick={() => applyPreset(preset)} className="px-3 py-1">{preset.name}</button>
                            <button aria-label={`Hapus preset ${preset.name}`} className="px-2 border-l border-neon" onClick={async () => {
                              const next = savedPresets.filter((_, position) => position !== index);
                              const result = await savePreferences(next,watchlist);
                              if (result.error) toast.error(result.error); else setSavedPresets(next);
                            }}>×</button>
                          </div>)}
                          <button onClick={saveCurrentPreset} className="rounded-lg border px-3 py-1">+ Simpan pilihan</button>
                        </div>

                        {/* Row 1: Image & Context */}
                        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                            {/* Single image upload */}
                            <div className="flex-1 lg:max-w-xs">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">
                                    {t('upload_label')} <span className="text-slate-400 font-normal">({t('feedback_optional')})</span>
                                </label>
                                {!imagePreview ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 gap-3 cursor-pointer hover:border-neon hover:bg-neon/5 transition-all text-slate-400 group h-32"
                                    >
                                        <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                        <div>
                                            <p className="font-bold text-sm">{t('upload_text')}</p>
                                            <p className="text-[10px] opacity-70">{t('dash_paste_label')}</p>
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group h-32">
                                        <img src={imagePreview} alt="Chart" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button onClick={cleanAnalysis} className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md">
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
                                        maxLength={400}
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                        placeholder={t('context_placeholder')}
                                        className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all resize-none text-foreground"
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="button" onClick={() => setAdvancedMode(!advancedMode)}
                          className="text-sm font-bold text-neon-dark dark:text-neon text-left">
                          {advancedMode ? 'Sembunyikan pengaturan lanjut' : 'Tampilkan pengaturan lanjut'}
                        </button>
                        {!advancedMode && <p className="text-xs text-slate-500">{tradingStyle} · {timeframe} · {riskTolerance} · {targetRR} · {marketType} · {directionPreference === 'auto' ? t('ai_direction_auto') : directionPreference.toUpperCase()}{higherTimeframeConfirmation ? ` · ${t('ai_confirmation_label')} ${CONFIRMATION_TIMEFRAME[timeframe as Timeframe]}` : ''}</p>}
                        {/* Row 2: Advanced AI Parameters (Grid) */}
                        <div className={clsx("grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4", !advancedMode && 'hidden')}>
                            <div>
                              <label htmlFor="ai-market-type" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_market_type')}</label>
                              <select id="ai-market-type" value={marketType} onChange={(e) => {
                                const next = e.target.value as AnalysisInput['marketType'];
                                setMarketType(next);
                                if (next === 'spot' && directionPreference === 'short') setDirectionPreference('auto');
                              }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="futures">Futures</option><option value="spot">Spot</option>
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1.5">{t('ai_market_type_hint')}</p>
                            </div>
                            <div>
                              <label htmlFor="ai-direction" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_direction_label')}</label>
                              <select id="ai-direction" value={directionPreference} onChange={(e) => setDirectionPreference(e.target.value as AnalysisInput['directionPreference'])}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="auto">{t('ai_direction_auto')}</option>
                                <option value="long">{t('ai_direction_long')}</option>
                                <option value="short" disabled={marketType === 'spot'}>{t('ai_direction_short')}</option>
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1.5">{t('ai_direction_hint')}</p>
                            </div>
                            <div>
                              <label htmlFor="ai-confirmation" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_confirmation_label')}</label>
                              <select id="ai-confirmation" value={higherTimeframeConfirmation ? 'on' : 'off'} onChange={(e) => setHigherTimeframeConfirmation(e.target.value === 'on')}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="off">{t('ai_confirmation_off')}</option>
                                <option value="on">{t('ai_confirmation_on')} · {CONFIRMATION_TIMEFRAME[timeframe as Timeframe]}</option>
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1.5">{t('ai_confirmation_hint')}</p>
                            </div>
                            {/* Trading Style Dropdown */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">{t('style_label')}</label>
                                <div className="relative">
                                    <select
                                        value={tradingStyle}
                                        onChange={(e) => setTradingStyle(e.target.value as typeof tradingStyle)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="scalping">⚡ {t('style_scalping')}</option>
                                        <option value="intraday">📅 {t('style_intraday')}</option>
                                        <option value="swing">🌊 {t('style_swing')}</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_style_hint')}</p>
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
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_tf_hint')}</p>
                            </div>

                            {/* Risk Tolerance */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">Risk Tolerance</label>
                                <div className="relative">
                                    <select
                                        value={riskTolerance}
                                        onChange={(e) => setRiskTolerance(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="Low Risk">🛡️ Low</option>
                                        <option value="Medium Risk">⚖️ Medium</option>
                                        <option value="High Risk">🔥 High</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_risk_hint')}</p>
                            </div>

                            {/* Strategy Focus */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">Strategy Focus</label>
                                <div className="relative">
                                    <select
                                        value={strategyFocus}
                                        onChange={(e) => setStrategyFocus(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="All-Round">🎯 All-Round</option>
                                        <option value="Breakout">🚀 Breakout</option>
                                        <option value="Trend Following">🌊 Trend Foll.</option>
                                        <option value="Mean Reversion">🔄 Mean Rev.</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_strategy_hint')}</p>
                            </div>

                            {/* Indicator Preference */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">Indicator Focus</label>
                                <div className="relative">
                                    <select
                                        value={indicatorPref}
                                        onChange={(e) => setIndicatorPref(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="Default">📊 Default</option>
                                        <option value="Price Action Only">🕯️ Price Act.</option>
                                        <option value="Momentum">📈 Momentum</option>
                                        <option value="Moving Averages">➰ M. Averages</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_indicator_hint')}</p>
                            </div>

                            {/* Target Risk/Reward */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 pl-1">Min Target R:R</label>
                                <div className="relative">
                                    <select
                                        value={targetRR}
                                        onChange={(e) => setTargetRR(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="1:2">🏆 Min 1:2</option>
                                        <option value="1:3">💎 Min 1:3</option>
                                        <option value="1:4">👑 Min 1:4</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_rr_hint')}</p>
                            </div>
                        </div>

                        {/* Row 3: Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={runAnalysis}
                                disabled={chatLoading}
                                className="w-full h-14 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 rounded-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all group border border-transparent dark:border-slate-700 relative overflow-hidden"
                            >
                                {chatLoading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 text-neon" />
                                        <span className="animate-pulse">{loadingMessage}</span>
                                        <div className="absolute bottom-0 left-0 h-1 bg-neon/50 w-full animate-[pulse_2s_ease-in-out_infinite]" />
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-neon group-hover:scale-110 transition-transform" />
                                        <span>{t('generate_btn')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>



                    {/* --- ANALYSIS RESULTS --- */}
                    {analysisIssue && <div role="status" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                      <h2 className="text-xl font-black text-amber-600">WAIT</h2><p className="mt-2">{analysisIssue}</p>
                      <p className="text-sm text-slate-500 mt-2">Belum ada setup tervalidasi. Periksa pilihan dan tunggu data/pelayanan tersedia sebelum mencoba kembali.</p>
                    </div>}
                    {chatResult && (
                        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 transition-colors">
                            {/* Replaced Text Header with just the new component which handles its own UI */}

                            <div className="p-4 md:p-6">
                                <AnalysisResultV2 result={chatResult} coinName={chatResult.market.symbol} />
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
      )}
    </div>
  );
}
