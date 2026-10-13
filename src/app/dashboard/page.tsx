'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, Sparkles, BarChart3, Upload, X, MousePointerClick, Loader2, Search, FileText, AppWindow, Radio, Newspaper, ChevronDown, Star, Check, Plus, Trash2, RefreshCw } from 'lucide-react';
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
import { CONFIRMATION_TIMEFRAME, MAX_CONTEXT_CHARS, type AnalysisInput, type AnalysisV2, type Timeframe } from '@/lib/analysis/core';
import { getPreferences, savePreferences, type UserPreset } from './preferences/actions';
import LiveMarketTable from '@/components/LiveMarketTable';
import CryptoNews from '@/components/CryptoNews';
import { useLanguage } from '@/context/LanguageContext';



type ChartSuggestion = { symbol: string; exchange: string; description: string; type: string };

export default function DashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<'chart' | 'market' | 'news' | 'analysis'>('market');

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
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferenceAction, setPreferenceAction] = useState<string | null>(null);
  const [preferenceError, setPreferenceError] = useState('');
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activePresetName, setActivePresetName] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const copy = (id: string, en: string) => language === 'id' ? id : en;


  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const preferenceLock = useRef(false);
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


  const loadPreferences = useCallback(async () => {
      setPreferencesLoading(true);
      setPreferenceError('');
      try {
        const prefs = await getPreferences();
        if (prefs.error) throw new Error(prefs.error);
        setSavedPresets(prefs.presets ?? []);
        setWatchlist(prefs.watchlist ?? []);
        setAdminPresets((prefs.adminPresets ?? []) as Array<Record<string, string>>);
        setPreferencesReady(true);
      } catch (error) {
        setPreferenceError(error instanceof Error ? error.message : 'Preferensi gagal dimuat.');
      } finally {
        setPreferencesLoading(false);
      }
  }, []);

  useEffect(() => {
      void fetchUsage().catch(() => {});
      void loadPreferences();
  }, [loadPreferences]);

  // Loading Message Cycle
  useEffect(() => {
    if (!chatLoading) return;

    const messages = language === 'id'
      ? ['Menghubungkan data pasar…', 'Menyiapkan analisis AI…', 'Analisis masih diproses…', 'Menunggu hasil analisis…']
      : ['Connecting to market data…', 'Preparing AI analysis…', 'Analysis is still processing…', 'Waiting for the analysis result…'];
    let i = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
       i = Math.min(i + 1, messages.length - 1);
       setLoadingMessage(messages[i]);
    }, 5000);

    return () => clearInterval(interval);
  }, [chatLoading, language]);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  useEffect(() => {
    if (chatResult || analysisIssue) resultRef.current?.focus({ preventScroll: true });
  }, [chatResult, analysisIssue]);

  const fetchUsage = async () => {
      const stats = await getUserUsage();
      if (stats) setUsageStats(stats);
  };

  const handleCoinSelect = (coin: Coin) => {
      if (analysisInFlightRef.current) return;
      setSelectedCoin(coin);
      cleanAnalysis();
      setChatResult(null);
  };

  const applyPreset = (preset: UserPreset) => {
    if (analysisInFlightRef.current) return;
    setTradingStyle(preset.tradingStyle as typeof tradingStyle);
    setTimeframe(preset.timeframe);
    setRiskTolerance(preset.riskTolerance);
    setStrategyFocus(preset.strategyFocus);
    setIndicatorPref(preset.indicatorPref);
    setTargetRR(preset.targetRR);
    setMarketType(preset.marketType ?? 'futures');
    setDirectionPreference(preset.marketType === 'spot' && preset.directionPreference === 'short' ? 'auto' : preset.directionPreference ?? 'auto');
    setHigherTimeframeConfirmation(preset.higherTimeframeConfirmation ?? false);
    setActivePresetName(preset.name);
    toast.success(copy(`Preset ${preset.name} diterapkan.`, `Preset ${preset.name} applied.`));
  };

  const persistPreferences = async (presets: UserPreset[], favorites: string[], action: string, success: string) => {
    if (preferenceLock.current || !preferencesReady) return false;
    preferenceLock.current = true;
    setPreferenceAction(action);
    setPreferenceError('');
    try {
      const result = await savePreferences(presets, favorites);
      if (result.error) throw new Error(result.error);
      setSavedPresets(presets);
      setWatchlist(favorites);
      toast.success(success);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : copy('Preferensi gagal disimpan. Coba lagi.', 'Could not save preferences. Try again.');
      setPreferenceError(message);
      toast.error(message);
      return false;
    } finally {
      preferenceLock.current = false;
      setPreferenceAction(null);
    }
  };

  const saveCurrentPreset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = presetName.trim();
    if (name.length < 2 || name.length > 40) {
      setPreferenceError(copy('Nama preset harus 2–40 karakter.', 'Preset name must contain 2–40 characters.'));
      return;
    }
    if (savedPresets.some(preset => preset.name.toLowerCase() === name.toLowerCase())) {
      setPreferenceError(copy('Nama preset sudah dipakai. Gunakan nama lain.', 'This preset name is already used. Choose another name.'));
      return;
    }
    const next = [...savedPresets, { name, tradingStyle, timeframe,
      riskTolerance, strategyFocus, indicatorPref, targetRR, marketType, directionPreference, higherTimeframeConfirmation }];
    if (await persistPreferences(next, watchlist, 'save-preset', copy('Preset tersimpan.', 'Preset saved.'))) {
      setShowPresetForm(false);
      setPresetName('');
      setActivePresetName(name);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedCoin || preferenceLock.current) return;
    const symbol = selectedCoin.symbol.toUpperCase();
    const next = watchlist.includes(symbol) ? watchlist.filter((item) => item !== symbol) : [...watchlist, symbol];
    await persistPreferences(savedPresets, next, 'favorite', watchlist.includes(symbol)
      ? copy(`${symbol} dihapus dari favorit.`, `${symbol} removed from favorites.`)
      : copy(`${symbol} ditambahkan ke favorit.`, `${symbol} added to favorites.`));
  };

  const receiveImage = useCallback((file: File) => {
    if (analysisInFlightRef.current) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error(language === 'id' ? 'Gunakan gambar PNG, JPG, atau WebP maksimal 10 MB.' : 'Use a PNG, JPG, or WebP image up to 10 MB.');
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success(language === 'id' ? 'Gambar chart siap dianalisis.' : 'Chart image ready for analysis.');
  }, [language]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) receiveImage(file);
    e.target.value = '';
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
        if (activeTab !== 'analysis' || chatLoading || !selectedCoin) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    receiveImage(file);
                    break;
                }
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, chatLoading, selectedCoin, receiveImage]);

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
    if (!selectedCoin || analysisInFlightRef.current || preferenceLock.current) return;
    analysisInFlightRef.current = true;
    setChatLoading(true);
    setChatResult(null);
    setAnalysisIssue('');
    try {
      const image = selectedImage ? await compressImage(selectedImage) : undefined;
      const options = { symbol: selectedCoin.symbol.toUpperCase(), coinName: selectedCoin.name,
        language, tradingStyle, timeframe, riskTolerance, strategyFocus, indicatorPref, targetRR,
        marketType, directionPreference, higherTimeframeConfirmation,
        context: userPrompt.slice(0, MAX_CONTEXT_CHARS), image };
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
      // A usage refresh failure must not turn a completed analysis into an error.
      void fetchUsage().catch(() => {});
      toast.success(payload.result?.provenance?.kind === 'technical'
        ? copy('Rencana teknikal otomatis tersimpan.', 'Automatic technical plan saved.') : t('dash_toast_done'));
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
    <div className="terminal-workspace mx-auto pb-8 space-y-4">

      {/* Header */}
      <div className="terminal-workspace-heading">
        <div>
            <h1>{t('header_title')}</h1>
            <p>{t('header_subtitle')}</p>
        </div>
        <span className="terminal-section-code">WORKSPACE / 01</span>
      </div>

      {/* Market Intelligence Widgets */}
      <div className="terminal-market-strip"><MarketIntelligence /></div>

      {/* Tabs */}
      <div className="terminal-tabs flex overflow-x-auto no-scrollbar" role="tablist" aria-label={copy('Panel terminal', 'Terminal panels')}
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const panels = ['chart', 'market', 'news', 'analysis'] as const;
          const index = panels.indexOf(activeTab);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
          setActiveTab(panels[next]);
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}>
        <button
            id="terminal-tab-chart" role="tab" aria-controls="terminal-panel-chart" tabIndex={activeTab === 'chart' ? 0 : -1} aria-selected={activeTab === 'chart'}
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
            id="terminal-tab-market" role="tab" aria-controls="terminal-panel-market" tabIndex={activeTab === 'market' ? 0 : -1} aria-selected={activeTab === 'market'}
            onClick={() => setActiveTab('market')}
            className={clsx(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                activeTab === 'market'
                    ? "border-neon text-neon"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Radio size={15} /> {t('nav_market')}
            <span className="text-[11px] sm:text-[11px] font-black px-1 sm:px-1.5 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">LIVE</span>
        </button>
        <button
            id="terminal-tab-news" role="tab" aria-controls="terminal-panel-news" tabIndex={activeTab === 'news' ? 0 : -1} aria-selected={activeTab === 'news'}
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
            id="terminal-tab-analysis" role="tab" aria-controls="terminal-panel-analysis" tabIndex={activeTab === 'analysis' ? 0 : -1} aria-selected={activeTab === 'analysis'}
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
            <div id="terminal-panel-market" role="tabpanel" aria-labelledby="terminal-tab-market" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LiveMarketTable
                    onSelectSymbol={(sym) => {
                        ignoreSearchRef.current = true;
                        setChartSource('tradingview');
                        setChartSymbol(sym);
                        setChartSearchInput(sym);
                        setShowSuggestions(false);
                        setActiveTab('chart');
                    }}
                />
            </div>
        )}

        {/* --- NEWS TAB --- */}
        {activeTab === 'news' && (
            <div id="terminal-panel-news" role="tabpanel" aria-labelledby="terminal-tab-news" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CryptoNews />
            </div>
        )}

        {/* --- CHART TAB --- */}
        <div id="terminal-panel-chart" role="tabpanel" aria-labelledby="terminal-tab-chart" className={clsx(
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
                                            <span className="text-[12px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono truncate max-w-[80px]">{item.exchange}</span>
                                            <span className="text-[12px] text-slate-400 uppercase">{item.type}</span>
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
        <div id="terminal-panel-analysis" role="tabpanel" aria-labelledby="terminal-tab-analysis" className={clsx(
            "ux-panel terminal-analysis-tab space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
            activeTab === 'analysis' ? "block" : "hidden"
        )}>

            {/* 1. Coin Selector (CoinGecko Data) */}
            <CoinSelector
                selectedCoinId={selectedCoin?.id || ''}
                onSelect={handleCoinSelect}
                disabled={chatLoading}
            />
            {preferencesLoading && <p role="status" className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" />{copy('Memuat preset dan favorit…', 'Loading presets and favorites…')}</p>}
            {preferenceError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300"><p>{preferenceError}</p>
              {!preferencesReady && <button type="button" onClick={() => void loadPreferences()} disabled={preferencesLoading} className="ux-button mt-2 rounded-lg border border-rose-500/30 px-3 py-2">{copy('Coba lagi', 'Try again')}</button>}
            </div>}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {watchlist.map((symbol) => <button type="button" key={symbol} disabled={chatLoading} aria-pressed={selectedCoin?.symbol.toUpperCase() === symbol} onClick={() => handleCoinSelect({ id: symbol.toLowerCase(), symbol, name: symbol,
                image: '', current_price: 0, price_change_percentage_24h: 0 })} className={clsx('ux-button inline-flex items-center gap-1.5 rounded-full border border-neon px-3 py-1.5 text-neon', selectedCoin?.symbol.toUpperCase() === symbol && 'bg-neon/10')}><Star size={14} fill="currentColor" />{symbol}</button>)}
              {selectedCoin && <button type="button" onClick={toggleFavorite} disabled={!preferencesReady || !!preferenceAction || chatLoading || (watchlist.length >= 20 && !watchlist.includes(selectedCoin.symbol.toUpperCase()))}
                aria-busy={preferenceAction === 'favorite'} aria-pressed={watchlist.includes(selectedCoin.symbol.toUpperCase())} className="ux-button inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                {preferenceAction === 'favorite' ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} className="text-neon" fill={watchlist.includes(selectedCoin.symbol.toUpperCase()) ? 'currentColor' : 'none'} />}
                {preferenceAction === 'favorite' ? copy('Menyimpan…', 'Saving…') : watchlist.includes(selectedCoin.symbol.toUpperCase()) ? copy('Hapus favorit', 'Remove favorite') : copy('Tambah favorit', 'Add favorite')}
              </button>}
            </div>

            {selectedCoin ? (
                <div className="terminal-analysis-grid">
                  <div className="terminal-input-panel space-y-4">
                    <h2 className="terminal-panel-heading">{copy('Input Analisis', 'Analysis Input')} · {selectedCoin.symbol.toUpperCase()}/USDT</h2>

                    {/* INSTRUCTIONS BLOCK */}
                    <details className="border border-slate-700 p-3 text-sm">
                      <summary className="cursor-pointer text-neon font-semibold">{t('ai_instr_title')}</summary>
                      <div className="mt-3 flex gap-3">
                        <div className="text-neon">
                            <FileText size={18} />
                        </div>
                        <div className="space-y-2">
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>{t('ai_instr_1')}</li>
                                <li>{t('ai_instr_2')}</li>
                                <li>{t('ai_instr_3')}</li>
                            </ul>
                        </div>
                      </div>
                    </details>

                    {/* Analysis Controls Panel */}
                    <fieldset disabled={chatLoading} className="terminal-controls min-w-0 space-y-4">
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                          <span className="font-bold">Preset:</span>
                          {adminPresets.map((preset) => <button type="button" key={preset.code} aria-pressed={activePresetName === preset.name_id} onClick={() => applyPreset({
                            name: preset.name_id, tradingStyle: preset.trading_style, timeframe: preset.timeframe,
                            riskTolerance: preset.risk_tolerance, strategyFocus: preset.strategy_focus,
                            indicatorPref: preset.indicator_pref, targetRR: preset.target_rr,
                          })} className={clsx('ux-button inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2', activePresetName === preset.name_id && 'border-neon bg-neon/10 text-neon')}>{activePresetName === preset.name_id && <Check size={14} />}{language === 'en' ? preset.name_en : preset.name_id}</button>)}
                          {savedPresets.map((preset, index) => <div key={`${preset.name}-${index}`} className="flex rounded-lg border border-neon text-neon">
                            <button type="button" aria-pressed={activePresetName === preset.name} onClick={() => applyPreset(preset)} className={clsx('ux-button inline-flex items-center gap-1.5 rounded-l-lg px-3 py-2', activePresetName === preset.name && 'bg-neon/10')}>{activePresetName === preset.name && <Check size={14} />}{preset.name}</button>
                            <button type="button" disabled={!!preferenceAction || !preferencesReady} aria-label={copy(`Hapus preset ${preset.name}`, `Delete preset ${preset.name}`)} className="ux-button px-2 border-l border-neon rounded-r-lg" onClick={async () => {
                              const next = savedPresets.filter((_, position) => position !== index);
                              if (await persistPreferences(next, watchlist, `delete-${index}`, copy('Preset dihapus.', 'Preset deleted.')) && activePresetName === preset.name) setActivePresetName('');
                            }}>{preferenceAction === `delete-${index}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                          </div>)}
                          <button type="button" onClick={() => setShowPresetForm(!showPresetForm)} disabled={!!preferenceAction || !preferencesReady || savedPresets.length >= 5}
                            aria-expanded={showPresetForm} aria-controls="preset-name-form" className="ux-button inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"><Plus size={14} />{copy('Simpan pilihan', 'Save selection')}</button>
                        </div>
                        {savedPresets.length >= 5 && <p className="text-xs text-slate-500">{copy('Maksimal 5 preset. Hapus salah satu untuk menyimpan pilihan baru.', 'You can save up to 5 presets. Remove one to save a new selection.')}</p>}
                        {showPresetForm && <form id="preset-name-form" onSubmit={saveCurrentPreset} className="flex flex-wrap items-end gap-2 rounded-xl border border-neon/30 bg-neon/5 p-3">
                          <label className="flex-1 min-w-40 text-xs font-semibold">{copy('Nama preset', 'Preset name')}
                            <input autoFocus required minLength={2} maxLength={40} value={presetName} onChange={event => setPresetName(event.target.value)} disabled={!!preferenceAction}
                              placeholder={copy('Contoh: Swing konservatif', 'Example: Conservative swing')} className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-sm" />
                          </label>
                          <button type="submit" disabled={!!preferenceAction || presetName.trim().length < 2} className="inline-flex items-center gap-2 rounded-lg bg-neon px-3 py-2 font-semibold text-white dark:text-slate-950 hover:bg-neon-dim">
                            {preferenceAction === 'save-preset' && <Loader2 size={14} className="animate-spin" />}{preferenceAction === 'save-preset' ? copy('Menyimpan…', 'Saving…') : copy('Simpan', 'Save')}
                          </button>
                          <button type="button" disabled={!!preferenceAction} onClick={() => setShowPresetForm(false)} className="ux-button rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">{copy('Batal', 'Cancel')}</button>
                        </form>}

                        {/* Row 1: Image & Context */}
                        <div className="terminal-upload-context flex flex-col gap-3">
                            {/* Single image upload */}
                            <div className="flex-1 lg:max-w-xs">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">
                                    {t('upload_label')} <span className="text-slate-400 font-normal">({t('feedback_optional')})</span>
                                </label>
                                {!imagePreview ? (
                                    <button type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={event => { event.preventDefault(); if (!chatLoading) setIsDraggingImage(true); }}
                                        onDragLeave={() => setIsDraggingImage(false)}
                                        onDrop={event => { event.preventDefault(); setIsDraggingImage(false); const file = event.dataTransfer.files[0]; if (file) receiveImage(file); }}
                                        className={clsx('w-full text-left border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 gap-3 cursor-pointer hover:border-neon hover:bg-neon/5 transition-all text-slate-400 group h-32', isDraggingImage && 'border-neon bg-neon/10')}
                                    >
                                        <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                        <div>
                                            <p className="font-bold text-sm">{t('upload_text')}</p>
                                            <p className="text-[12px] opacity-70">{t('dash_paste_label')}</p>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group h-32">
                                        <img src={imagePreview} alt="Chart" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button type="button" onClick={cleanAnalysis} aria-label={copy('Hapus gambar chart', 'Remove chart image')} className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp" className="hidden" />
                                <p className="mt-1.5 text-[12px] text-slate-400">PNG, JPG, WebP · {copy('maks. 10 MB · bisa tarik & lepas', 'max. 10 MB · drag & drop supported')}</p>
                            </div>

                            {/* Custom Instruction */}
                            <div className="flex-1">
                                <label htmlFor="analysis-context" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1">{t('context_label')}</label>
                                <div className="relative">
                                    <textarea
                                        id="analysis-context"
                                        maxLength={MAX_CONTEXT_CHARS}
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                        placeholder={t('context_placeholder')}
                                        className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all resize-none text-foreground"
                                    />
                                    <span className="absolute bottom-3 right-3 text-[12px] text-slate-400">{userPrompt.length}/{MAX_CONTEXT_CHARS}</span>
                                </div>
                            </div>
                        </div>

                        <button type="button" onClick={() => setAdvancedMode(!advancedMode)}
                          aria-expanded={advancedMode} aria-controls="advanced-analysis-settings" className="ux-button flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-bold text-neon-dark dark:text-neon text-left">
                          <ChevronDown size={16} className={clsx('transition-transform', advancedMode && 'rotate-180')} />{advancedMode ? copy('Sembunyikan pengaturan lanjut', 'Hide advanced settings') : copy('Tampilkan pengaturan lanjut', 'Show advanced settings')}
                        </button>
                        {!advancedMode && <p className="text-xs text-slate-500">{tradingStyle} · {timeframe} · {riskTolerance} · {targetRR} · {marketType} · {directionPreference === 'auto' ? t('ai_direction_auto') : directionPreference.toUpperCase()}{higherTimeframeConfirmation ? ` · ${t('ai_confirmation_label')} ${CONFIRMATION_TIMEFRAME[timeframe as Timeframe]}` : ''}</p>}
                        {/* Row 2: Advanced AI Parameters (Grid) */}
                        <div id="advanced-analysis-settings" onChange={() => setActivePresetName('')} className={clsx("grid grid-cols-2 gap-3", !advancedMode && 'hidden')}>
                            <div>
                              <label htmlFor="ai-market-type" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_market_type')}</label>
                              <select id="ai-market-type" value={marketType} onChange={(e) => {
                                const next = e.target.value as AnalysisInput['marketType'];
                                setMarketType(next);
                                if (next === 'spot' && directionPreference === 'short') setDirectionPreference('auto');
                              }} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="futures">Futures</option><option value="spot">Spot</option>
                              </select>
                              <p className="text-[12px] text-slate-400 mt-1.5">{t('ai_market_type_hint')}</p>
                            </div>
                            <div>
                              <label htmlFor="ai-direction" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_direction_label')}</label>
                              <select id="ai-direction" value={directionPreference} onChange={(e) => setDirectionPreference(e.target.value as AnalysisInput['directionPreference'])}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="auto">{t('ai_direction_auto')}</option>
                                <option value="long">{t('ai_direction_long')}</option>
                                <option value="short" disabled={marketType === 'spot'}>{t('ai_direction_short')}</option>
                              </select>
                              <p className="text-[12px] text-slate-400 mt-1.5">{t('ai_direction_hint')}</p>
                            </div>
                            <div>
                              <label htmlFor="ai-confirmation" className="block text-xs font-bold text-slate-500 mb-1">{t('ai_confirmation_label')}</label>
                              <select id="ai-confirmation" value={higherTimeframeConfirmation ? 'on' : 'off'} onChange={(e) => setHigherTimeframeConfirmation(e.target.value === 'on')}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm font-bold">
                                <option value="off">{t('ai_confirmation_off')}</option>
                                <option value="on">{t('ai_confirmation_on')} · {CONFIRMATION_TIMEFRAME[timeframe as Timeframe]}</option>
                              </select>
                              <p className="text-[12px] text-slate-400 mt-1.5">{t('ai_confirmation_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_style_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_tf_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_risk_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_strategy_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_indicator_hint')}</p>
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
                                <p className="text-[12px] text-slate-400 mt-1.5 pl-1 leading-relaxed">{t('dash_rr_hint')}</p>
                            </div>
                        </div>

                        {/* Row 3: Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={runAnalysis}
                                disabled={chatLoading || !!preferenceAction}
                                aria-busy={chatLoading}
                                className="terminal-run-button w-full h-12 font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all group relative overflow-hidden"
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
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">{copy(
                              '1 kuota untuk 1 laporan tersimpan. Jika AI bermasalah, Anda tetap mendapat rencana teknikal otomatis dengan Entry, SL, dan TP. Membuka riwayat tidak menggunakan kuota.',
                              '1 credit for 1 saved report. If AI is unavailable, you still receive an automatic technical plan with Entry, SL and TP. Opening history uses no credit.')}</p>
                        </div>
                    </fieldset>
                  </div>
                  <div className="min-w-0 space-y-4">
                    {/* --- ANALYSIS RESULTS --- */}
                    {!chatResult && !chatLoading && !analysisIssue && <div className="terminal-result-empty">
                      <BarChart3 size={36} className="text-neon" aria-hidden="true" />
                      <h2>{copy('Rencana berikutnya dimulai di sini.', 'Your next plan starts here.')}</h2>
                      <p>{copy('Atur pilihan di panel input, lalu jalankan analisis untuk melihat Entry, SL, TP dan pertimbangan pasar.', 'Choose your settings in the input panel, then run an analysis for Entry, SL, TP and market reasoning.')}</p>
                      <div className="terminal-empty-levels" aria-hidden="true">{['ENTRY', 'STOP LOSS', 'TAKE PROFIT 1', 'TAKE PROFIT 2'].map(label => <div key={label}>{label}<strong>—</strong></div>)}</div>
                    </div>}
                    {chatLoading && <div role="status" aria-live="polite" className="rounded-2xl border border-neon/30 bg-neon/5 p-5 space-y-3">
                      <p className="flex items-center gap-2 font-semibold text-neon"><Loader2 size={18} className="animate-spin" />{loadingMessage}</p>
                      <p className="text-sm text-slate-500">{copy('Pilihan dikunci selama analisis berjalan. Hasil akan muncul di bawah setelah selesai.', 'Selections are locked while analysis runs. Your result will appear below when ready.')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-hidden="true">{[0,1,2,3].map(item => <div key={item} className="h-16 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />)}</div>
                    </div>}
                    {analysisIssue && <div ref={resultRef} tabIndex={-1} role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                      <h2 className="text-xl font-black text-amber-600">{copy('Analisis belum selesai', 'Analysis could not complete')}</h2><p className="mt-2">{analysisIssue}</p>
                      <p className="text-sm text-slate-500 mt-2">{copy('Periksa pilihan atau coba kembali saat data tersedia.', 'Check your selections or try again when data is available.')}</p>
                      <button type="button" disabled={chatLoading} onClick={runAnalysis} className="ux-button mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-4 py-2 text-sm font-semibold"><RefreshCw size={16} />{copy('Coba lagi', 'Try again')}</button>
                    </div>}
                    {chatResult && (
                        <div ref={resultRef} tabIndex={-1} role="region" aria-label={copy('Hasil analisis AI', 'AI analysis result')} className="terminal-result-panel overflow-hidden">
                            {/* Replaced Text Header with just the new component which handles its own UI */}

                            <div className="p-4 md:p-6">
                                <AnalysisResultV2 result={chatResult} coinName={chatResult.market.symbol} />
                            </div>
                        </div>
                    )}
                    <SentimentChart symbol={selectedCoin.symbol} />
                  </div>
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
