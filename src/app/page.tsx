'use client';

import Link from 'next/link';
import { Bell, TrendingUp, Shield, ArrowRight, Smartphone, Bitcoin, Target, Zap, Lock, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
            <div className="w-10 h-10 bg-gradient-to-br from-neon to-neon-dark rounded-xl flex items-center justify-center text-white shadow-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">TRENOVA</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/feedback" className="text-sm font-semibold text-slate-500 hover:text-foreground transition-colors">
              Feedback
            </Link>
            <button className="hidden sm:block bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 shadow-lg">
              Get Early Access
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
              AI Decision Assistant
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              You Set the Strategy. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-600">We Watch the Market.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-2xl mx-auto">
              Define your <strong>Buy Price</strong>, <strong>Take Profit</strong>, and <strong>Stop Loss</strong>. 
              Our AI monitors real-time data 24/7 and alerts you only when the setup is perfect.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Join Waitlist
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                See How It Works <ArrowRight size={20} />
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
                   <p className="text-slate-400">Your personal trading command center</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
                   {/* Step 1 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                         <Target size={24} />
                      </div>
                      <h3 className="text-white font-bold mb-2">1. Set Strategy</h3>
                      <p className="text-slate-400 text-xs">Define your Buy Price, Spend Limit, and Take Profit targets.</p>
                   </div>

                   {/* Step 2 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                         <Eye size={24} />
                      </div>
                      <h3 className="text-white font-bold mb-2">2. Monitor</h3>
                      <p className="text-slate-400 text-xs">System tracks the market 24/7. You don't need to stare at charts.</p>
                   </div>
                   
                   {/* Step 3 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                      <div className="w-12 h-12 bg-neon/20 rounded-xl flex items-center justify-center text-neon-light mx-auto mb-4 group-hover:scale-110 transition-transform">
                         <Zap size={24} />
                      </div>
                      <h3 className="text-white font-bold mb-2">3. AI Analysis</h3>
                      <p className="text-slate-400 text-xs">AI confirms if the trend is valid before alerting you.</p>
                   </div>

                   {/* Step 4 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all text-center group">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                         <Bell size={24} />
                      </div>
                      <h3 className="text-white font-bold mb-2">4. Alert</h3>
                      <p className="text-slate-400 text-xs">Receive "Good for Buy" or "Take Profit" notifications instantly.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Safety & Trust Section - CRITICAL */}
      <section className="py-20 bg-white border-y border-slate-100">
         <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
                     <Shield size={14} />
                     Safety First
                  </div>
                  <h2 className="text-4xl font-bold text-foreground mb-6">
                     We Alert. <br/>You Decide.
                  </h2>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                     Trenova is a <strong>Decision Assistant</strong>, not a bot. We believe the final call should always be yours.
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">No Auto-Trading</h4>
                           <p className="text-sm text-slate-500">We never execute trades automatically. Your capital is never at risk of a bot error.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Non-Custodial</h4>
                           <p className="text-sm text-slate-500">We don't hold your funds. We simply analyze the data and tell you when to act.</p>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-neon mt-1" size={20} />
                        <div>
                           <h4 className="font-bold text-foreground">Legal & Compliant</h4>
                           <p className="text-sm text-slate-500">Designed to be a safe, analytical tool for informed traders.</p>
                        </div>
                     </li>
                  </ul>
               </div>
               <div className="flex-1 w-full flex justify-center">
                  <div className="relative bg-slate-50 rounded-3xl p-8 border border-slate-100 w-full max-w-sm">
                     <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 animate-bounce delay-1000">
                        <Lock className="text-neon" size={24} />
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm opacity-50">
                           <div className="w-10 h-10 rounded-full bg-slate-100" />
                           <div className="h-2 w-24 bg-slate-100 rounded" />
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-l-4 border-neon shadow-sm">
                           <div className="w-10 h-10 rounded-full bg-neon/10 flex items-center justify-center">
                              <Bell size={20} className="text-neon" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-foreground">Good for Buy</div>
                              <div className="text-xs text-slate-500">Wait for user confirmation...</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm opacity-50">
                           <div className="w-10 h-10 rounded-full bg-slate-100" />
                           <div className="h-2 w-24 bg-slate-100 rounded" />
                        </div>
                     </div>
                     <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 font-mono">
                           "System Waiting for User Action"
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Notifications Showcase */}
      <section className="py-20 bg-slate-50">
         <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-16">Clear Alerts. Clear Action.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                     Buy Signal
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">"Good for Buy"</h3>
                  <p className="text-slate-500 text-sm">
                     Triggered when your target price is hit AND the trend momentum is positive.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                     Sell Signal
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">"Good for Take Profit"</h3>
                  <p className="text-slate-500 text-sm">
                     Secures your gains when the price hits your upper target.
                  </p>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mb-4">
                     Hold / Wait
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">"Trend Weakening"</h3>
                  <p className="text-slate-500 text-sm">
                     AI detects market indecision. Advises you to hold or wait for better confirmation.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
         <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <TrendingUp size={20} className="text-slate-400" />
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
