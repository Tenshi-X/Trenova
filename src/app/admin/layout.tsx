import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex flex-col">
    <header className="admin-chrome">
      <div>
        <Link href="/admin" className="site-brand">TRENOVA <span>{'//'}</span> ADMIN</Link>
        <p className="site-eyebrow">TRADING INTELLIGENCE</p>
      </div>
      <span className="border border-neon/30 px-2 py-1 text-[12px] text-neon self-center">ADMIN</span>
    </header>
    <div className="flex-1">{children}</div>
    <footer className="admin-footer">TRENOVA {'//'} ADMIN CONSOLE</footer>
  </div>;
}
