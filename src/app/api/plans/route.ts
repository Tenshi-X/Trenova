import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ plans: [] }, { status: 503 });
  const { data, error } = await admin.from('plans')
    .select('code,title_id,title_en,duration_days,analysis_quota,price_idr,checkout_url,features,sort_order')
    .eq('active', true).order('sort_order');
  if (error) return NextResponse.json({ plans: [] }, { status: 503 });
  return NextResponse.json({ plans: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
