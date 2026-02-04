'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function FeedbackPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, subject, message } = formData;
    const body = `Name: ${name}\n\nMessage:\n${message}`;
    window.location.href = `mailto:trenova151@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-neon selection:text-white pb-20 transition-colors duration-300">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 transition-colors duration-300">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white transition-colors text-sm md:text-base">{t('btn_back_home')}</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
             </div>
             <div className="flex items-center gap-2">
                <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg shadow-md object-contain bg-white dark:bg-slate-800" />
                <span className="font-bold tracking-tight text-foreground hidden sm:block">TRENOVA</span>
             </div>
              {/* Mobile Toggle */}
             <div className="sm:hidden flex items-center gap-2">
                <ThemeToggle />
             </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 max-w-2xl pt-32">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 text-neon text-xs font-bold uppercase tracking-wider mb-6">
              <MessageSquare size={14} />
              {t('feedback_pill')}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('feedback_title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              {t('feedback_desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('feedback_name_label')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={t('feedback_name_placeholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('feedback_subject_label')}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={t('feedback_subject_placeholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('feedback_message_label')}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon text-slate-900 dark:text-white transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={t('feedback_message_placeholder')}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {t('feedback_send_btn')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('feedback_footer_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
