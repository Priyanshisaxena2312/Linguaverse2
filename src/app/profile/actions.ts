
'use server';

import { createClient } from '@/lib/supabase/server';
import { createActionClient } from '@/lib/supabase/actions';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteUserById } from '@/lib/supabase/admin';
import type { Plan, Profile, AppSettings } from '@/lib/types';
import { DEMO_USER_ID, DEMO_PROFILE } from '@/lib/demo-mode';


export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_settings').select('*').single();

  if (error) {
    console.error('Could not fetch app settings, returning defaults.', error);
    return { id: 1, ai_writing_enabled: true, ai_writing_disabled_classes: [] };
  }
  return data;
}


export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  if (user.id === DEMO_USER_ID) {
    return DEMO_PROFILE;
  }

  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  // If the profile doesn't exist, create it.
  // This is a critical fallback for new users, especially via OAuth.
  if (!profile && user) {
      console.warn(`Profile not found for user ${user.id}, creating one.`);
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'New User',
            contact_mail: user.email || user.user_metadata?.email || '',
        })
        .select()
        .single();
      
      if (insertError) {
          console.error("CRITICAL: Failed to create fallback profile:", insertError);
          return null; // Return null if the fallback creation fails.
      }
      profile = newProfile;
  }


  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching profile:', error);
    return null;
  }
  
  if (!profile) {
    return null;
  }
  
  return { 
    ...profile, 
    email: user.email || profile.contact_mail, 
    plan: 'premium' as Plan,
  };
}

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  const currentProfile = await getProfile();
  const isInitialSetup = !currentProfile?.profile_setup_complete;

  const fullName = formData.get('fullName') as string;
  const contactMail = formData.get('contactMail') as string;
  const age = formData.get('age') ? parseInt(formData.get('age') as string) : null;
  const institutionType = formData.get('institutionType') as 'school' | 'college' | null;
  const institutionName = formData.get('institutionName') as string;
  const classLevel = formData.get('classLevel') as string;
  const stream = formData.get('stream') as string;
  const year = formData.get('year') as string;
  const phone = formData.get('phone') as string;
  const newPassword = formData.get('newPassword') as string;
  const aiAnalysisEnabled = formData.get('aiAnalysisEnabled') === 'on';
  const aiImprovementEnabled = formData.has('aiImprovementEnabled') ? formData.get('aiImprovementEnabled') === 'on' : true;

  // --- Logic for initial profile setup ---
  if (isInitialSetup) {
    if (!age || !institutionType || !institutionName) {
        return { error: 'Age, Institution Type, and Institution Name are required.' };
    }
    if (institutionType === 'school' && !classLevel) {
        return { error: 'Class Level is required for school students.' };
    }
    if (institutionType === 'college' && (!stream || !year)) {
        return { error: 'Stream and Year are required for college students.' };
    }
  }
  
  // --- Update Password if provided ---
  if (newPassword) {
      if (newPassword.length < 8) {
          return { error: 'Your new password must be at least 8 characters long.' };
      }
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) {
          return { error: `Password update failed: ${passwordError.message}` };
      }
  }

  // --- Update Profile ---
  const updates: Partial<Profile> = {};
  
  if (fullName) updates.full_name = fullName;
  if (contactMail) updates.contact_mail = contactMail;
  if (age) updates.age = age;
  if (institutionType) updates.institution_type = institutionType;
  if (institutionName) updates.institution_name = institutionName;
  if (classLevel) updates.class_level = classLevel;
  if (stream) updates.stream = stream;
  if (year) updates.year = year;
  if (phone) updates.phone = phone;
  
  if (formData.has('aiAnalysisEnabled')) {
      updates.ai_analysis_enabled = aiAnalysisEnabled;
  }
  
  if (formData.has('aiImprovementEnabled')) {
      updates.ai_improvement_enabled = aiImprovementEnabled;
  }
  
  if (isInitialSetup) {
      updates.profile_setup_complete = true;
      updates.ai_improvement_enabled = true; // Default to true on first setup
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }
  
  // --- Update user_metadata in auth schema ---
  const metadataUpdate: any = {};
  if (fullName) metadataUpdate.full_name = fullName;
  if (contactMail) metadataUpdate.contact_mail = contactMail;
  if (Object.keys(metadataUpdate).length > 0) {
     await supabase.auth.updateUser({ data: metadataUpdate });
  }

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  
  return { message: 'Profile updated successfully.' };
}

export async function deleteAccount(prevState: any, formData: FormData) {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await deleteUserById(user.id);

  if (error) {
    return { error: `Could not delete your account: ${error.message}. Please contact support.` };
  }

  await supabase.auth.signOut();
  redirect('/');
}

export async function deleteAllEntries(prevState: any) {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id);
    
  if (error) {
      return { error: `Failed to delete entries: ${error.message}` };
  }
  
   await supabase
    .from('profiles')
    .update({ 
        current_streak: 0, 
        last_entry_date: null
    })
    .eq('id', user.id);

  revalidatePath('/journal');
  revalidatePath('/profile');
  return { message: 'All journal entries have been deleted and streak has been reset.' };
}
