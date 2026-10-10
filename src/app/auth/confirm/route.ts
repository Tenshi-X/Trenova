import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (!tokenHash || tokenHash.length > 200 || (type !== 'invite' && type !== 'recovery')) {
    return NextResponse.redirect(`${getSiteUrl()}/auth/auth-code-error`);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return NextResponse.redirect(`${getSiteUrl()}${error ? '/auth/auth-code-error' : '/reset-password'}`);
}
