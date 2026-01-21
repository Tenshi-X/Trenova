'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    if (!symbol) return;

    // Clear previous widget
    container.current.innerHTML = '';
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Construct symbol
    // User requested NO hardcoded exchange and NO hardcoded USDT suffix.
    // We trust the parent component to pass the correct symbol (or the widget will auto-resolve).
    const tvSymbol = symbol.toUpperCase();

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": theme === 'dark' ? 'dark' : 'light',
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div className="w-full h-[500px] bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6 transition-colors">
      <div className="tradingview-widget-container h-full w-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
