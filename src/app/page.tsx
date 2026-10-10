'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import PricingCatalog from '@/components/PricingCatalog';

export default function LandingPage() {
  const { language } = useLanguage();
  const id = language !== 'en';
  return <main className="min-h-screen bg-slate-950 text-white">
    <nav className="border-b border-slate-800 px-5 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="text-xl font-black tracking-widest text-neon">TRENOVA</Link>
      <div className="flex items-center gap-3"><LanguageSwitcher /><ThemeToggle />
        <Link href="/sign-in" className="rounded-lg border border-neon px-4 py-2 text-sm font-bold text-neon">{id ? 'Masuk' : 'Sign in'}</Link>
      </div>
    </nav>
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <p className="text-sm font-bold uppercase tracking-widest text-neon">Trenova Intelligence</p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight">{id ? 'Analisis pasar yang jelas, dalam satu dashboard.' : 'Clear market analysis in one dashboard.'}</h1>
        <p className="text-slate-300 leading-relaxed text-lg">{id
          ? 'Pilih koin dan timeframe, lihat data pasar, lalu dapatkan analisis AI dengan level transaksi yang diperiksa sebelum ditampilkan. Simpan pilihan dan tinjau riwayat pribadi Anda.'
          : 'Choose a coin and timeframe, inspect market data, then receive AI analysis with trade levels checked before display. Save your preferences and review your private history.'}</p>
        <div className="flex flex-wrap gap-3"><Link href="#pricing" className="rounded-xl bg-neon px-6 py-3 font-bold text-slate-950">{id ? 'Lihat paket' : 'View plans'}</Link>
          <Link href="/dashboard" className="rounded-xl border border-slate-600 px-6 py-3 font-bold">{id ? 'Buka dashboard' : 'Open dashboard'}</Link></div>
      </div>
      <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex justify-between text-sm text-slate-400"><span>BTC/USDT · 1h</span><span>{id ? 'Contoh tampilan' : 'Illustration'}</span></div>
        <div className="h-24 rounded-xl bg-gradient-to-r from-emerald-900/30 via-slate-800 to-blue-900/30 flex items-center justify-center text-slate-400">Market · Volume · Momentum</div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg bg-slate-800 p-3">LONG</div><div className="rounded-lg bg-slate-800 p-3">SHORT</div><div className="rounded-lg bg-slate-800 p-3">WAIT</div></div>
        <p className="text-xs text-slate-400">{id ? 'Hasil mengikuti data saat analisis. Kekuatan sinyal bukan peluang keberhasilan.' : 'Results follow the data at analysis time. Signal strength is not a success probability.'}</p>
      </div>
    </section>
    <section className="border-y border-slate-800 bg-slate-900/50 px-5 py-16">
      <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-8">
        {[
          [id ? 'Data sesuai timeframe' : 'Timeframe-specific data', id ? 'Candle dan indikator dihitung dari timeframe yang Anda pilih.' : 'Candles and indicators follow your selected timeframe.'],
          [id ? 'Hasil tervalidasi' : 'Validated results', id ? 'Setup ditampilkan jika arah, level, dan rasio risiko masuk akal; jika belum, hasil WAIT.' : 'Setups appear when direction, levels, and risk reward pass validation; otherwise WAIT.'],
          [id ? 'Pilihan pribadi' : 'Personal preferences', id ? 'Simpan preset, favorit, catatan, dan tinjau riwayat analisis.' : 'Save presets, favorites, notes, and review analysis history.'],
        ].map(([title, body]) => <div key={title} className="space-y-2"><h2 className="text-xl font-bold text-neon">{title}</h2><p className="text-slate-400">{body}</p></div>)}
      </div>
    </section>
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 space-y-8 text-foreground bg-white dark:bg-slate-950">
      <div className="text-center"><h2 className="text-3xl md:text-4xl font-black">{id ? 'Pilih paket' : 'Choose a plan'}</h2>
        <p className="mt-3 text-slate-500">{id ? 'Pembelian melalui toko; admin mengaktifkan akses setelah pesanan diverifikasi.' : 'Purchase through the store; an admin activates access after verifying the order.'}</p></div>
      <PricingCatalog />
    </section>
    <footer className="border-t border-slate-800 px-5 py-8 text-center text-sm text-slate-500">© Trenova Intelligence · {id ? 'Analisis membantu keputusan Anda, bukan jaminan hasil.' : 'Analysis supports your decisions; results are not guaranteed.'}</footer>
  </main>;
}
