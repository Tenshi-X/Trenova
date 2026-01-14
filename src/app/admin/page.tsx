'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Database, Shield, Edit, Trash2, Save, 
  UserPlus, RefreshCw, Trash
} from 'lucide-react';
import clsx from 'clsx';
import { getUserProfiles, provisionUser, deleteUserProfile, UserProfile } from './actions';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    role: 'user',
    quota: 30,
    analysisLimit: 150
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await getUserProfiles();

      if (!profileRes.success) throw new Error(profileRes.error || "Failed to fetch profiles");

      setProfiles(profileRes.profiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveChanges = async () => {
    if (!editingProfileId) return;
    
    const targetEmail = profiles.find(p => p.id === editingProfileId)?.email;
    if (!targetEmail) return;

    try {
      // Re-using provisionUser for updates as it handles upsert/update logic
      const res = await provisionUser(
          editingProfileId, 
          targetEmail, 
          formData.role, 
          formData.quota,
          formData.analysisLimit
      );
      if (!res.success) throw new Error(res.error);
      
      // Refresh Data
      await fetchData();
      
      // Reset State
      setEditingProfileId(null);
      setFormData({ role: 'user', quota: 30, analysisLimit: 150 });

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const startEdit = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    setFormData({ 
        role: profile.role, 
        quota: 0, // Default to 0 added
        analysisLimit: profile.analysis_limit || 150
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user from the App Profiles? (Auth account will remain)")) return;
    await deleteUserProfile(id);
    fetchData();
  };

  return (
    <div className="space-y-12 font-sans pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="text-neon-dark" /> Admin Console
          </h1>
          <p className="text-slate-500">Manage Authentication & Application Profiles</p>
        </div>
        <div className="flex gap-4">
             <Link 
                href="/admin/users/create"
                className="bg-neon hover:bg-neon-dim text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-md transition-all hover:-translate-y-0.5"
             >
                <UserPlus size={18} />
                Create New Auth
             </Link>
             <button 
                onClick={fetchData}
                className="glass px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-200 text-slate-600 hover:text-foreground"
             >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
             </button>
        </div>
      </div>

      {/* SECTION: APP USERS */}
      <section className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                 <Database className="text-slate-400" /> 
                 App Users (Profiles)
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                 From <code>public.user_profiles</code>
              </span>
          </div>

          <div className="glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">User Profile</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Limit</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profiles.length === 0 && !loading && (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-400">No profiles provisioned yet.</td></tr>
                  )}
                  {profiles.map((profile) => {
                    const endDate = profile.subscription_end_at ? new Date(profile.subscription_end_at) : null;
                    const now = new Date();
                    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isExpired = daysRemaining <= 0;

                    return (
                    <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                                {profile.email?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{profile.email}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={clsx(
                              "px-2.5 py-1 rounded text-xs font-medium border uppercase",
                              profile.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                              "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            )}>
                              {profile.role}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-foreground">
                            {profile.analysis_limit || 0} req
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          {endDate ? (
                              <div>
                                  <span className={clsx("font-mono text-sm font-bold", isExpired ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                                     {isExpired ? "EXPIRED" : `${daysRemaining.toFixed(0)} Days Left`}
                                  </span>
                                  <p className="text-xs text-slate-400">
                                    Ends: {endDate.toLocaleString('id-ID', { 
                                        timeZone: 'Asia/Jakarta',
                                        dateStyle: 'medium', 
                                        timeStyle: 'short' 
                                    })} WIB
                                  </p>
                              </div>
                          ) : (
                              <span className="text-sm text-slate-400 italic">No Active Sub</span>
                          )}
                      </td>
                      <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => startEdit(profile)}
                                    className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground transition-colors"
                                    title="Extend Subscription"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(profile.id)}
                                    className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    title="Delete Profile"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </section>

      {/* MODAL FOR EDITING */}
      {editingProfileId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-foreground">
                          Manage Subscription
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {profiles.find(p => p.id === editingProfileId)?.email}
                      </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
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
                          <label className="text-sm font-semibold text-foreground">Add Subscription (Days)</label>
                          <input 
                             type="number"
                             value={formData.quota}
                             onChange={e => setFormData({...formData, quota: Number(e.target.value)})}
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                          />
                          <p className="text-xs text-slate-400">Duration will be added from today</p>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">Analysis Limit (Total)</label>
                          <input 
                              type="number"
                              value={formData.analysisLimit}
                              onChange={e => setFormData({...formData, analysisLimit: Number(e.target.value)})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                      <button 
                         onClick={() => {
                             setEditingProfileId(null);
                         }}
                         className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      >
                         Cancel
                      </button>
                      <button 
                         onClick={handleSaveChanges}
                         className="flex-1 py-2.5 rounded-lg bg-neon text-white font-bold hover:bg-neon-dim shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                         <Save size={18} />
                         Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
