
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // --- SECURITY HEADERS ---
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://*.supabase.co https://*.googleusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://api.razorpay.com data: ws://localhost:3001 ws://127.0.0.1:3001 ${process.env.NEXT_PUBLIC_PROXY_URL || ''} wss://linguaverse-proxy-195395620089.us-central1.run.app;
    media-src 'self' data: https://*.supabase.co;
    frame-src 'self' https://*.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  const isDemo = request.cookies.get('linguaverse_demo')?.value === 'true' || request.nextUrl.searchParams.get('demo') === 'true';

  if (request.nextUrl.searchParams.get('demo') === 'true') {
    response.cookies.set('linguaverse_demo', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const { pathname } = request.nextUrl;

      const protectedRoutes = ['/dashboard', '/journal', '/analysis', '/calendar', '/submissions', '/dictionary', '/profile'];
      const authOnlyRoutes = ['/login', '/signup'];

      if (!user && !isDemo && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (user && authOnlyRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
    }
  } else {
    const { pathname } = request.nextUrl;
    const protectedRoutes = ['/dashboard', '/journal', '/analysis', '/calendar', '/submissions', '/dictionary', '/profile'];
    if (!isDemo && protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
