
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';
  
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = '/login';
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  if (token_hash && type) {
    const supabase = await createClient();

    // Special handling for password recovery links
    if (type === "recovery") {
        // The redirectTo path is where the user will be sent after the OTP is verified.
        // We want them to land on the page where they can set their new password.
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/auth/update-password';
        // Clear all search params to ensure a clean redirect, which is more reliable on some platforms.
        redirectUrl.search = ''; 
        return NextResponse.redirect(redirectUrl);
    }
    
    // This handles other OTP types like email confirmation
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with instructions
  redirectTo.pathname = '/login';
  redirectTo.searchParams.set('error', 'Could not authenticate user. Invalid or expired link.');
  return NextResponse.redirect(redirectTo);
}
