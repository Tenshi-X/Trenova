'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAnalysisHistory, AnalysisRecord } from '@/lib/api';
import { Clock, Loader2, ArrowLeft, FileText, ChevronDown, ChevronRight, TrendingUp, Search, Filter, X, BarChart3, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

// Helper to sanitize and format content
const formatContent = (content: any) => {
    if (typeof content === 'string') return content;
    return content?.analysis || JSON.stringify(content);
};

// Helper: Extract Category based on known headers from dashboard/page.tsx
const extractCategory = (content: string): string => {
    if (content.includes("Price Forecast")) return "Price Forecast";
    if (content.includes("Technical Deep Dive")) return "Technical Deep Dive";
    if (content.includes("Market Intelligence") || content.includes("Market Sentiment")) return "Market Sentiment";
    if (content.includes("Risk Assessment")) return "Risk Assessment";
    return "General Analysis";
};

// Helper: Extract coin name for searching purposes
const extractCoinInfo = (content: string) : string => {
    const match = content.match(/:\s*([A-Za-z0-9\s]+?)(?:\(|$|\n)/); 
    // Matches "Price Forecast: Bitcoin (", "Risk Assessment: Solana" etc.
    if (match && match[1]) return match[1].trim();
    return "";
};

// Icons map for categories
const CategoryIcons: Record<string, any> = {
    "Price Forecast": TrendingUp,
    "Technical Deep Dive": BarChart3,
    "Market Sentiment": Activity,
    "Risk Assessment": AlertTriangle,
    "General Analysis": FileText
};

export default function HistoryPage() {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getAnalysisHistory(7);
            setHistory(data);
            setLoading(false);
        }
        load();
    }, []);

    // Derived Data: Categories found in history
    const uniqueCategories = useMemo(() => {
        const cats = new Set(history.map(r => extractCategory(formatContent(r.analysis))));
        // Ensure specific order if desired, or just sort
        const ordered = ["Price Forecast", "Technical Deep Dive", "Market Sentiment", "Risk Assessment", "General Analysis"];
        return Array.from(cats).sort((a, b) => ordered.indexOf(a) - ordered.indexOf(b));
    }, [history]);

    // Derived Data: Filtered history
    const filteredHistory = useMemo(() => {
        return history.filter(record => {
            const content = formatContent(record.analysis);
            const category = extractCategory(content);
            const coinInfo = extractCoinInfo(content).toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            // Check Category Filter
            if (activeCategoryFilter !== 'All' && category !== activeCategoryFilter) {
                return false;
            }

            // Check Search Term (searches content + inferred coin name)
            if (searchTerm && !content.toLowerCase().includes(searchLower) && !coinInfo.includes(searchLower)) {
                return false;
            }

            return true;
        });
    }, [history, searchTerm, activeCategoryFilter]);

    // Grouping Logic (Now by Category)
    const groupedHistory = useMemo(() => {
        return filteredHistory.reduce((groups, record) => {
            const content = formatContent(record.analysis);
            const category = extractCategory(content);
            
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(record);
            return groups;
        }, {} as Record<string, AnalysisRecord[]>);
    }, [filteredHistory]);

    const toggleGroup = (category: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            <Clock className="text-neon" /> Classification History
                        </h1>
                        <p className="text-slate-500 text-sm">Past 7 days grouped by analysis type</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search coin or content..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Chips (Categories) */}
            {!loading && history.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Filter size={16} className="text-slate-400 shrink-0 ml-1" />
                    <button
                        onClick={() => setActiveCategoryFilter('All')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
                            activeCategoryFilter === 'All' 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        )}
                    >
                        All Types
                    </button>
                    {uniqueCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategoryFilter(cat)}
                            className={clsx(
                                "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
                                activeCategoryFilter === cat 
                                    ? "bg-slate-900 text-white border-slate-900" 
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4 text-neon" />
                    <p>Loading history...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">No Analysis Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        {searchTerm || activeCategoryFilter !== 'All' 
                            ? "Try adjusting your filters or search term." 
                            : "You haven't run any market analysis in the last 7 days."}
                    </p>
                    {!searchTerm && activeCategoryFilter === 'All' && (
                        <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-neon text-white font-bold rounded-xl shadow hover:bg-neon-dim transition-all">
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Render Groups in specific order if possible, or just Object.entries */}
                    {Object.entries(groupedHistory).sort((a,b) => {
                         const order = ["Price Forecast", "Technical Deep Dive", "Market Sentiment", "Risk Assessment"];
                         return order.indexOf(a[0]) - order.indexOf(b[0]);
                    }).map(([category, records]) => {
                        const isGroupCollapsed = collapsedGroups[category];
                        const Icon = CategoryIcons[category] || FileText;
                        
                        return (
                            <div key={category} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                                {/* Group Header */}
                                <button 
                                    onClick={() => toggleGroup(category)}
                                    className="w-full bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shadow-sm border", 
                                            category === "Price Forecast" ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                                            category === "Risk Assessment" ? "bg-rose-100 text-rose-600 border-rose-200" :
                                            "bg-blue-100 text-blue-600 border-blue-200"
                                        )}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-slate-800">{category}</h2>
                                            {isGroupCollapsed && <p className="text-xs text-slate-400">{records.length} reports hidden</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            {records.length}
                                        </span>
                                        {isGroupCollapsed ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400 rotate-180 transition-transform" />}
                                    </div>
                                </button>
                                
                                {/* Records List */}
                                {!isGroupCollapsed && (
                                    <div className="divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-300">
                                        {records.map(record => {
                                            const date = new Date(record.created_at);
                                            const content = formatContent(record.analysis);
                                            const isExpanded = expandedId === record.id;
                                            
                                            // Extract coin name for title display
                                            const coinTitle = extractCoinInfo(content) || "Analysis Report";

                                            return (
                                                <div key={record.id} className="group">
                                                    <button 
                                                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                                        className={clsx(
                                                            "w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4",
                                                            isExpanded && "bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="mt-1">
                                                            {isExpanded ? (
                                                                <ChevronDown className="text-neon" size={20} />
                                                            ) : (
                                                                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-slate-800 text-base">
                                                                    {coinTitle}
                                                                </span>
                                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                                                     {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className={clsx("text-sm text-slate-500 line-clamp-2", isExpanded && "hidden")}>
                                                                {content.replace(/###|[*]/g, '').slice(0, 150)}...
                                                            </p>
                                                        </div>
                                                    </button>
                                                    
                                                    {/* Expanded Detail */}
                                                    {isExpanded && (
                                                        <div className="px-6 pb-6 pl-14 animate-in slide-in-from-top-2 fade-in duration-200 bg-slate-50 border-b border-slate-100">
                                                            <div className="prose prose-sm max-w-none text-slate-600 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                                <ReactMarkdown>
                                                                    {content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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
