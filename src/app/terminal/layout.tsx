import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createSupabaseAdminClient();
  const clientToUse = admin || supabase;

  const { data: profile } = await clientToUse
    .from('user_profiles')
    .select('subscription_end_at, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'premium') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
