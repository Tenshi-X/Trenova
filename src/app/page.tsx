'use client';

import Link from 'next/link';
import { Bell, TrendingUp, Shield, ArrowRight, Smartphone, Bitcoin, Target, Zap, Lock, Eye, AlertTriangle, CheckCircle2, MousePointerClick, Cpu, Brain, MessageSquare, Upload, BarChart3, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-neon selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-10 h-10 rounded-xl shadow-lg object-contain bg-white" />
            <span className="text-xl font-bold tracking-tight text-foreground">TRENOVA</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/feedback" className="text-sm font-semibold text-slate-500 hover:text-foreground transition-colors">
              Feedback
            </Link>
            <Link href="/login" className="text-sm font-semibold text-foreground hover:text-neon transition-colors">
              Login
            </Link>
            <button className="hidden sm:block bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 shadow-lg">
              Get Waiting List
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] z-[-1]">
           <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" />
           <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] bg-neon/20 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              Live Market Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              Visual Forecasting & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-600">Technical Master Calls.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto">
              Combine <strong>AI Image Recognition</strong> with real-time market data. 
              Upload charts to detect patterns or generate professional "Master Call" trading setups instantly.
              <br/><span className="text-neon font-bold text-sm uppercase tracking-wide mt-2 inline-block">Powered by Advanced Parallel AI</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Try Dashboard
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                See Features <ArrowRight size={20} />
              </button>
            </div>

            {/* App Store Coming Soon */}
            <div className="flex flex-col items-center gap-3">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coming Soon On</p>
               <div className="flex gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Mock App Store Badges */}
                  <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 20c-.5 1.6-1.3 3.1-2.3 3.2-1 .1-1.3-.6-2.4-.6-1.1 0-1.4.6-2.4.6-1 .0-1.8-1.5-2.4-3.3C7.2 17.8 6 15 6 12.3c0-3.9 2.5-6 6-6 1.6 0 3.1 1.1 4.1 1.1 1 0 2.5-1.3 4.2-1.1.7 0 3.3.3 4.8 2.5-.1.1-2.9 1.7-2.9 4.9 0 3.6 3.1 4.9 3.2 4.9-.1.2-1.2 3.9-2.6 6zM15 3.7c.8-1 1.3-2.3 1.2-3.6-1.1 0-2.5.8-3.3 1.7-.8.9-1.4 2.3-1.2 3.6 1.3.1 2.6-.7 3.3-1.7z"/></svg>
                     <div className="text-left">
                        <div className="text-[9px] leading-tight">Download on the</div>
                        <div className="text-sm font-bold leading-tight">App Store</div>
                     </div>
                  </div>
                  <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.3,12.5L17.38,15.69L15.13,13.44L17.38,11.19L20.3,14.5C20.54,14.74 20.54,15.14 20.3,15.38C20.18,15.5 20.06,15.62 19.94,15.69M16.81,8.88L14.54,11.15L6.05,2.66L16.81,8.88Z"/></svg>
                     <div className="text-left">
                        <div className="text-[9px] leading-tight">GET IT ON</div>
                        <div className="text-sm font-bold leading-tight">Google Play</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Feature Visualization */}
          <div className="relative mx-auto max-w-5xl">
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-10">
                   <h2 className="text-white text-2xl font-bold mb-2">How It Works</h2>
                   <p className="text-slate-400">Complete market dominance in 4 steps</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
                    {/* Step 1 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">1. Upload or Select</h3>
                       <p className="text-slate-400 text-xs">Upload a chart image for pattern recognition OR select a coin for deep analysis.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Cpu size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">2. Live Data Context</h3>
                       <p className="text-slate-400 text-xs">System instantly fetches real-time Price, Volume, and Cap data from CoinGecko.</p>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-neon/20 rounded-xl flex items-center justify-center text-neon-light mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Brain size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">3. AI Synthesis</h3>
                       <p className="text-slate-400 text-xs">AI fuses visual chart data with market metrics to identify high-probability setups.</p>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Target size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">4. Master Call</h3>
                       <p className="text-slate-400 text-xs">Receive a full trading plan: Entry, Stop Loss, Take Profit, and Risk/Reward.</p>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Primary Features Section */}
      <section className="py-20 bg-white border-y border-slate-100">
         <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                     <BarChart3 size={14} />
                     Deep Analysis
                  </div>
                  <h2 className="text-4xl font-bold text-foreground mb-6">
                     Beyond Simple Signals. <br/>Complete Trading Plans.
                  </h2>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                     Most bots just say "Buy". Trenova acts as a <strong>Senior Analyst</strong>, providing the full reasoning and structure you need to trade with confidence.
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Visual Pattern Recognition</h4>
                           <p className="text-sm text-slate-500">Upload any chart screenshot. Our AI detects Double Bottoms, Head & Shoulders, and Breakout structures automatically.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Structured "Master Call" Output</h4>
                           <p className="text-sm text-slate-500">Get standardized outputs with precise Entry Zones, Invalidtion Levels, and Multi-Target Take Profits.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Sentiment & Risk Deep Dives</h4>
                           <p className="text-sm text-slate-500">Switch modes to "Risk Assessment" or "Market Sentiment" for specialized insights beyond just price action.</p>
                        </div>
                     </li>
                  </ul>
               </div>
               <div className="flex-1 w-full flex justify-center">
                  <div className="relative bg-slate-50 rounded-3xl p-6 border border-slate-100 w-full max-w-sm shadow-xl">
                     {/* Mock UI for Master Call */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                            <span className="text-white font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon animate-pulse"/> MASTER CALL</span>
                            <span className="text-emerald-400 text-xs font-mono">CONFIDENCE: HIGH</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-700">BTC/USDT</span>
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">LONG</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Entry:</span>
                                    <span className="font-mono text-slate-800">$43,200 - $43,500</span>
                                </div>
                                <div className="flex justify-between text-rose-600">
                                    <span className="opacity-75">Stop Loss:</span>
                                    <span className="font-mono font-bold">$42,800</span>
                                </div>
                                <div className="flex justify-between text-emerald-600">
                                    <span className="opacity-75">TP 1:</span>
                                    <span className="font-mono font-bold">$44,500</span>
                                </div>
                                <div className="flex justify-between text-emerald-600">
                                    <span className="opacity-75">TP 2:</span>
                                    <span className="font-mono font-bold">$45,200</span>
                                </div>
                            </div>
                            <div className="pt-2 text-xs text-slate-400 italic border-t border-slate-100 mt-2">
                                "Bullish divergence on 4H RSI + Rejection from key support."
                            </div>
                        </div>
                     </div>
                     
                     <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3">
                         <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                             <TrendingUp size={16} />
                         </div>
                         <div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase">Risk Reward</div>
                             <div className="text-sm font-bold text-slate-800">1 : 3.5 Ratio</div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Notifications Showcase */}
      <section className="py-20 bg-slate-50">
         <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-16">Three Modes. Endless Possibilities.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                     <TrendingUp size={14} />
                     Master Call
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Trend Trading</h3>
                  <p className="text-slate-500 text-sm">
                     The flagship mode. Identifies trend continuation and reversal setups with full entry/exit management.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-4">
                     <Search size={14} />
                     Deep Dive
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Technical Audit</h3>
                  <p className="text-slate-500 text-sm">
                     Analyzes MACD, RSI, and Moving Averages across multiple timeframes to validate your own bias.
                  </p>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-4">
                     <Shield size={14} />
                     Risk Guard
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Volatility Check</h3>
                  <p className="text-slate-500 text-sm">
                     Calculates current volatility and support levels to determine if a trade is safe to enter now.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
         <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <img src="/app-logo.png" alt="Trenova Logo" className="w-6 h-6 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
               <span className="font-bold text-slate-700">TRENOVA</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">© {new Date().getFullYear()} Trenova Mobile. All rights reserved.</p>
            <div className="flex justify-center gap-6 text-sm text-slate-500">
               <Link href="#" className="hover:text-neon">Privacy Policy</Link>
               <Link href="#" className="hover:text-neon">Terms of Service</Link>
               <Link href="/feedback" className="hover:text-neon">Feedback</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
