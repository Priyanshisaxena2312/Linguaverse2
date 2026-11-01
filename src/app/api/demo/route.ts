import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE_NAME } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'exit') {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(DEMO_COOKIE_NAME);
    return response;
  }

  // Default: enter demo mode
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set(DEMO_COOKIE_NAME, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    httpOnly: false, // Accessible to client components if needed
  });

  return response;
}
