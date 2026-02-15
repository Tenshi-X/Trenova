'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAnalysisHistory, AnalysisRecord } from '@/lib/api';
import { Clock, Loader2, ArrowLeft, FileText, ChevronDown, ChevronRight, Search, X, Database, Calendar, ChevronLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import AnalysisVisualizer from '@/components/AnalysisVisualizer';
import DateFilter from '@/components/DateFilter';


import { useLanguage } from '@/context/LanguageContext';

// Helper to sanitize and format content
const formatContent = (content: any) => {
    if (typeof content === 'string') return content;
    return content?.analysis || JSON.stringify(content);
};

// Helper: Extract coin name for searching purposes
const extractCoinInfo = (content: string) : string => {
    const match = content.match(/:\s*([A-Za-z0-9\s]+?)(?:\(|$|\n)/); 
    // Matches "Price Forecast: Bitcoin (", "Risk Assessment: Solana" etc.
    if (match && match[1]) return match[1].trim();
    // Fallback: Try to find "Analysis for X"
    const match2 = content.match(/Analysis for\s+([A-Za-z0-9\s]+)/);
    if (match2 && match2[1]) return match2[1].trim();
    
    return "";
};

// Helper: Smart preview extraction that handles Markdown and JSON
const getPreviewText = (content: string, language: 'en' | 'id') => {
    if (!content) return "";
    
    try {
        // 1. Try to clean markdown code blocks if present
        const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
        
        // 2. Try parsing as JSON if it looks like an object
        if (cleanContent.startsWith('{')) {
            const json = JSON.parse(cleanContent);
            // Return main reason (Indonesian/English) or summary
            // If the JSON structure supports language keys in future, use them.
            // For now, it seems standard structure.
            return json.main_reason || json.summary || json.decision || "Click to view full analysis";
        }
    } catch (e) {
        // Not valid JSON, ignore and drop to fallback
    }

    // Fallback: cleaning markdown symbols for plain text preview
    return content.replace(/[#*`]/g, '').slice(0, 200);
};

export default function HistoryPage() {
    const { t, language } = useLanguage(); // Use language context
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    
    // Date & Pagination State
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateRange, itemsPerPage]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getAnalysisHistory();
            setHistory(data);
            setLoading(false);
        }
        load();
    }, []);

    // Derived Data: Filtered history
    const filteredHistory = useMemo(() => {
        return history.filter(record => {
            const content = formatContent(record.analysis);
            
            // Priority: Explicit DB Coin Name -> DB Symbol -> Regex Extraction
            const dbCoinName = record.coin_name || record.coin_symbol || "";
            const derivedCoinName = extractCoinInfo(content);
            
            const coinInfo = (dbCoinName || derivedCoinName).toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            // Check Search Term
            if (searchTerm) {
                const matchesContent = content.toLowerCase().includes(searchLower);
                const matchesCoin = coinInfo.includes(searchLower);
                
                // Add Date Search Capability (e.g. "15 Feb", "February", "2024")
                const dateObj = new Date(record.created_at);
                const dateStrEn = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase(); 
                const dateStrId = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase(); 
                const matchesDate = dateStrEn.includes(searchLower) || dateStrId.includes(searchLower);

                if (!matchesContent && !matchesCoin && !matchesDate) return false;
            }

            // Check Date Range Filter
            if (dateRange.start || dateRange.end) {
                const recordDate = new Date(record.created_at);
                // Reset time part for date-only comparison
                recordDate.setHours(0, 0, 0, 0);

                if (dateRange.start) {
                    const startDate = new Date(dateRange.start);
                    startDate.setHours(0, 0, 0, 0);
                    if (recordDate < startDate) return false;
                }

                if (dateRange.end) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999); // Inclusive end date
                    if (recordDate > endDate) return false;
                }
            }

            return true;
        });
    }, [history, searchTerm, dateRange]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredHistory.slice(start, start + itemsPerPage);
    }, [filteredHistory, currentPage, itemsPerPage]);

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 px-4 md:px-0">
            {/* ... (Header remains same) ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            <Clock className="text-neon" /> {t('history_title')}
                        </h1>
                        <p className="text-slate-500 text-sm">{t('history_subtitle')}</p>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Date Filters */}
                    <DateFilter 
                        startDate={dateRange.start} 
                        endDate={dateRange.end}
                        onChange={(dates) => setDateRange(prev => ({ ...prev, ...dates }))}
                    />

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('history_search_placeholder')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all text-slate-800 dark:text-slate-200"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4 text-neon" />
                    <p>{t('history_loading')}</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('history_no_analysis')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                        {searchTerm 
                            ? t('history_try_search') 
                            : t('history_no_analysis_desc')}
                    </p>
                    {!searchTerm && (
                        <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-neon text-white font-bold rounded-xl shadow hover:bg-neon-dim transition-all">
                            {t('history_go_dashboard')}
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header Controls: Items per page */}
                    <div className="flex justify-between items-center text-sm text-slate-500 pb-2">
                        <span>{t('history_showing_results').replace('{count}', filteredHistory.length.toString())}</span>
                        <div className="flex items-center gap-2">
                            <span>{t('history_show')}</span>
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neon"
                            >
                                <option value={10}>10</option>
                                <option value={20}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {paginatedHistory.map(record => {
                            const date = new Date(record.created_at);
                            // Locale-sensitive Date String
                            const dateStr = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                            const timeStr = date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });

                            const content = formatContent(record.analysis);
                            const isExpanded = expandedId === record.id;
                            
                            // Use DB columns if available, else fallback to regex
                            let coinTitle = record.coin_name 
                                ? `${record.coin_name} (${record.coin_symbol?.toUpperCase() || ''})`
                                : (record.coin_symbol || extractCoinInfo(content) || "Analysis Report");
                                
                            // Clean up title if just symbol available
                            if (!record.coin_name && record.coin_symbol) coinTitle = record.coin_symbol.toUpperCase();

                            return (
                                <div key={record.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                    <button 
                                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                        className={clsx(
                                            "w-full text-left px-6 py-5 flex items-start gap-4 transition-colors",
                                            isExpanded 
                                                ? "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800" 
                                                : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                        )}
                                    >
                                        <div className="p-3 bg-neon/10 rounded-xl text-neon mt-0.5">
                                            <Database size={24} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                    {coinTitle}
                                                </h3>
                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-2 md:mt-0 w-fit">
                                                    {dateStr} • {timeStr}
                                                </span>
                                            </div>
                                            <p className={clsx("text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pr-4")}>
                                                {getPreviewText(content, language)}...
                                            </p>
                                        </div>

                                        <div className="mt-2 text-slate-300 dark:text-slate-600">
                                            {isExpanded ? <ChevronDown /> : <ChevronRight />}
                                        </div>
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="p-4 md:p-6 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <AnalysisVisualizer 
                                                markdown={content} 
                                                coinName={record.coin_name || record.coin_symbol || 'Unknown'} 
                                                instant={true}
                                            />
                                        </div>

                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-6 pb-12">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
