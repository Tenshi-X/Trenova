'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user', // Enforce user role for web registration
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      // for blueprint, we might not have email confirmation on, so trying to login immediately or just showing success
      
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
             <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 text-center">
                <div className="w-16 h-16 bg-neon/20 rounded-full flex items-center justify-center mx-auto mb-6 text-neon">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Registration Successful</h2>
                <p className="text-gray-400 mb-8">
                    Your account has been created. Please check your email for verification.
                </p>
                <Link 
                    href="/login"
                    className="block w-full py-4 rounded-xl bg-neon text-black font-bold hover:bg-neon-dark transition-all"
                >
                    Proceed to Login
                </Link>
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-neon/5 rounded-full blur-[120px]" />
      </div>

      <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Create Access</h1>
          <p className="text-gray-400">Join the Trenova network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all placeholder:text-gray-600"
                placeholder="trader@trenova.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
          </div>



          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
              loading 
                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-neon text-black hover:bg-neon-dark hover:scale-[1.02]"
            )}
          >
            {loading ? 'Creating Account...' : (
              <>
                Initialize Access <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have access?{' '}
          <Link href="/login" className="text-neon hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
