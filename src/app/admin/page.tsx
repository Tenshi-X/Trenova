'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Database, Shield, Edit, Trash2, Save, 
  UserPlus, RefreshCw, Trash, Activity,
  Search, ChevronLeft, ChevronRight, ChevronDown, LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { getUserProfiles, provisionUser, deleteUserProfile, UserProfile } from './actions';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    role: 'user',
    quota: 30,
    addAnalysisLimit: 0,
    analysisLimit: 150
  });

  // Pagination & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
          formData.addAnalysisLimit,
          formData.analysisLimit
      );
      if (!res.success) throw new Error(res.error);
      
      // Refresh Data
      await fetchData();
      
      // Reset State
      setEditingProfileId(null);
      setFormData({ role: 'user', quota: 30, addAnalysisLimit: 0, analysisLimit: 150 });

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const startEdit = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    setFormData({ 
        role: profile.role, 
        quota: 0, // Default to 0 added
        addAnalysisLimit: 0,
        analysisLimit: profile.analysis_limit || 150
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user from the App Profiles? (Auth account will remain)")) return;
    await deleteUserProfile(id);
    fetchData();
  };

  // Filter & Pagination Logic
  const filteredProfiles = profiles.filter(profile => 
    profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  return (
    <div className="space-y-8 font-sans pb-20 p-6 md:p-8 pt-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="text-neon-dark" /> {t('admin_console')}
          </h1>
          <p className="text-slate-500">{t('admin_subtitle')}</p>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center flex-wrap">
             <div className="flex items-center gap-2 mr-0 sm:mr-2 border-r border-slate-200 dark:border-slate-800 pr-2 sm:pr-4">
                <LanguageSwitcher />
                <ThemeToggle />
             </div>
             <Link 
                href="/admin/users/create"
                className="bg-neon hover:bg-neon-dim text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-md transition-all hover:-translate-y-0.5 text-sm"
             >
                <UserPlus size={18} />
                <span className="hidden sm:inline">{t('btn_create_auth')}</span>
                <span className="sm:hidden">Create</span>
             </Link>
             <button 
                onClick={fetchData}
                className="glass px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground text-sm"
             >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{t('btn_refresh')}</span>
             </button>
             <button 
                onClick={async () => {
                  const supabase = getSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold transition-all text-sm"
             >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
             </button>
        </div>
      </div>

      {/* Activity Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                 <Database size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('card_total_users')}</span>
           </div>
           <div className="text-3xl font-bold text-foreground">{profiles.length}</div>
           <div className="text-sm text-slate-500 mt-1">{t('card_total_users_sub')}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                 <Shield size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('card_active_subs')}</span>
           </div>
           <div className="text-3xl font-bold text-foreground">
             {profiles.filter(p => p.subscription_end_at && new Date(p.subscription_end_at) > new Date()).length}
           </div>
           <div className="text-sm text-slate-500 mt-1">{t('card_active_subs_sub')}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                 <RefreshCw size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('card_total_req')}</span>
           </div>
           <div className="text-3xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
             {profiles.reduce((acc, curr) => acc + (curr.current_analysis_count || 0), 0)}
             <span className="text-lg text-slate-400 font-medium ml-2">
                / {profiles.reduce((acc, curr) => acc + (curr.analysis_limit || 150), 0)}
             </span>
           </div>
           <div className="text-sm text-slate-500 mt-1">{t('card_total_req_sub')}</div>
        </div>


      </div>

      {/* SECTION: USER MONITORING */}
      <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                 <Activity className="text-slate-400" /> 
                 {t('section_activity_monitoring')}
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder={t('search_placeholder_user')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 w-full sm:w-64"
                      />
                  </div>

                  {/* Items Per Page */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">{t('rows_per_page')}</span>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:text-white dark:[&>option]:bg-slate-900"
                      >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">{t('table_header_user')}</th>
                    <th className="px-6 py-4">{t('table_header_role')}</th>
                    <th className="px-6 py-4">{t('table_header_remaining')}</th>
                    <th className="px-6 py-4">{t('table_header_sub')}</th>
                    <th className="px-6 py-4 text-right">{t('table_header_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProfiles.length === 0 && !loading && (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('table_empty')}</td></tr>
                  )}
                  {paginatedProfiles.map((profile) => {
                    const endDate = profile.subscription_end_at ? new Date(profile.subscription_end_at) : null;
                    const now = new Date();
                    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isExpired = daysRemaining <= 0;

                    const limit = profile.analysis_limit ?? 150;
                    const used = profile.current_analysis_count ?? 0;
                    const remaining = Math.max(0, limit - used);

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
                            {remaining} {t('req_unit')}
                        </div>
                        <div className="text-xs text-slate-400">
                             {limit} {t('limit_unit')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          {endDate ? (
                              <div>
                                  <span className={clsx("font-mono text-sm font-bold", isExpired ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                                     {isExpired ? t('status_expired') : `${daysRemaining.toFixed(0)} ${t('status_days_left')}`}
                                  </span>
                                  <p className="text-xs text-slate-400">
                                    {t('sub_ends')} {endDate.toLocaleString('id-ID', { 
                                        timeZone: 'Asia/Jakarta',
                                        dateStyle: 'medium', 
                                        timeStyle: 'short' 
                                    })} WIB
                                  </p>
                              </div>
                          ) : (
                              <span className="text-sm text-slate-400 italic">{t('sub_no_active')}</span>
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


            {/* Pagination Controls */}
            {filteredProfiles.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-500 order-2 sm:order-1">
                        {t('page_info').replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
                    </p>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        {(() => {
                           let start = Math.max(1, currentPage - 2);
                           let end = Math.min(totalPages, currentPage + 2);
                           
                           if (totalPages > 5) {
                               if (currentPage <= 3) { start = 1; end = 5; }
                               else if (currentPage >= totalPages - 2) { start = Math.max(1, totalPages - 4); end = totalPages; }
                           }
                           
                           const pages = [];
                           for (let i = start; i <= end; i++) {
                               pages.push(i);
                           }
                           
                           return pages.map(page => (
                               <button
                                   key={page}
                                   onClick={() => setCurrentPage(page)}
                                   className={clsx(
                                       "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                       currentPage === page
                                           ? "bg-neon text-white shadow-md"
                                           : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                                   )}
                               >
                                   {page}
                               </button>
                           ));
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
          </div>
      </section>

      {/* MODAL FOR EDITING */}
      {editingProfileId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-foreground">
                          {t('modal_title')}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {profiles.find(p => p.id === editingProfileId)?.email}
                      </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">{t('modal_role')}</label>
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
                          <label className="text-sm font-semibold text-foreground">{t('modal_add_sub')}</label>
                          <input 
                             type="number"
                             value={formData.quota}
                             onChange={e => setFormData({...formData, quota: Number(e.target.value)})}
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                          />
                          <p className="text-xs text-slate-400">{t('modal_add_sub_desc')}</p>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">{t('modal_add_limit')}</label>
                          <input 
                              type="number"
                              value={formData.addAnalysisLimit}
                              onChange={e => setFormData({...formData, addAnalysisLimit: Number(e.target.value)})}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-neon/50"
                          />
                          <p className="text-xs text-slate-400">{t('modal_add_limit_desc')}</p>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground">{t('modal_limit')}</label>
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
                         {t('btn_cancel')}
                      </button>
                      <button 
                         onClick={handleSaveChanges}
                         className="flex-1 py-2.5 rounded-lg bg-neon text-white font-bold hover:bg-neon-dim shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                         <Save size={18} />
                         {t('btn_save_changes')}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
