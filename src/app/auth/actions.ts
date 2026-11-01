
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createActionClient } from '@/lib/supabase/actions';
import { type EmailOtpType } from '@supabase/supabase-js'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createActionClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  
  // After login, Supabase redirect logic in middleware will handle routing
  // to /profile if setup is needed, or /dashboard otherwise.
  redirect('/dashboard');
}

export async function signup(prevState: any, formData: FormData): Promise<{ error?: string; message?: string } | undefined> {
  const supabase = await createActionClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const contactMailInput = formData.get('contactMail') as string;

  if (!email || !password || !fullName) {
    return { error: 'Full name, email, and password are required.' };
  }
  
  const contactMail = contactMailInput || email;

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        contact_mail: contactMail,
      }
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!user) {
    return { error: 'Could not create user.' };
  }

  // Explicitly create the profile here to avoid race conditions with the middleware.
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: fullName,
    contact_mail: contactMail,
    profile_setup_complete: false, // Ensure new profiles start as incomplete
  });

  if (profileError) {
      console.error('CRITICAL: Failed to create profile for new user.', profileError);
      // Even if profile creation fails, the user exists. They will be prompted
      // to set up their profile on next login by the getProfile function's fallback.
  }
  
  revalidatePath('/', 'layout');
  redirect('/profile');
}


export async function logout() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}


export async function sendPasswordReset(email: string): Promise<{ message?: string; error?: string }> {
  const supabase = await createActionClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return { error: "Site URL is not configured. Please set NEXT_PUBLIC_SITE_URL in your environment variables." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "If an account with this email exists, a password reset link has been sent." };
}

export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createActionClient();
    const password = formData.get('password') as string;
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return { error: `Password update failed: ${error.message}`};
    }
    
    return { message: "Your password has been updated successfully." };
}


export async function signInWithGoogle() {
    const supabase = await createActionClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      redirect(`/login?error=${encodeURIComponent('Site URL is not configured. Cannot perform OAuth.')}`);
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${siteUrl}/auth/callback`,
            queryParams: {
                prompt: 'consent',
            }
        }
    });

    if (error) {
        console.error('Google Sign-In Error:', error);
        redirect(`/login?error=${encodeURIComponent('Could not authenticate with Google.')}`);
    }

    if (data.url) {
        redirect(data.url);
    } else {
       redirect(`/login?error=${encodeURIComponent('Could not get Google auth URL.')}`);
    }
}
