'use client';

import Link from 'next/link';
import { Bell, TrendingUp, Shield, ArrowRight, Smartphone, Bitcoin, Target, Zap } from 'lucide-react';
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
            <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-foreground transition-colors">
              Admin Access
            </Link>
            <button className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 shadow-lg">
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
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              Coming Soon
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-foreground mb-6 leading-tight">
              Don't Watch the Charts. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-600">Just Catch the Move.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed">
              Set your <span className="text-foreground font-semibold">Good For Buy</span> and <span className="text-foreground font-semibold">Take Profit</span> zones.
              We'll watch 24/7 and alert you exactly when the price hits your target. Never chase a pump again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Join Waitlist
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Learn More <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Feature Visualization */}
          <div className="relative mx-auto max-w-4xl">
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Mockup UI Interface */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-20">
                   {/* Left: The Logic */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                            <Bitcoin className="text-orange-500" size={24} />
                         </div>
                         <div>
                            <h3 className="text-white font-bold text-lg">Bitcoin (BTC)</h3>
                            <p className="text-slate-400 text-sm">Realtime: <span className="text-white font-mono">$90,000</span></p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         {/* Step 1 */}
                         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4 transition-all hover:bg-slate-800 hover:border-neon/30">
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 mt-1">1</div>
                            <div>
                               <h4 className="text-slate-200 font-semibold text-sm">Current Price Too High</h4>
                               <p className="text-slate-400 text-xs mt-1">Market is at $90k. You want to buy the dip.</p>
                            </div>
                         </div>
                         
                         {/* Step 2 */}
                         <div className="bg-neon/10 p-4 rounded-xl border border-neon/30 flex items-start gap-4 relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-2 opacity-20">
                               <Target className="text-neon" size={40} />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-neon flex items-center justify-center text-xs font-bold text-white mt-1">2</div>
                            <div>
                               <h4 className="text-white font-semibold text-sm">Smart Wait (Good for Buy)</h4>
                               <p className="text-neon-light text-xs mt-1">System waits for $88,000. No notification until then.</p>
                               <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-white font-mono">Target: $88k</span>
                                  <span className="w-12 h-[1px] bg-slate-600"></span>
                                  <span className="text-[10px] text-emerald-400 font-bold">Buy Signal</span>
                               </div>
                            </div>
                         </div>

                         {/* Step 3 */}
                         <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-500 mt-1">3</div>
                            <div>
                               <h4 className="text-emerald-100 font-semibold text-sm">Take Profit</h4>
                               <p className="text-emerald-400/70 text-xs mt-1">Auto-alert when price hits $100,000.</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right: The Phone Mockup */}
                   <div className="relative hidden md:block">
                      <div className="absolute inset-0 bg-neon/20 blur-[60px] rounded-full" />
                      <div className="relative z-10 bg-black border-[6px] border-slate-800 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden max-w-[280px] mx-auto rotate-[-6deg] hover:rotate-0 transition-all duration-500">
                         {/* Phone Screen */}
                         <div className="bg-slate-900 h-[500px] w-full rounded-[2rem] overflow-hidden relative font-sans">
                            {/* App Header */}
                            <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-white/5">
                               <div className="w-8 h-8 rounded-full bg-slate-800" />
                               <div className="font-bold text-white text-sm">Trenova</div>
                               <Bell size={16} className="text-white" />
                            </div>
                            
                            {/* App Content */}
                            <div className="p-4 space-y-4">
                               <div className="p-4 bg-gradient-to-br from-neon to-purple-600 rounded-2xl text-white">
                                  <div className="text-xs opacity-80 mb-1">Alert Triggered!</div>
                                  <div className="text-2xl font-bold mb-1">BTC hit $88k</div>
                                  <div className="text-xs font-mono bg-white/20 inline-block px-2 py-1 rounded">Good for Buy</div>
                               </div>

                               <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-slate-500">
                                     <span>Asset</span>
                                     <span>Target</span>
                                  </div>
                                  <div className="p-3 bg-slate-800 rounded-xl flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                                           <Bitcoin size={14} className="text-orange-500" />
                                        </div>
                                        <span className="text-white text-sm font-medium">BTC</span>
                                     </div>
                                     <span className="text-emerald-400 font-mono text-sm">$100k</span>
                                  </div>
                                  <div className="p-3 bg-slate-800 rounded-xl flex justify-between items-center opacity-50">
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                           <span className="text-blue-500 text-[10px]">ETH</span>
                                        </div>
                                        <span className="text-white text-sm font-medium">ETH</span>
                                     </div>
                                     <span className="text-emerald-400 font-mono text-sm">$3.2k</span>
                                  </div>
                               </div>
                            </div>

                            {/* Floating Action Button */}
                            <div className="absolute bottom-6 right-6 w-12 h-12 bg-neon rounded-full flex items-center justify-center shadow-lg shadow-neon/40">
                               <Zap size={20} className="text-white" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-slate-50">
         <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16">Intelligence, Not Just Noise.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                     <Target size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Precision Targeting</h3>
                  <p className="text-slate-500 leading-relaxed">
                     Don't set generic alerts. Define "Good for Buy" zones based on support levels and let the app watch the charts for you.
                  </p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-6">
                     <Bell size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Smart Notifications</h3>
                  <p className="text-slate-500 leading-relaxed">
                     Get notified only when the setup is valid. If it dips below your buy zone, we can auto-adjust or warn you.
                  </p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                     <Smartphone size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Mobile First</h3>
                  <p className="text-slate-500 leading-relaxed">
                     Built for traders on the go. Interface optimized for quick reactions when the market moves fast.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
         <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <TrendingUp size={20} className="text-slate-400" />
               <span className="font-bold text-slate-700">TRENOVA</span>
            </div>
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Trenova Mobile. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}
