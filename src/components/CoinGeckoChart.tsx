import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface CoinGeckoChartProps {
  coinId: string;
}

function CoinGeckoChart({ coinId }: CoinGeckoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Determine the script URL
    const scriptUrl = "https://widgets.coingecko.com/gecko-coin-price-chart-widget.js";

    // check if script is already loaded
    let script = document.querySelector(`script[src="${scriptUrl}"]`);
    
    if (!script) {
        script = document.createElement("script");
        script.setAttribute("src", scriptUrl);
        script.setAttribute("async", "true");
        document.head.appendChild(script);
    }

    // Helper to render widget
    const renderWidget = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            const widget = document.createElement("gecko-coin-price-chart-widget");
            widget.setAttribute("locale", "en");
            widget.setAttribute("dark-mode", theme === 'dark' ? "true" : "false");
            widget.setAttribute("coin-id", coinId);
            widget.setAttribute("initial-currency", "usd");
            // widget.setAttribute("transparent-background", "true");
            
            containerRef.current.appendChild(widget);
        }
    };

    // If script is already loaded (or as soon as it loads), render
    // However, CoinGecko widget script usually defines the custom element immediately. 
    // We can just append the element.
    renderWidget();
    
  }, [coinId, theme]);

  return (
    <div className="w-full h-[500px] bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6 transition-colors p-4 flex flex-col justify-center">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default memo(CoinGeckoChart);
