'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

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
    let tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
    
    // Special handling for Stablecoins or specific assets
    if (symbol.toUpperCase() === 'USDT') {
        tvSymbol = 'KRAKEN:USDTUSD'; // Show USDT vs USD
    } else if (symbol.toUpperCase() === 'USDC') {
        tvSymbol = 'KRAKEN:USDCUSD';
    } else if (symbol.toUpperCase() === 'BTC') {
        tvSymbol = 'BINANCE:BTCUSDT';
    }

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="w-full h-[500px] bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-6">
      <div className="tradingview-widget-container h-full w-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
