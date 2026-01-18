'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, Brain, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
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

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
      
    } catch (err: any) {
      console.error("Login Error:", err);
      // Only stop loading if there is an error. 
      // If success, keep loading true to maintain the "Welcome screen" until navigation completes.
      setLoading(false); 
      
      if (err.message === 'fetch failed' || (err.name === 'AuthRetryableFetchError')) {
           setError("Connection Error: Unable to reach the server. Please check your internet connection and try again.");
      } else {
           setError(err.message || 'Failed to login');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background font-sans">
      
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
                 Bersiap menghasilkan <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-500/20 dark:border-emerald-400/20">$1.000.000</span> dengan AI
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400">Access your Trenova terminal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
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
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
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
            {loading ? 'Authenticating...' : (
              <>
                Login to Terminal <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
