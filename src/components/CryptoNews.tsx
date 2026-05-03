'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Newspaper, ExternalLink, Loader2, Clock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
  source: string;
}

const ITEMS_PER_PAGE = 10;

export default function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNews = useCallback(async (force = false) => {
    try {
      const CACHE_KEY = 'trv_news_cache_v2';
      const CACHE_TTL = 600000; // 10 minutes

      if (!force && typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              setNews(data);
              setLoading(false);
              return;
            }
          } catch (e) {}
        }
      }

      const res = await fetch('/api/news');
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
        }
        setNews(data);
      }
    } catch (error) {
      console.error("News fetch error", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 10 minutes
    const timer = setInterval(() => fetchNews(true), 600000);
    return () => clearInterval(timer);
  }, [fetchNews]);

  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = news.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin text-neon mb-3" size={28} />
        <p className="text-sm text-slate-500">Memuat berita crypto terbaru...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center h-64 text-slate-400">
        <Newspaper size={32} className="mb-3 opacity-50" />
        <p className="text-sm">Tidak ada berita tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-neon/10 rounded-xl">
            <Newspaper className="text-neon" size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Live Crypto News</h2>
          <span className="text-[10px] font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full ml-2 hidden sm:inline-block">
            MULTI-SOURCE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {news.length} articles
          </span>
          <button
            onClick={() => { setLoading(true); fetchNews(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-neon transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* News Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentNews.map((item, index) => (
            <a
              key={`${startIdx + index}-${item.link}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-neon transition-all hover:shadow-lg shadow-slate-200/50 dark:shadow-none p-4"
            >
              {/* Thumbnail */}
              {item.thumbnail ? (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 relative">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent opacity-60"></div>
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Newspaper size={24} className="text-slate-400 opacity-50" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-[13px] leading-tight text-slate-800 dark:text-slate-200 line-clamp-2 mb-1.5 group-hover:text-neon transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed hidden sm:block">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded text-[9px]",
                      item.source === 'CoinDesk' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {item.source}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {item.pubDate ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group-hover:text-neon transition-colors">
                    Baca <ExternalLink size={10} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={clsx(
                "p-2 rounded-lg border transition-all",
                currentPage === 1
                  ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-neon hover:text-neon"
              )}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={clsx(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  currentPage === page
                    ? "bg-neon text-white dark:text-black shadow-lg shadow-neon/20"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={clsx(
                "p-2 rounded-lg border transition-all",
                currentPage === totalPages
                  ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-neon hover:text-neon"
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
