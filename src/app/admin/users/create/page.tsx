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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, 
            request_quota: 5,
            email: email, // Required for user_profiles trigger
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">User Created</h2>
                <p className="text-gray-500 mb-8">
                    The user account has been successfully created.
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            setSuccess(false);
                            setEmail('');
                            setPassword('');
                            setRole('user');
                        }}
                        className="block w-full py-4 rounded-xl bg-neon text-white font-bold hover:bg-neon-dim transition-all"
                    >
                        Create Another User
                    </button>
                    <Link 
                        href="/admin"
                        className="block w-full py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                        Back to Admin Dashboard
                    </Link>
                </div>
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
        {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-neon/5 rounded-full blur-[120px]" />
      </div>

      <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/50 relative z-10 bg-white shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New User</h1>
          <p className="text-gray-500">Add a new user to the Trenova network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all placeholder:text-gray-400"
                placeholder="user@trenova.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Role</label>
            <div className="relative">
               <select
                 value={role}
                 onChange={(e) => setRole(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all appearance-none cursor-pointer"
               >
                 <option value="user">User</option>
                 <option value="admin">Admin</option>
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ArrowRight className="rotate-90" size={16} /> 
               </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-white",
              loading 
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-neon hover:bg-neon-dim hover:shadow-lg"
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
