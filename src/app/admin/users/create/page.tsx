'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Save, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { createAndProvisionUser, generateDummyUsers } from '../../actions';
import clsx from 'clsx';

export default function CreateUserPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single User State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    quota: 30,
    analysisLimit: 150   // Default
  });

  // Bulk User State
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{count: number, failures: number, users?: any[]} | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await createAndProvisionUser(
        formData.email,
        formData.password,
        formData.role,
        formData.quota,
        formData.analysisLimit
      );

      if (!res.success) throw new Error(res.error);

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
      setBulkLoading(true);
      setError(null);
      setBulkResult(null);

      try {
          const res = await generateDummyUsers(bulkCount);
          if (!res.success) throw new Error(res.error || "Bulk generation failed");
          
          setBulkResult({ count: res.count || 0, failures: res.failures || 0, users: res.users });
          
          if ((res.count || 0) > 0) {
             // Optional: Redirect after success? Or just let them stay to generate more.
             // We'll let them stay.
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setBulkLoading(false);
      }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <Link href="/admin" className="text-slate-500 dark:text-slate-400 hover:text-foreground flex items-center gap-2 mb-4 text-sm font-semibold">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <UserPlus className="text-neon" /> User Provisioning
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Create verified users directly in the database.
        </p>
      </div>

      <div className="glass bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button 
               onClick={() => setActiveTab('single')}
               className={clsx(
                   "flex-1 py-4 text-sm font-bold transition-all",
                   activeTab === 'single' ? "bg-slate-50 dark:bg-slate-800 text-neon border-b-2 border-neon" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
               )}
            >
               Single User
            </button>
            <button 
               onClick={() => setActiveTab('bulk')}
               className={clsx(
                   "flex-1 py-4 text-sm font-bold transition-all",
                   activeTab === 'bulk' ? "bg-slate-50 dark:bg-slate-800 text-neon border-b-2 border-neon" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
               )}
            >
               Bulk Generator (Dummy)
            </button>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            
            {/* SINGLE USER FORM */}
            {activeTab === 'single' && (
                <>
                    {success && (
                        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                        <CheckCircle size={20} />
                        <div>
                            <p className="text-sm font-bold">User Created Successfully!</p>
                            <p className="text-xs">Redirecting to admin dashboard...</p>
                        </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Email Address</label>
                        <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                        placeholder="user@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Password</label>
                        <input 
                        type="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                        placeholder="Set initial password..."
                        />
                        <p className="text-xs text-slate-400">Must be at least 6 characters.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Role</label>
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Subscription Duration (Days)</label>
                            <input 
                                type="number"
                                value={formData.quota}
                                onChange={e => setFormData({...formData, quota: Number(e.target.value)})}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                            />
                            <p className="text-xs text-slate-400">Starts on first login</p>

                        </div>

                        <div className="space-y-2 col-span-2">
                             <label className="text-sm font-semibold text-foreground">Analysis Limit (Total)</label>
                             <input 
                                type="number"
                                value={formData.analysisLimit}
                                onChange={e => setFormData({...formData, analysisLimit: Number(e.target.value)})}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                             />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                        <Link href="/admin" className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-colors">
                            Cancel
                        </Link>
                        <button 
                            type="submit"
                            disabled={loading || success}
                            className="flex-1 py-3 rounded-xl bg-neon text-white font-bold hover:bg-neon-dim shadow-lg shadow-neon/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating...' : (
                                <>
                                    <Save size={18} /> Create User
                                </>
                            )}
                        </button>
                    </div>
                    </form>
                </>
            )}

            {/* BULK GENERATOR FORM */}
            {activeTab === 'bulk' && (
                <div className="space-y-8">
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
                        <AlertCircle className="shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold">About Dummy Generation</p>
                            <p className="mt-1">
                                This will generate random users with email format <code>user_xxxx@trenova.com</code> and password <code>pass_xxxx</code>. 
                                They will be auto-verified and ready to login. Role will be 'user' and subscription will start on first login.
                            </p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="block text-sm font-bold text-foreground">Number of Users to Generate</label>
                        <div className="flex items-center gap-4">
                             <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                value={bulkCount}
                                onChange={e => setBulkCount(Number(e.target.value))}
                                className="flex-1 accent-neon h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                             />
                             <div className="w-20 text-center font-mono font-bold text-2xl text-neon border border-slate-200 dark:border-slate-800 rounded-lg py-2">
                                {bulkCount}
                             </div>
                        </div>
                     </div>

                     {bulkResult && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center gap-3 animate-in fade-in">
                                <CheckCircle size={20} />
                                <div>
                                    <p className="font-bold">Generation Complete!</p>
                                    <p className="text-sm">Successfully created {bulkResult.count} users. ({bulkResult.failures} failed)</p>
                                </div>
                            </div>

                            {/* CREDENTIALS TABLE */}
                            {(bulkResult.users && bulkResult.users.length > 0) && (
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                     <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-foreground">
                                         Generated Credentials (Copy these!)
                                     </div>
                                     <div className="max-h-64 overflow-y-auto">
                                         <table className="w-full text-left text-sm">
                                             <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0">
                                                 <tr>
                                                     <th className="px-4 py-2 font-semibold">Email</th>
                                                     <th className="px-4 py-2 font-semibold">Password</th>
                                                     <th className="px-4 py-2 font-semibold">Role</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                 {bulkResult.users.map((u: any, i: number) => (
                                                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                         <td className="px-4 py-2 font-mono">{u.email}</td>
                                                         <td className="px-4 py-2 font-mono text-slate-600 dark:text-slate-400">{u.password}</td>
                                                         <td className="px-4 py-2">
                                                             <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                                                 {u.role}
                                                             </span>
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                </div>
                            )}
                        </div>
                     )}

                     <div className="pt-4 flex gap-4">
                        <button 
                            onClick={handleBulkGenerate}
                            disabled={bulkLoading}
                            className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-700 shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                        >
                             {bulkLoading ? 'Generating...' : (
                                 <>
                                     <UserPlus size={18} /> Generate {bulkCount} Dummy Users
                                 </>
                             )}
                        </button>
                     </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
