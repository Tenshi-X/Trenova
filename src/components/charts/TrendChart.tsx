'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendData } from '@/lib/api';

interface TrendChartProps {
  data: TrendData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
      return (
          <div className="w-full h-[400px] glass rounded-xl p-4 flex items-center justify-center">
              <p className="text-gray-400">No market data available yet. (Run the Dashboard function)</p>
          </div>
      )
  }

  return (
    <div className="w-full h-[400px] glass rounded-xl p-4">
      <h3 className="text-neon mb-4 font-bold tracking-wider">BTC/USD TREND</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="datetime" stroke="#666" fontSize={12} tickLine={false} />
          <YAxis stroke="#666" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #00FF88', borderRadius: '8px' }}
            itemStyle={{ color: '#00FF88' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00FF88" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
