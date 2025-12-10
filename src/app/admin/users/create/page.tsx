'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function CreateUserPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: role,
            request_quota: 5,
          },
        },
      });

      if (signUpError) {
        console.error('Supabase SignUp Error:', signUpError);
        throw signUpError;
      }

      // Manual fallback insertion into user_profiles
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email.trim(),
            role: role,
            request_quota: 5,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (profileError) {
           console.warn("Manual profile insertion failed (might be handled by trigger or RLS):", profileError);
           // We don't throw here to avoid blocking success UI if the trigger actually worked
        }
      }

      setSuccess(true);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background font-sans">
             <div className="glass w-full max-w-md p-8 rounded-2xl border-t-4 border-t-neon text-center relative z-10 shadow-lg">
                <div className="w-16 h-16 bg-neon-light rounded-full flex items-center justify-center mx-auto mb-6 text-neon-dark">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">User Created</h2>
                <p className="text-slate-500 mb-8">
                    The user account has been successfully created. Please check your email for verification.
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            setSuccess(false);
                            setEmail('');
                            setPassword('');
                            setRole('user');
                        }}
                        className="block w-full py-4 rounded-xl bg-neon text-white font-bold hover:bg-neon-dim transition-all shadow-md transform hover:-translate-y-0.5"
                    >
                        Create Another User
                    </button>
                    <Link 
                        href="/login"
                        className="block w-full py-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                    >
                        Go to Login
                    </Link>
                </div>
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background font-sans">
        {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-neon-light/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="glass w-full max-w-md p-8 rounded-2xl relative z-10 shadow-lg border-t-4 border-t-neon">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New User</h1>
          <p className="text-slate-500">Add a new user to the Trenova network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon-light transition-all placeholder:text-slate-400"
                placeholder="user@trenova.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-neon transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon-light transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground ml-1">Role</label>
            <div className="relative group">
               <select
                 value={role}
                 onChange={(e) => setRole(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon-light transition-all appearance-none cursor-pointer"
               >
                 <option value="user">User</option>
                 <option value="admin">Admin</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-neon">
                 <ArrowRight className="rotate-90" size={16} /> 
               </div>
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
            {loading ? 'Creating...' : (
              <>
                Create User <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
