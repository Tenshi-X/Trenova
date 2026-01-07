'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Database, Shield, Edit, Trash2, Save, 
  UserPlus, CheckCircle, XCircle, RefreshCw, AlertTriangle, ArrowRight 
} from 'lucide-react';
import clsx from 'clsx';
import { getAuthUsers, getUserProfiles, provisionUser, deleteUserProfile, AuthUser, UserProfile } from './actions';

export default function AdminPage() {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Provision State
  const [selectedAuthUser, setSelectedAuthUser] = useState<AuthUser | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    role: 'user',
    quota: 30,
    imageLimit: 15,
    chatLimit: 50
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const authRes = await getAuthUsers();
      const profileRes = await getUserProfiles();

      if (!authRes.success) throw new Error(authRes.error || "Failed to fetch auth users");
      if (!profileRes.success) throw new Error(profileRes.error || "Failed to fetch profiles");

      setAuthUsers(authRes.users || []);
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

  const handleProvision = async () => {
    if (!selectedAuthUser && !editingProfileId) return;
    
    // Determine ID and Email based on what we are doing (Provisioning or Editing)
    const targetId = selectedAuthUser ? selectedAuthUser.id : editingProfileId;
    const targetEmail = selectedAuthUser ? selectedAuthUser.email : profiles.find(p => p.id === editingProfileId)?.email;

    if (!targetId || !targetEmail) return;

    try {
      const res = await provisionUser(
          targetId, 
          targetEmail, 
          formData.role, 
          formData.quota,
          formData.imageLimit,
          formData.chatLimit
      );
      if (!res.success) throw new Error(res.error);
      
      // Refresh Data
      await fetchData();
      
      // Reset State
      setSelectedAuthUser(null);
      setEditingProfileId(null);
      setEditingProfileId(null);
      setFormData({ role: 'user', quota: 30, imageLimit: 15, chatLimit: 50 });

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const startProvision = (user: AuthUser) => {
    // Check if profile exists already
    const existing = profiles.find(p => p.id === user.id);
    if (existing) {
       alert("This user is already in the database. Edit them in the 'App Users' section below.");
       return;
    }
    
    setSelectedAuthUser(user);
    setFormData({ role: 'user', quota: 30, imageLimit: 15, chatLimit: 50 });
    setEditingProfileId(null);
  };

  const startEdit = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    // Calculate remaining days or default to 30 for extension
    // When editing, we usually want to ADD time or SET time. 
    // To keep it simple, let's default to 0 days added (unless user changes) and pre-fill existing limits
    // Note: profile.limit_image_upload might be undefined if not in DB yet, use defaults
    setFormData({ 
        role: profile.role, 
        quota: 0, // Default to 0 added
        imageLimit: profile.limit_image_upload || 15,
        chatLimit: profile.limit_chat_input || 50
    });
    setSelectedAuthUser(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user from the App Profiles? (Auth account will remain)")) return;
    await deleteUserProfile(id);
    fetchData();
  };

  const isConfiguring_ServiceRole = error && error.includes("Service Role Key");

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

      {isConfiguring_ServiceRole && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
             <AlertTriangle className="shrink-0 mt-0.5" />
             <div>
                <h4 className="font-bold">Missing Configuration</h4>
                <p className="text-sm mt-1">
                   Unable to fetch raw Auth Users. Please ensure <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in your environment variables.
                   The list below will likely be empty.
                </p>
             </div>
          </div>
      )}

      {/* SECTION 1: RAW AUTH USERS */}
      <section className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                 <Users className="text-slate-400" /> 
                 1. Raw Authentication Users
              </h2>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                 From <code>auth.users</code>
              </span>
          </div>
          
          <div className="glass rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Auth ID / Email</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Provisioning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authUsers.length === 0 && !loading && (
                     <tr><td colSpan={4} className="p-8 text-center text-slate-400">No users found or permission denied.</td></tr>
                  )}
                  {authUsers.map((user) => {
                    const isProvisioned = profiles.some(p => p.id === user.id);
                    return (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                             <div>
                                <p className="font-medium text-foreground">{user.email}</p>
                                <p className="text-xs text-slate-400 font-mono">{user.id}</p>
                             </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                            {isProvisioned ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    <CheckCircle size={12} /> Synced
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    <AlertTriangle size={12} /> Unprovisioned
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {!isProvisioned && (
                               <button 
                                 onClick={() => startProvision(user)}
                                 className="text-sm font-semibold text-neon hover:text-neon-dim flex items-center justify-end gap-1 ml-auto"
                               >
                                  Add to App <ArrowRight size={14} />
                               </button>
                           )}
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </section>


      {/* SECTION 2: APP USERS */}
      <section className="space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                 <Database className="text-slate-400" /> 
                 2. App Users (Profiles)
              </h2>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                 From <code>public.user_profiles</code>
              </span>
          </div>

          <div className="glass rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">User Profile</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.length === 0 && !loading && (
                     <tr><td colSpan={4} className="p-8 text-center text-slate-400">No profiles provisioned yet.</td></tr>
                  )}
                  {profiles.map((profile) => {
                    const endDate = profile.subscription_end_at ? new Date(profile.subscription_end_at) : null;
                    const now = new Date();
                    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isExpired = daysRemaining <= 0;

                    return (
                    <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
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
                              profile.role === 'admin' ? "bg-purple-100 text-purple-700 border-purple-200" :
                              "bg-blue-100 text-blue-700 border-blue-200"
                            )}>
                              {profile.role}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                          {endDate ? (
                              <div>
                                  <span className={clsx("font-mono text-sm font-bold", isExpired ? "text-red-600" : "text-emerald-600")}>
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
                                    className="p-2 rounded hover:bg-slate-100 text-slate-400 hover:text-foreground transition-colors"
                                    title="Extend Subscription"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(profile.id)}
                                    className="p-2 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
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

      {/* MODAL FOR EDITING / PROVISIONING */}
      {(selectedAuthUser || editingProfileId) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-foreground">
                          {selectedAuthUser ? 'Provision User' : 'Manage Subscription'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                          {selectedAuthUser ? selectedAuthUser.email : profiles.find(p => p.id === editingProfileId)?.email}
                      </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
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
                          <label className="text-sm font-semibold text-foreground">Add Subscription (Days)</label>
                          <input 
                             type="number"
                             value={formData.quota}
                             onChange={e => setFormData({...formData, quota: Number(e.target.value)})}
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                          />
                          <p className="text-xs text-slate-400">Duration will be added from today</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Image Limit</label>
                            <input 
                                type="number"
                                value={formData.imageLimit}
                                onChange={e => setFormData({...formData, imageLimit: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Chat Limit</label>
                            <input 
                                type="number"
                                value={formData.chatLimit}
                                onChange={e => setFormData({...formData, chatLimit: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                            />
                        </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
                      <button 
                         onClick={() => {
                             setSelectedAuthUser(null);
                             setEditingProfileId(null);
                         }}
                         className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-colors"
                      >
                         Cancel
                      </button>
                      <button 
                         onClick={handleProvision}
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
