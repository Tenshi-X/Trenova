'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function RegisterClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 2000)); 

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user'
          }
        }
      });

      if (error) {
        throw error;
      }

      // Automatically redirect to dashboard, relying on dashboard to create user_profile if needed
      router.push('/dashboard');
      router.refresh();
      
    } catch (err: any) {
      console.error("Register Error:", err);
      setLoading(false); 
      
      if (err.message === 'fetch failed' || (err.name === 'AuthRetryableFetchError')) {
           setError("Connection Error: Unable to reach the server. Please check your internet connection and try again.");
      } else {
           setError(err.message || 'Failed to register');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setLoading(false);
      setError(err.message || 'Failed to login with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background font-sans">
      
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-500 hover:text-neon transition-colors font-semibold group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        {t('btn_back_home') || 'Back Home'}
      </Link>

      {/* Language & Theme Controls */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Full Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#020617] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
           {/* Animated Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon/10 dark:bg-neon/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
           
           <div className="relative z-10 flex flex-col items-center">
               <div className="mb-8 relative">
                   <div className="absolute inset-0 bg-neon blur-xl opacity-30 dark:opacity-50 animate-pulse" />
                   <Sparkles className="w-20 h-20 text-neon animate-bounce relative z-10" fill="currentColor" />
               </div>
               
               <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                 Welcome to <span className="text-neon inline-block animate-[pulse_3s_infinite]">The Intelligence AI</span>
               </h1>
               
               <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 font-medium animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150">
                 Mempersiapkan akun <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-500/20 dark:border-emerald-400/20">Trenova</span> Anda
               </p>

               {/* Loading Indicator */}
               <div className="mt-12 flex items-center gap-2">
                   <div className="w-2 h-2 bg-neon rounded-full animate-[bounce_1s_infinite]" />
                   <div className="w-2 h-2 bg-neon rounded-full animate-[bounce_1s_infinite_0.2s]" />
                   <div className="w-2 h-2 bg-neon rounded-full animate-[bounce_1s_infinite_0.4s]" />
               </div>
           </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-neon-light/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl relative z-10 shadow-xl border-t-4 border-t-neon bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-x border-b border-white/20 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Daftar Akun</h1>
          <p className="text-slate-500 dark:text-slate-400">Buat akun untuk memulai</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('email_label') || 'Email'}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition-all placeholder:text-slate-400"
                placeholder="trader@trenova.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('password_label') || 'Password'}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-12 text-slate-900 dark:text-white focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-neon transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-white shadow-md hover:shadow-lg",
              loading 
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-neon hover:bg-neon-dim transform hover:-translate-y-0.5"
            )}
          >
            {loading ? t('authenticating') || 'Processing...' : (
              <>
                Daftar Sekarang <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Atau lanjutkan dengan</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="mt-6 w-full py-3 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm font-semibold"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-neon font-semibold hover:underline">
            Login di sini
          </Link>
        </p>

      </div>
    </div>
  );
}
