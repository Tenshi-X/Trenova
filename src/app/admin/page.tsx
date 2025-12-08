'use client';

import { useState } from 'react';
import { Users, Database, Shield, MoreVertical, Edit, Trash2, Save } from 'lucide-react';
import clsx from 'clsx';

// Mock Data
const initialUsers = [
  { id: '1', name: 'Alex Trader', email: 'alex@example.com', role: 'User', status: 'Active', quota: 100 },
  { id: '2', name: 'Sarah Whale', email: 'sarah@example.com', role: 'Premium', status: 'Active', quota: 500 },
  { id: '3', name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Suspended', quota: 0 },
  { id: '4', name: 'System Admin', email: 'admin@trenova.com', role: 'Admin', status: 'Active', quota: 9999 },
];

export default function AdminPage() {
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuota, setEditQuota] = useState(0);

  const handleEdit = (user: typeof initialUsers[0]) => {
    setEditingId(user.id);
    setEditQuota(user.quota);
  };

  const handleSave = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, quota: editQuota } : u));
    setEditingId(null);
    // In real app: Call Edge Function to update user metadata
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-neon" /> Admin Console
          </h1>
          <p className="text-gray-400">Manage users and AI resource allocation.</p>
        </div>
        <div className="flex gap-4">
             <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
                <Users size={16} className="text-neon" />
                <span className="font-bold text-white mb-0.5">{users.length}</span>
                <span className="text-xs text-gray-500">Users</span>
             </div>
             <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
                <Database size={16} className="text-neon" />
                <span className="font-bold text-white mb-0.5">System Healthy</span>
             </div>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-lg text-white">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 uppercase text-xs font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">AI Quota (Monthly)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-2 py-1 rounded text-xs font-medium border",
                      user.role === 'Admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      user.role === 'Premium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                        "inline-flex items-center gap-1.5 text-xs",
                        user.status === 'Active' ? "text-neon" : "text-red-500"
                    )}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? "bg-neon shadow-[0_0_5px_#00FF88]" : "bg-red-500")} />
                        {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={editQuota} 
                            onChange={(e) => setEditQuota(Number(e.target.value))}
                            className="w-20 bg-black/50 border border-neon/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Database size={14} className="text-gray-500" />
                        {user.quota} reqs
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === user.id ? (
                        <button 
                            onClick={() => handleSave(user.id)}
                            className="p-2 rounded hover:bg-neon/20 text-neon transition-colors"
                        >
                            <Save size={16} />
                        </button>
                    ) : (
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleEdit(user)}
                                className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <Edit size={16} />
                            </button>
                            <button className="p-2 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
