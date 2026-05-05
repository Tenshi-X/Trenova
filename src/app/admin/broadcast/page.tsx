'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, ChevronLeft, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { sendBroadcastEmail, sendNewAccountEmail } from './actions';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import clsx from 'clsx';

export default function BroadcastEmailPage() {
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'broadcast' | 'new-account'>('broadcast');

  const defaultTemplate = `Halo Kak,\n\nKami merindukan Anda di Trenova! Kami terus melakukan pembaruan dan memberikan konten/analisa terbaik untuk pengalaman trading Anda.\n\nYuk, kembali berlangganan dan dapatkan akses ke semua fitur eksklusif kami.\n\nKlik tautan di bawah ini untuk mengunjungi profil toko kami dan melakukan perpanjangan:\nhttps://id.shp.ee/tg8AFZtY\n\nSalam Hangat,\nTim Trenova`;

  // Broadcast state
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('Mari Kembali Trading Bersama Trenova!');
  const [content, setContent] = useState(defaultTemplate);

  // New Account state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleBroadcastSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    
    const emailList = emails.split(/[\n,]+/).map(e => e.trim()).filter(e => e !== '');

    if (emailList.length === 0) return setResult({ success: false, message: 'Harap masukkan setidaknya satu alamat email.' });
    if (!subject.trim()) return setResult({ success: false, message: 'Harap masukkan judul email.' });
    if (!content.trim()) return setResult({ success: false, message: 'Harap masukkan deskripsi email.' });

    setLoading(true);
    try {
      const res = await sendBroadcastEmail(emailList, subject, content);
      setResult({ success: res.success, message: res.success ? (res.message || 'Email berhasil dikirim.') : (res.error || 'Gagal mengirim email.') });
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewAccountSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      return setResult({ success: false, message: 'Harap masukkan email dan password.' });
    }

    setLoading(true);
    try {
      const res = await sendNewAccountEmail(newUserEmail.trim(), newUserPassword.trim());
      setResult({ success: res.success, message: res.success ? res.message : (res.error || 'Gagal mengirim email.') });
      if (res.success) {
         setNewUserEmail('');
         setNewUserPassword('');
      }
    } catch (err: any) {
       setResult({ success: false, message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-20 p-6 md:p-8 pt-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Mail className="text-neon-dark" /> Broadcast & Notifikasi
          </h1>
          <p className="text-slate-500">Kirim email pemberitahuan massal atau data akun baru.</p>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center flex-wrap">
             <div className="flex items-center gap-2 mr-0 sm:mr-2 border-r border-slate-200 dark:border-slate-800 pr-2 sm:pr-4">
                <LanguageSwitcher />
                <ThemeToggle />
             </div>
             <Link 
                href="/admin"
                className="glass hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 font-semibold border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5 text-sm"
             >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Kembali</span>
             </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
         
         {/* Tabs */}
         <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6 w-fit">
            <button 
              type="button"
              onClick={() => { setActiveTab('broadcast'); setResult(null); }}
              className={clsx(
                "px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'broadcast' ? "bg-white dark:bg-slate-900 text-foreground shadow-sm" : "text-slate-500 hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800"
              )}
            >
              <Mail size={16} /> Broadcast Promo
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('new-account'); setResult(null); }}
              className={clsx(
                "px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'new-account' ? "bg-white dark:bg-slate-900 text-foreground shadow-sm" : "text-slate-500 hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800"
              )}
            >
              <UserPlus size={16} /> Kirim Data Akun Baru
            </button>
         </div>

         {result && (
            <div className={clsx(
              "p-4 mb-6 rounded-xl border flex items-start gap-3",
              result.success 
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" 
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            )}>
              {result.success ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
              <div>
                 <h3 className="font-bold">{result.success ? "Berhasil" : "Gagal"}</h3>
                 <p className="text-sm mt-1">{result.message}</p>
              </div>
            </div>
         )}

         <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             
             {activeTab === 'broadcast' && (
                <form onSubmit={handleBroadcastSend} className="space-y-6 animate-in fade-in duration-300">
                   {/* Email List Input */}
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                         Daftar Email Tujuan <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 mb-2">Pisahkan dengan koma (,) atau baris baru (enter).</p>
                      <textarea 
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        rows={5}
                        placeholder="contoh1@gmail.com, contoh2@gmail.com&#10;contoh3@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 text-sm font-mono placeholder:text-slate-400"
                        required
                      />
                   </div>

                   {/* Subject Input */}
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                         Judul Email (Subject) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Masukkan judul email"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 text-sm placeholder:text-slate-400"
                        required
                      />
                   </div>

                   {/* Content Input */}
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                         Deskripsi Email <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 mb-2">Pesan ini akan dikonversi ke HTML secara otomatis (baris baru menjadi &lt;br&gt;).</p>
                      <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={12}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 text-sm placeholder:text-slate-400"
                        required
                      />
                   </div>

                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                       <button 
                          type="submit"
                          disabled={loading}
                          className="bg-neon text-white px-6 py-3 rounded-xl font-bold hover:bg-neon-dim shadow-md shadow-neon/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                       >
                          {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Send size={18} />
                          )}
                          {loading ? 'Mengirim...' : 'Kirim Email Promo'}
                       </button>
                   </div>
                </form>
             )}

             {activeTab === 'new-account' && (
                <form onSubmit={handleNewAccountSend} className="space-y-6 animate-in fade-in duration-300">
                   
                   {/* Email Input */}
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                         Email Pelanggan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="email.pelanggan@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 text-sm placeholder:text-slate-400"
                        required
                      />
                   </div>

                   {/* Password Input */}
                   <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                         Password Akses <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Masukkan password akun baru"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 text-sm placeholder:text-slate-400 font-mono"
                        required
                      />
                   </div>

                   <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Template Email yang Akan Dikirim:</h4>
                      <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
{`Halo Kak,

Terima kasih telah melakukan pembelian akses Trenova Intelligence.
Berikut adalah detail login akun Anda:

Email: ${newUserEmail || '[Email Pelanggan]'}
Password: ${newUserPassword || '[Password Akses]'}

Silakan login melalui tautan berikut:
https://trenova-intelligence.vercel.app/login`}
                      </div>
                   </div>

                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                       <button 
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                       >
                          {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Send size={18} />
                          )}
                          {loading ? 'Mengirim...' : 'Kirim Data Akun'}
                       </button>
                   </div>
                </form>
             )}

         </div>
      </div>
    </div>
  );
}
