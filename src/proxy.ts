import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a minimal Supabase client to check auth status
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Proxy: Missing Supabase Environment Variables');
    console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');
    const protectedPath = request.nextUrl.pathname.startsWith('/admin')
      || request.nextUrl.pathname.startsWith('/dashboard')
      || request.nextUrl.pathname.startsWith('/terminal');
    return protectedPath ? NextResponse.redirect(new URL('/sign-in', request.url)) : response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null;
  try {
      const { data } = await supabase.auth.getUser()
      user = data.user;
  } catch (err) {
      console.error("Proxy Auth Error:", err);
      // Treat as not logged in if auth service is unreachable
  }

  const path = request.nextUrl.pathname;

  // Protect Admin Routes
  if (path.startsWith('/admin')) {
    if (!user) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    const { data: profile } = await supabase.from('user_profiles')
      .select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect User Routes (Dashboard, Chatbot)
  if (path.startsWith('/dashboard') || path.startsWith('/chatbot')) {
    if (!user) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }
  
  // Redirect Login if already logged in
  if ((path === '/login' || path === '/sign-in') && user) {
     const { data: profile } = await supabase.from('user_profiles')
       .select('role').eq('id', user.id).maybeSingle();
     const redirectResponse = NextResponse.redirect(new URL(profile?.role === 'admin' ? '/admin' : '/dashboard', request.url));
     response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
     return redirectResponse;
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
