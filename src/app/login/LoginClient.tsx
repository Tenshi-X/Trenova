'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import AuthShell from '@/components/AuthShell';

export default function LoginClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate a small delay to show the nice animation even if auth is instant
      await new Promise(r => setTimeout(r, 2000)); 

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // The profile role is protected by RLS; route guards verify it again server-side.
      const { data: profile } = await supabase.from('user_profiles')
        .select('role').eq('id', data.user.id).maybeSingle();
      router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard');
      router.refresh();
      
    } catch (err: unknown) {
      console.error("Login Error:", err);
      // Only stop loading if there is an error. 
      // If success, keep loading true to maintain the "Welcome screen" until navigation completes.
      setLoading(false); 
      
      if (err instanceof Error && (err.message === 'fetch failed' || err.name === 'AuthRetryableFetchError')) {
           setError(t('auth_conn_error'));
      } else {
           setError((err instanceof Error ? err.message : 'Terjadi kesalahan.') || 'Failed to login');
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
    } catch (err: unknown) {
      console.error("Google Auth Error:", err);
      setLoading(false);
      setError((err instanceof Error ? err.message : 'Terjadi kesalahan.') || 'Failed to login with Google');
    }
  };

  return (
    <AuthShell mode="login" loading={loading}>
        {error && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('email_label')}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                id="auth-email"
                autoComplete="email"
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
            <label htmlFor="auth-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('password_label')}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                id="auth-password"
                autoComplete="current-password"
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
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-slate-950 uppercase tracking-wide",
              loading 
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-neon hover:bg-neon-dark"
            )}
          >
            {loading ? t('authenticating') : (
              <>
                {t('login_btn')} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">{t('auth_divider')}</span>
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
          {t('auth_no_account')}{' '}
          <Link href="/register" className="text-neon font-semibold hover:underline">
            {t('auth_register_link')}
          </Link>
        </p>

    </AuthShell>
  );
}
