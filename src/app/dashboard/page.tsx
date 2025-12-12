'use client';

import { useEffect, useState } from 'react';
import TrendChart from '@/components/charts/TrendChart';
import { ArrowUpRight, ArrowDownRight, Activity, BrainCircuit } from 'lucide-react';
import { getTrendDataServer, getLatestAnalysisServer } from './actions';
import { TrendData } from '@/lib/api';
import clsx from 'clsx';

export default function DashboardPage() {
  const [chartData, setChartData] = useState<TrendData[]>([]);
  const [analysis, setAnalysis] = useState<any>(null); // Using any for flexible JSON parsing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        // Fetch BTCUSD data by default using Server Action
        const trends = await getTrendDataServer('BTCUSD');
        setChartData(trends);

        const aiResult = await getLatestAnalysisServer();
        if (aiResult) {
            setAnalysis(aiResult);
        }
        setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl" />
            <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Market Overview</h1>
            <p className="text-slate-500">Real-time trading insights and trends.</p>
          </div>
          <div className="text-right">
             <span className="flex items-center gap-2 text-xs font-mono text-neon-dark bg-neon-light px-3 py-1 rounded-full border border-neon/20 shadow-sm">
                <BrainCircuit size={14} />
                AI Analysis Active
             </span>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Market Cap', value: '$2.4T', change: '+2.4%', up: true },
          { label: '24h Volume', value: '$86.5B', change: '-1.2%', up: false },
          { label: 'BTC Dominance', value: '42.1%', change: '+0.5%', up: true },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
              <h4 className="text-2xl font-bold text-foreground">{stat.value}</h4>
            </div>
            <div className={clsx(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
              stat.up ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
            )}>
              {stat.change}
              {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
        ))}
      </div>

      {/* AI Highlights if available */}
      {analysis && (
          <div className="glass p-6 rounded-xl border-l-4 border-l-neon bg-gradient-to-r from-neon-light/20 to-transparent">
              <h3 className="text-neon-dark font-bold mb-3 flex items-center gap-2">
                 <BrainCircuit size={18} /> Daily AI Insight
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  {analysis.analysis || "Market analysis in progress..."}
              </p>
              <div className="flex gap-4">
                 {analysis.uptrend?.length > 0 && (
                     <div className="text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                         <span className="text-emerald-600 font-semibold block mb-1">UPTREND</span>
                         <span className="text-foreground font-bold">{analysis.uptrend.join(', ')}</span>
                     </div>
                 )}
                 {analysis.downtrend?.length > 0 && (
                     <div className="text-xs bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                         <span className="text-rose-600 font-semibold block mb-1">DOWNTREND</span>
                         <span className="text-foreground font-bold">{analysis.downtrend.join(', ')}</span>
                     </div>
                 )}
              </div>
          </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">Price Action</h3>
                <div className="flex gap-2">
                    {['1H', '1D', '1W'].map(tf => (
                        <button key={tf} className="px-3 py-1 text-xs rounded-md hover:bg-slate-100 text-slate-500 font-medium transition-colors">
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            <TrendChart data={chartData} />
        </div>

        {/* Top Movers Helper */}
        <div className="glass rounded-xl p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground">Top Movers</h3>
                <Activity className="text-neon w-5 h-5" />
            </div>
            
            <div className="space-y-4">
                {[
                    { name: 'SOL', price: '$145.20', change: '+12.5%', up: true },
                    { name: 'AVAX', price: '$45.32', change: '+8.2%', up: true },
                    { name: 'DOT', price: '$8.45', change: '-2.1%', up: false },
                    { name: 'MATIC', price: '$0.89', change: '-0.5%', up: false },
                ].map((coin, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold ring-1 ring-slate-200">
                                {coin.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{coin.name}</p>
                                <p className="text-xs text-slate-500">USDT</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-mono text-foreground font-medium">{coin.price}</p>
                             <p className={clsx("text-xs font-medium", coin.up ? "text-emerald-600" : "text-rose-600")}>
                                {coin.change}
                             </p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-lg border border-neon/50 text-neon-dark hover:bg-neon hover:text-white transition-all font-medium text-sm shadow-sm">
                View All Markets
            </button>
        </div>
      </div>
    </div>
  );
}
