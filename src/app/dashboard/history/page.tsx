'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAnalysisHistory, AnalysisRecord } from '@/lib/api';
import { Clock, Loader2, ArrowLeft, FileText, ChevronDown, ChevronRight, Search, X, Database } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import AnalysisVisualizer from '@/components/AnalysisVisualizer';


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

export default function HistoryPage() {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getAnalysisHistory(7);
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
                if (!matchesContent && !matchesCoin) return false;
            }

            return true;
        });
    }, [history, searchTerm]);

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
                            <Clock className="text-neon" /> Analysis History
                        </h1>
                        <p className="text-slate-500 text-sm">Your recent market intelligence reports</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search coin..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all text-slate-800 dark:text-slate-200"
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

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4 text-neon" />
                    <p>Loading history...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Analysis Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                        {searchTerm 
                            ? "Try adjusting your search term." 
                            : "You haven't run any market analysis recently."}
                    </p>
                    {!searchTerm && (
                        <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-neon text-white font-bold rounded-xl shadow hover:bg-neon-dim transition-all">
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredHistory.map(record => {
                        const date = new Date(record.created_at);
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
                                                {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={clsx("text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pr-4")}>
                                            {content.replace(/###|[*]/g, '').slice(0, 160)}...
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
            )}
        </div>
    );
}
