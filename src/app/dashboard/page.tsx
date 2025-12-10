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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Market Overview</h1>
            <p className="text-gray-400">Real-time trading insights and trends.</p>
          </div>
          <div className="text-right">
             <span className="flex items-center gap-2 text-xs font-mono text-neon bg-neon/10 px-3 py-1 rounded-full border border-neon/20">
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
          <div key={i} className="glass p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <h4 className="text-2xl font-bold text-white">{stat.value}</h4>
            </div>
            <div className={clsx(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded bg-opacity-20",
              stat.up ? "text-neon bg-neon" : "text-red-500 bg-red-500"
            )}>
              {stat.change}
              {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
        ))}
      </div>

      {/* AI Highlights if available */}
      {analysis && (
          <div className="glass p-6 rounded-xl border border-neon/30 bg-neon/5">
              <h3 className="text-neon font-bold mb-3 flex items-center gap-2">
                 <BrainCircuit size={18} /> Daily AI Insight
              </h3>
              <p className="text-gray-200 text-sm leading-relaxed mb-4">
                  {analysis.analysis || "Market analysis in progress..."}
              </p>
              <div className="flex gap-4">
                 {analysis.uptrend?.length > 0 && (
                     <div className="text-xs">
                         <span className="text-gray-500 block mb-1">UPTREND</span>
                         <span className="text-neon font-bold">{analysis.uptrend.join(', ')}</span>
                     </div>
                 )}
                 {analysis.downtrend?.length > 0 && (
                     <div className="text-xs">
                         <span className="text-gray-500 block mb-1">DOWNTREND</span>
                         <span className="text-red-400 font-bold">{analysis.downtrend.join(', ')}</span>
                     </div>
                 )}
              </div>
          </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <TrendChart data={chartData} />
        </div>

        {/* Top Movers Helper */}
        <div className="glass rounded-xl p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-white">Top Movers</h3>
                <Activity className="text-neon w-5 h-5" />
            </div>
            
            <div className="space-y-4">
                {[
                    { name: 'SOL', price: '$145.20', change: '+12.5%', up: true },
                    { name: 'AVAX', price: '$45.32', change: '+8.2%', up: true },
                    { name: 'DOT', price: '$8.45', change: '-2.1%', up: false },
                    { name: 'MATIC', price: '$0.89', change: '-0.5%', up: false },
                ].map((coin, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                {coin.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-white">{coin.name}</p>
                                <p className="text-xs text-gray-500">USDT</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-mono text-white">{coin.price}</p>
                             <p className={clsx("text-xs font-medium", coin.up ? "text-neon" : "text-red-500")}>
                                {coin.change}
                             </p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-lg border border-neon/50 text-neon hover:bg-neon hover:text-black transition-all font-medium text-sm">
                View All Markets
            </button>
        </div>
      </div>
    </div>
  );
}
