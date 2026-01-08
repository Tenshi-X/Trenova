'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Activity, Database, Sparkles, TrendingUp, BarChart3, AlertTriangle, Upload, X, MousePointerClick } from 'lucide-react';
import clsx from 'clsx';
import { askChatbot } from '@/lib/api';
import { checkAndIncrementUsage, saveAnalysis, getUserUsage } from './actions';
import CoinSelector, { Coin } from '@/components/CoinSelector';
import TradingViewWidget from '@/components/TradingViewWidget';

async function fetchCoinGeckoData(coinId: string) {
    try {
        const timestamp = new Date().getTime();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!res.ok) throw new Error("API Limit");
        const data = await res.json();
        return data[coinId];
    } catch (e) {
        console.warn("CoinGecko API failed (likely rate limit), using fallback.");
        return null;
    }
}

const GLOBAL_ANALYSIS_PROMPT = `
**Role:** Master Crypto Analyst (Technical, Fundamental, & Sentiment)
**Task:** Provide a comprehensive 4-part analysis for {{COIN_NAME}}.

**Context Data:**
- Coin: {{COIN_NAME}} (\${{SYMBOL}})
- Current Price: \${{PRICE}}
- 24h Change: {{CHANGE_24H}}%
- Market Cap: \${{MARKET_CAP}}
- 24h Volume: \${{VOLUME_24H}}
{{IMAGE_CONTEXT}}

**Analysis Sections Required:**

1. **🔮 Price Forecast**
   - Determine Trend (Bullish/Bearish/Neutral).
   - Support & Resistance Levels.
   - Short-term & Medium-term Targets.

2. **📊 Technical Deep Dive**
   - RSI & Momentum Status.
   - Moving Averages Analysis.
   - Key Patterns (e.g., Head & Shoulders, Flags).

3. **🧠 Market Sentiment**
   - Crowd Psychology (FOMO vs Panic).
   - Volume Analysis (Is the move supported?).

4. **🛡️ Risk Assessment**
   - Volatility Score (1-10).
   - Recommended Leverage Cap (if any).
   - Stop Loss suggestions.

**Constraint:** Output in clean, structured Markdown. Use Emojis for headers.
`;

function constructPrompt(template: string, coin: any, market: any, hasImage: boolean, lang: 'id' | 'en') {
  const imageContext = hasImage ? "Note: User has uploaded a chart image. Please focus on visual pattern recognition." : "";
  const langInstruction = lang === 'id' 
    ? "**IMPORTANT:** PLEASE PROVIDE THE ENTIRE RESPONSE IN INDONESIAN LANGUAGE (BAHASA INDONESIA)." 
    : "**IMPORTANT:** Please provide the response in English.";

  return template
    .replace(/{{COIN_NAME}}/g, coin.name)
    .replace(/{{SYMBOL}}/g, coin.symbol.toUpperCase())
    .replace(/{{PRICE}}/g, market?.usd?.toLocaleString() || '0')
    .replace(/{{CHANGE_24H}}/g, market?.usd_24h_change?.toFixed(2) || '0')
    .replace(/{{VOLUME_24H}}/g, market?.usd_24h_vol ? market.usd_24h_vol.toLocaleString() : 'N/A')
    .replace(/{{MARKET_CAP}}/g, market?.usd_market_cap ? market.usd_market_cap.toLocaleString() : 'N/A')
    .replace(/{{IMAGE_CONTEXT}}/g, imageContext + "\n" + langInstruction);
}

export default function DashboardPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null); 
  
  // Analysis State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [language, setLanguage] = useState<'id' | 'en'>('id'); // Default to Indonesian
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<{ analysis: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Usage Stats State
  const [usageStats, setUsageStats] = useState<any>(null);

  useEffect(() => {
      fetchUsage();
  }, []);

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

  const runAnalysis = async () => {
    if (!selectedCoin) return;
    setChatLoading(true);
    setChatResult(null); // Clear previous

    try {
        // 1. Check Usage Limit
        const usageCheck = await checkAndIncrementUsage();
        if (!usageCheck.allowed) {
            alert(usageCheck.error);
            setChatLoading(false);
            return;
        }

        // 2. Fetch Market Data
        let marketData = await fetchCoinGeckoData(selectedCoin.id);
        if (!marketData) {
            console.warn("Market data fetch failed, using fallback/zeros");
            marketData = { usd: 0, usd_24h_change: 0 };
        }

        // 3. Construct Prompt
        let promptText = constructPrompt(GLOBAL_ANALYSIS_PROMPT, selectedCoin, marketData, !!selectedImage, language);
        if (userPrompt.trim()) {
            promptText += `\n\n**USER INSTRUCTION:**\n${userPrompt}`;
        }

        // 4. Call AI
        let aiOutput = "";
        try {
            console.log("Sending prompt to AI:", promptText.length, "chars");
            const apiRes = await askChatbot(promptText);
            
            if (apiRes && apiRes.analysis) {
                aiOutput = apiRes.analysis;
            } else {
                console.error("AI returned malformed response:", apiRes);
                throw new Error("AI response missing analysis field");
            }
        } catch(e) { 
            console.error("AI Execution Error:", e);
            aiOutput = `### ⚠️ Analysis Failed
            
**Reason:** Unable to reach the AI service. 
**Details:** The server might be busy, or your connection is unstable. 
            
Please try again in a few moments.`;
        }

        const result = { analysis: aiOutput };
        setChatResult(result);
        
        // 5. Save & Refresh Stats
        if (aiOutput && !aiOutput.includes("Analysis Failed")) {
             await saveAnalysis(result, selectedCoin?.symbol, selectedCoin?.name);
             await fetchUsage();
        }

    } catch (e) {
        console.error("Critical Analysis Error:", e);
        alert("An unexpected error occurred while generating analysis.");
    } finally {
        setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 px-3 md:space-y-8 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 pt-2">
        <div>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-foreground mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
                <Sparkles className="text-neon w-5 h-5 md:w-8 md:h-8" fill="currentColor" /> Market Intelligence
            </h1>
            <p className="text-slate-500 text-xs md:text-lg">AI-Powered Forecasting & Technical Analysis</p>
        </div>
      </div>

      {/* Dynamic Coin Selector */}
      <CoinSelector 
         selectedCoinId={selectedCoin?.id || ''} 
         onSelect={handleCoinSelect} 
      />

      {selectedCoin ? (
          <div className="space-y-6">
            <TradingViewWidget symbol={selectedCoin.symbol} />

            {/* --- UNIFIED ANALYSIS CONTROL --- */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                    
                    {/* Image Upload Section */}
                    <div className="flex-1 lg:max-w-md">
                        <label className="block text-xs font-bold text-slate-500 mb-2 pl-1">Chart Image (Optional)</label>
                        {!imagePreview ? (
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-4 bg-slate-50 gap-3 cursor-pointer hover:border-neon hover:bg-neon/5 transition-all text-slate-400 group h-32"
                             >
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="font-bold text-sm">Upload Chart</p>
                                    <p className="text-[10px] opacity-70">For enhanced visual analysis</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                             </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group h-32">
                                <img src={imagePreview} alt="Chart" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <button 
                                    onClick={cleanAnalysis}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Custom Instruction */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2 pl-1">Custom Context (Optional)</label>
                        <div className="relative">
                            <textarea 
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder="E.g., Focus on support levels at $90k..."
                                className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-neon/20 focus:border-neon transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-none flex flex-col justify-center gap-2">
                        <label className="block text-xs font-bold text-slate-500 pl-1">Language</label>
                         <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 h-10 items-center">
                            <button
                                onClick={() => setLanguage('id')}
                                className={clsx(
                                    "flex-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                    language === 'id' ? "bg-white text-neon shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                🇮🇩 ID
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={clsx(
                                    "flex-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                    language === 'en' ? "bg-white text-neon shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                🇺🇸 EN
                            </button>
                         </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-none lg:w-48 flex flex-col gap-2">
                         <button 
                            onClick={runAnalysis}
                            disabled={chatLoading}
                            className="w-full h-32 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 transition-all group"
                        >
                            {chatLoading ? (
                                <Zap className="animate-pulse w-8 h-8 text-neon" />
                            ) : (
                                <Sparkles className="w-8 h-8 text-neon group-hover:scale-110 transition-transform" /> 
                            )}
                            <span>{chatLoading ? "Analyzing..." : "Generate Analysis"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ANALYSIS RESULTS --- */}
            {chatResult && (
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                     <div className="bg-slate-50/50 border-b border-slate-100 p-4 md:p-6 flex items-center gap-3">
                         <div className="p-2 bg-neon/10 rounded-xl text-neon">
                             <Database size={24} />
                         </div>
                         <h2 className="text-xl font-bold text-slate-800">Market Intelligence Report</h2>
                     </div>
                     <div className="p-6 md:p-10 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                        {chatResult.analysis.split('\n').map((line, i) => (
                            <p key={i} className={clsx(
                                "mb-2",
                                line.startsWith('###') && "text-xl md:text-2xl mt-8 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2",
                                line.startsWith('**') && "font-semibold text-slate-800"
                            )}>
                                {line.replace(/###|[*]/g, '')}
                            </p>
                        ))}
                     </div>
                 </div>
            )}
            
          </div>
      ) : (
        <div className="w-full py-12 md:py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 mt-8 animate-in fade-in zoom-in duration-500">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <MousePointerClick size={32} className="text-neon" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-600">Select a Coin to Analyze</h3>
          <p className="text-sm md:text-base max-w-sm text-center">Choose a cryptocurrency from the list above to unlock AI price forecasting, charts, and deep technical analysis.</p>
      </div>
      )}

    </div>
  );
}
