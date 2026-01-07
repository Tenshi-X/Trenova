'use client';

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
    imageLimit: 15, // Default
    chatLimit: 50   // Default
  });

  // Bulk User State
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{count: number, failures: number} | null>(null);


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
        formData.imageLimit,
        formData.chatLimit
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
          
          setBulkResult({ count: res.count || 0, failures: res.failures || 0 });
          
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
        <Link href="/admin" className="text-slate-500 hover:text-foreground flex items-center gap-2 mb-4 text-sm font-semibold">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <UserPlus className="text-neon" /> User Provisioning
        </h1>
        <p className="text-slate-500 mt-2">
          Create verified users directly in the database.
        </p>
      </div>

      <div className="glass bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
               onClick={() => setActiveTab('single')}
               className={clsx(
                   "flex-1 py-4 text-sm font-bold transition-all",
                   activeTab === 'single' ? "bg-slate-50 text-neon border-b-2 border-neon" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
               )}
            >
               Single User
            </button>
            <button 
               onClick={() => setActiveTab('bulk')}
               className={clsx(
                   "flex-1 py-4 text-sm font-bold transition-all",
                   activeTab === 'bulk' ? "bg-slate-50 text-neon border-b-2 border-neon" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
               )}
            >
               Bulk Generator (Dummy)
            </button>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-100 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            
            {/* SINGLE USER FORM */}
            {activeTab === 'single' && (
                <>
                    {success && (
                        <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-3">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                            />

                        </div>

                        <div className="space-y-2">
                             <label className="text-sm font-semibold text-foreground">Image Analysis Limit (Daily)</label>
                             <input 
                                type="number"
                                value={formData.imageLimit}
                                onChange={e => setFormData({...formData, imageLimit: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-sm font-semibold text-foreground">Chat Analysis Limit (Daily)</label>
                             <input 
                                type="number"
                                value={formData.chatLimit}
                                onChange={e => setFormData({...formData, chatLimit: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                             />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <Link href="/admin" className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-center transition-colors">
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
                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
                        <AlertCircle className="shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold">About Dummy Generation</p>
                            <p className="mt-1">
                                This will generate random users with email format <code>user_xxxx@example.com</code> and password <code>pass_xxxx</code>. 
                                They will be auto-verified and ready to login.
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
                                className="flex-1 accent-neon h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                             />
                             <div className="w-20 text-center font-mono font-bold text-2xl text-neon border border-slate-200 rounded-lg py-2">
                                {bulkCount}
                             </div>
                        </div>
                     </div>

                     {bulkResult && (
                        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-3 animate-in fade-in">
                            <CheckCircle size={20} />
                            <div>
                                <p className="font-bold">Generation Complete!</p>
                                <p className="text-sm">Successfully created {bulkResult.count} users. ({bulkResult.failures} failed)</p>
                            </div>
                        </div>
                     )}

                     <div className="pt-4 flex gap-4">
                        <button 
                            onClick={handleBulkGenerate}
                            disabled={bulkLoading}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
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
