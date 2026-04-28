'use client';

import { useLanguage } from '@/context/LanguageContext';

const tradeResults = [
  { roi: '+327.94%', pair: 'FOGOUSDT', type: 'Short 50×', exchange: 'Bybit', image: '/FOGOUSDT.jpg' },
  { roi: '+280.44%', pair: 'RIVERUSDT', type: 'Short 25×', exchange: 'Bybit', image: '/RIVERUSDT.jpg.jpeg' },
  { roi: '+244.55%', pair: 'PIPPINUSDT', type: 'Long 20×', exchange: 'Bybit', image: '/PIPPINUSDT.jpg.jpeg' },
];

const tickerResults = [
  { roi: '+240.12%', pair: 'KITEUSDT', type: 'Long 50×', exchange: 'Bybit', image: '/KITEUSDT.jpg.jpeg' },
  { roi: '+217.06%', pair: 'BTCUSDT', type: 'Long 100×', exchange: 'Bybit', image: '/BTCUSDT.jpg' },
  { roi: '+218.40%', pair: 'SOLUSDT', type: 'Long 100×', exchange: 'Bybit', image: '/SOLUSDT.jpg.jpeg' },
  { roi: '+193.87%', pair: 'ETHUSDT', type: 'Long 100×', exchange: 'Bybit', image: '/ETHUSDT.jpg' },
  { roi: '+164.37%', pair: 'BTCUSDT', type: 'Short 100×', exchange: 'Bybit', image: '/BTCUSDT.jpg' },
  { roi: '+128.07%', pair: 'HYPEUSDT', type: 'Buy 20×', exchange: 'OKX', image: '/HYPEUSDT.jpeg' },
  { roi: '+127.5%', pair: 'LITUSDT', type: 'Buy 14×', exchange: 'OKX', image: '/LITUSDT.jpg' },
  { roi: '+112.33%', pair: 'TIAUSDT', type: 'Buy 10×', exchange: 'OKX', image: '/TIAUSDT.jpeg' },
  { roi: '+98.76%', pair: 'GIGGLEUSDT', type: 'Buy 10×', exchange: 'OKX', image: '/GIGGLEUSDT.jpeg' },
];

export default function TerminalProof() {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-slate-950 border-t border-slate-800 font-mono text-slate-300">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            ── TRACK RECORD NYATA
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Bukan Klaim.<br /><span className="text-neon">Ini Buktinya.</span>
          </h2>
          <p className="text-slate-500 text-[13px] max-w-xl leading-[1.8]">
            Hasil trade nyata dari komunitas Trenova Intelligence — long maupun short, market bullish maupun bearish. Screenshot asli, tidak diedit.
          </p>
        </div>

        {/* Top 3 Trade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-800 border border-slate-800 mb-6">
          {tradeResults.map((trade, i) => (
            <div key={i} className="bg-slate-950 p-6 relative group hover:bg-slate-900/50 transition-colors">
              {/* ROI Header */}
              <div className="mb-4 text-left">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">{trade.roi}</div>
                <div className="text-[10px] text-slate-500 uppercase mt-1">{trade.pair} · {trade.type} · {trade.exchange}</div>
              </div>

              {/* Trade Image */}
              <div className="rounded overflow-hidden border border-slate-800/50 bg-slate-900">
                <img 
                  src={trade.image} 
                  alt={trade.pair} 
                  className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                />
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Ticker Row - More Results */}
        <div className="border border-slate-800 bg-slate-950 p-4 mb-6">
          <div className="text-[9px] text-slate-600 uppercase tracking-[0.12em] text-center mb-4">
            LEBIH BANYAK HASIL → GESER →
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {tickerResults.map((t, i) => (
              <div key={i} className="flex-shrink-0 bg-slate-900/30 border border-slate-800/50 p-3 text-left w-[180px] rounded hover:bg-slate-900/80 transition-colors">
                <div className="text-emerald-400 font-bold text-base tracking-tight">{t.roi}</div>
                <div className="text-[9px] text-slate-500 mt-0.5 uppercase mb-3">{t.pair} · {t.type} · {t.exchange}</div>
                <div className="rounded overflow-hidden border border-slate-800/30">
                  <img src={t.image} alt={t.pair} className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Testimonials remain the same below */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 mb-px">
          {[
            { num: '327', suffix: '%+', label: 'MAX ROI', sub: 'Rekor tertinggi komunitas' },
            { num: '1,200', suffix: '+', label: 'TOTAL ANALISA', sub: 'Diproses oleh AI' },
            { num: '4.8', suffix: '/5', label: 'USER RATING', sub: '100+ ulasan verified' },
            { num: '<60', suffix: 's', label: 'ANALISA TIME', sub: 'Rata-rata per sesi' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-950 p-6 text-center relative">
              <div className="text-3xl md:text-[40px] font-bold text-neon leading-none mb-1.5 tracking-tight">
                {s.num}<span className="text-lg text-neon/70">{s.suffix}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.06em] mb-1">{s.label}</div>
              <div className="text-[10px] text-slate-700">{s.sub}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon/50 to-transparent" />
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-800 border border-slate-800">
          {[
            { initials: 'AR', name: 'Andi R.', role: 'Swing Trader · 2 tahun', quote: 'Analisa dari Trenova sangat detail. ROI saya naik signifikan sejak pakai tools ini. Sangat recommended!' },
            { initials: 'DM', name: 'Dimas M.', role: 'Day Trader · Binance', quote: 'Hemat waktu banget! Biasanya analisa manual 1 jam, sekarang cukup 1 menit. Output-nya juga langsung bisa dicopy.' },
            { initials: 'SF', name: 'Sarah F.', role: 'Crypto Enthusiast', quote: 'Awalnya ragu, tapi setelah coba langsung berlangganan. AI-nya beneran canggih dan risk management-nya lengkap.' },
          ].map((tItem, i) => (
            <div key={i} className="bg-slate-950 p-7">
              <p className="text-[11px] text-slate-300 leading-[1.9] mb-5 italic">
                <span className="text-neon text-base not-italic">&ldquo;</span>{tItem.quote}<span className="text-neon text-base not-italic">&rdquo;</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-neon/[0.06] border border-neon/20 text-[11px] font-bold text-neon flex-shrink-0">
                  {tItem.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white">{tItem.name}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{tItem.role}</div>
                </div>
                <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-[0.04em] flex-shrink-0">
                  VERIFIED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
