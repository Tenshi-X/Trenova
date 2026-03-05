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
    // Allow the request to proceed without auth check if env vars are missing
    return response;
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
        return NextResponse.redirect(new URL('/login', request.url))
    }
    const role = user.user_metadata.role;
    if (role !== 'admin') {
        // Redirect non-admins to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect User Routes (Dashboard, Chatbot)
  if (path.startsWith('/dashboard') || path.startsWith('/chatbot')) {
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Redirect Login if already logged in
  if (path === '/login' && user) {
     return NextResponse.redirect(new URL('/dashboard', request.url))
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
