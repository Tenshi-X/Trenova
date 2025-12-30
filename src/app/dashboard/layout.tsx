export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 pl-20 transition-all duration-300">
      {/* Simple Topbar for now, can be expanded */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
                <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100" />
                Trenova
            </div>
            {/* User Profile / Logout would go here */}
         </div>
      </nav>
      
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
