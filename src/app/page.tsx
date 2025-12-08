import Link from "next/link";
import { Activity, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-neon/20 blur-[100px] rounded-full" />
        <h1 className="relative text-6xl font-bold tracking-tighter text-white mb-4">
          TRENOVA <span className="text-neon text-glow">AI</span>
        </h1>
      </div>
      
      <p className="text-xl text-gray-400 max-w-lg">
        Advanced Trading Intelligence driven by Edge Computing.
      </p>

      <div className="flex gap-6 z-10">
        <Link 
          href="/dashboard"
          className="group flex items-center gap-2 px-8 py-4 bg-neon text-black rounded-xl font-bold hover:bg-neon-dark transition-all hover:scale-105"
        >
          <Activity size={20} />
          Launch Dashboard
        </Link>
        <Link 
          href="/admin"
          className="flex items-center gap-2 px-8 py-4 glass text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
        >
          <Shield size={20} />
          Admin Console
        </Link>
      </div>

      <div className="absolute bottom-10 text-gray-600 text-sm">
        Blueprint v1.0 • Powered by Supabase
      </div>
    </div>
  );
}
