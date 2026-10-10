import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') === '/reset-password' ? '/reset-password' : null
  // if "next" is in param, use it as the redirect URL

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Logic for role-based redirect and creating profile if needed
      const { data: { user } } = await supabase.auth.getUser()
      let role = 'user'
      
      if (user) {
        // Ensure user_profile exists (especially for Google OAuth)
        const { createSupabaseAdminClient } = await import('@/lib/supabase/admin')
        const admin = createSupabaseAdminClient()
        if (admin) {
          const { data: profile } = await admin.from('user_profiles').select('id,role').eq('id', user.id).single()
          if (!profile) {
            await admin.from('user_profiles').insert({
              id: user.id,
              email: user.email,
              role: 'user',
              analysis_limit: 0,
              current_analysis_count: 0
            })
          } else role = profile.role === 'admin' ? 'admin' : 'user'
        }
      }

      const baseUrl = process.env.NODE_ENV === 'development' ? origin : getSiteUrl()

      if (next) {
         return NextResponse.redirect(`${baseUrl}${next}`)
      } else if (role === 'admin') {
         return NextResponse.redirect(`${baseUrl}/admin`)
      } else {
         return NextResponse.redirect(`${baseUrl}${next || '/dashboard'}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
