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
            <Link href="/login" className="hidden sm:block bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 shadow-lg">
              Get Started
            </Link>
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
              Upload charts to detect patterns or get comprehensive price forecasts instantly.
              <br/><span className="text-neon font-bold text-sm uppercase tracking-wide mt-2 inline-block">Powered by Advanced Multimodal AI</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Try Dashboard
              </Link>
              <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                See Features <ArrowRight size={20} />
              </Link>
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
                          <MousePointerClick size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">1. Select Coin</h3>
                       <p className="text-slate-400 text-xs">Choose any cryptocurrency from the dashboard to start analysis.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Cpu size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">2. Live Data</h3>
                       <p className="text-slate-400 text-xs">We fetch real-time Price, Volume, and Cap data automatically.</p>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-neon/20 rounded-xl flex items-center justify-center text-neon-light mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">3. Visual Input</h3>
                       <p className="text-slate-400 text-xs">Optional: Upload a chart screenshot for pattern recognition.</p>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Target size={24} />
                       </div>
                       <h3 className="text-white font-bold mb-2">4. AI Analysis</h3>
                       <p className="text-slate-400 text-xs">Get a comprehensive Price Forecast, Technical Deep Dive, and Risk Assessment.</p>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Primary Features Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-100">
         <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                     <BarChart3 size={14} />
                     Deep Analysis
                  </div>
                  <h2 className="text-4xl font-bold text-foreground mb-6">
                     Beyond Simple Signals. <br/>Complete Market Intelligence.
                  </h2>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                     Most bots just say "Buy". Trenova acts as a <strong>Senior Analyst</strong>, providing the full reasoning and structure you need to trade with confidence.
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Visual + Data Fusion</h4>
                           <p className="text-sm text-slate-500">Combines technical indicators with optional image recognition of chart patterns.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Structured Intelligence Report</h4>
                           <p className="text-sm text-slate-500">Get standardized outputs with Price Forecasts, Technical Deep Dives, and Risk Metrics.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">History & Tracking</h4>
                           <p className="text-sm text-slate-500">Automatically save and classify every analysis to track your market performance over time.</p>
                        </div>
                     </li>
                  </ul>
               </div>
               <div className="flex-1 w-full flex justify-center">
                  <div className="relative bg-slate-50 rounded-3xl p-6 border border-slate-100 w-full max-w-sm shadow-xl">
                     {/* Mock UI for Master Call */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                            <span className="text-white font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon animate-pulse"/> AI REPORT</span>
                            <span className="text-emerald-400 text-xs font-mono">LIVE</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-700">BTC/USDT</span>
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">BULLISH</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Trend:</span>
                                    <span className="font-mono text-slate-800">Uptrend w/ Volume</span>
                                </div>
                                <div className="flex justify-between text-emerald-600">
                                    <span className="opacity-75">Support:</span>
                                    <span className="font-mono font-bold">$92,500</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span className="opacity-75">RSI:</span>
                                    <span className="font-mono font-bold">65 (Neutral-Bull)</span>
                                </div>
                            </div>
                            <div className="pt-2 text-xs text-slate-400 italic border-t border-slate-100 mt-2">
                                "Double bottom pattern confirmed on 4H chart. Recommend accumulation..."
                            </div>
                        </div>
                     </div>
                     
                     <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3">
                         <div className="bg-blue-100 p-2 rounded-md text-blue-600">
                             <TrendingUp size={16} />
                         </div>
                         <div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase">Forecast</div>
                             <div className="text-sm font-bold text-slate-800">Target: $100k</div>
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
            <h2 className="text-3xl font-bold mb-16">Comprehensive AI Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                     <TrendingUp size={14} />
                     Forecast
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Price Prediction</h3>
                  <p className="text-slate-500 text-sm">
                     Determines Trend (Bullish/Bearish), Support & Resistance levels, and short-term targets.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-4">
                     <Search size={14} />
                     Technical
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Deep Dive</h3>
                  <p className="text-slate-500 text-sm">
                     Analyzes Moving Averages, RSI, Momentum, and chart patterns like Head & Shoulders.
                  </p>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-4">
                     <Shield size={14} />
                     Risk Guard
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Sentiment & Risk</h3>
                  <p className="text-slate-500 text-sm">
                     Evaluates crowd psychology (FOMO vs Panic) and assigns a Volatility Score.
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
               <Link href="/" className="hover:text-neon">Privacy Policy</Link>
               <Link href="/" className="hover:text-neon">Terms of Service</Link>
               <Link href="/feedback" className="hover:text-neon">Feedback</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
