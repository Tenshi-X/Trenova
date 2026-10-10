'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type Plan = {
  code: string; title_id: string; title_en: string; duration_days: number;
  analysis_quota: number; price_idr: number; checkout_url: string;
};

export default function PricingCatalog() {
  const { language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/plans').then((response) => response.ok ? response.json() : { plans: [] })
      .then((payload) => setPlans(payload.plans ?? [])).finally(() => setLoaded(true));
  }, []);
  if (!loaded) return <p className="text-center text-slate-500">Memuat paket…</p>;
  if (!plans.length) return <p className="text-center text-slate-500">Katalog paket sedang diperbarui. Hubungi admin untuk pembelian.</p>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {plans.map((plan) => <article key={plan.code} className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-3">
      <h3 className="text-xl font-black text-foreground">{language === 'en' ? plan.title_en : plan.title_id}</h3>
      <p className="text-sm text-slate-500">{plan.duration_days} hari · {plan.analysis_quota ? `${plan.analysis_quota} analisis` : 'Perpanjang akses'}</p>
      <strong className="text-2xl text-foreground">Rp{plan.price_idr.toLocaleString('id-ID')}</strong>
      <a href={plan.checkout_url} target="_blank" rel="noopener noreferrer" className="mt-auto rounded-xl bg-neon px-4 py-3 text-center font-bold text-white">Beli di toko</a>
    </article>)}
  </div>;
}
