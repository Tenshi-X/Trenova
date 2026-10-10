'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAndProvisionUser } from '../../actions';

export default function CreateUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [days, setDays] = useState(30);
  const [quota, setQuota] = useState(50);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await createAndProvisionUser(email, role, days, quota);
    setBusy(false);
    if (!result.success) return setMessage(result.error || 'Gagal mengundang akun.');
    router.push('/admin');
    router.refresh();
  };

  return <main className="max-w-xl mx-auto p-6 space-y-6">
    <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Kembali ke admin</Link>
    <div>
      <h1 className="text-2xl font-bold">Undang pengguna</h1>
      <p className="text-sm text-slate-500 mt-2">Pengguna menerima tautan untuk membuat kata sandi sendiri. Masa aktif dimulai saat login pertama.</p>
    </div>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <label className="block text-sm font-medium">Email
        <input className="mt-1 w-full p-3 rounded-lg border bg-transparent" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Peran
        <select className="mt-1 w-full p-3 rounded-lg border bg-transparent" value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">Pengguna</option><option value="admin">Admin</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">Masa aktif (hari)
          <input className="mt-1 w-full p-3 rounded-lg border bg-transparent" type="number" min="1" max="3650" value={days} onChange={e => setDays(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium">Kuota analisis
          <input className="mt-1 w-full p-3 rounded-lg border bg-transparent" type="number" min="0" value={quota} onChange={e => setQuota(Number(e.target.value))} />
        </label>
      </div>
      {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
      <button disabled={busy} className="w-full p-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">
        {busy ? 'Mengirim undangan…' : 'Kirim undangan'}
      </button>
    </form>
  </main>;
}
