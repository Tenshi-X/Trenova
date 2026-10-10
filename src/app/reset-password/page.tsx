'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  return <main className="min-h-screen grid place-items-center bg-slate-950 text-white p-4">
    <form className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage('Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari admin.'); setBusy(false); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage(error.message);
      else { setMessage('Kata sandi berhasil dibuat.'); router.replace('/dashboard'); }
      setBusy(false);
    }}>
      <h1 className="text-2xl font-black">Atur kata sandi</h1>
      <p className="text-sm text-slate-400">Gunakan minimal 12 karakter.</p>
      <input type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
      <button disabled={busy} className="w-full rounded-lg bg-neon p-3 font-bold text-white disabled:opacity-50">Simpan kata sandi</button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  </main>;
}
