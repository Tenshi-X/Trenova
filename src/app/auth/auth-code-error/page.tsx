import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return <main className="min-h-screen grid place-items-center p-6 bg-background text-foreground">
    <section className="max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tautan tidak dapat digunakan</h1>
      <p>Tautan masuk mungkin sudah kedaluwarsa atau pernah dipakai. Masuk dengan akun Anda, atau minta admin mengirim tautan pengaturan kata sandi yang baru.</p>
      <Link href="/sign-in" className="inline-block rounded-lg bg-neon text-white px-5 py-2">Ke halaman masuk</Link>
    </section>
  </main>;
}
