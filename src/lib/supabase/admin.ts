
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// DEPRECATED: We are now creating the admin client directly in the server actions
// to ensure proper isolation and environment variable access in serverless functions.
// This function is kept for reference but should not be used for new implementations.
export function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('The SUPABASE_SERVICE_ROLE_KEY is missing from your .env file. Please add it and restart your server.');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

/**
 * Deletes a user from the auth.users table using a privileged client.
 * Assumes that RLS policies with `ON DELETE CASCADE` are set up
 * to automatically remove related data in other tables.
 * @param id The user's ID.
 * @returns An object with an error property if the deletion fails.
 */
export async function deleteUserById(id: string) {
  try {
    // Create client directly to ensure env vars are loaded.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase admin credentials are not configured.');
    }
    const adminClient = createClient(supabaseUrl, serviceKey);
    
    const { error } = await adminClient.auth.admin.deleteUser(id);
    
    if (error) {
      console.error(`[ADMIN] Error deleting user ${id}:`, error.message);
    }

    return { error };

  } catch (error) {
    const err = error as Error;
    console.error(`[ADMIN] Exception during user deletion for ${id}:`, err.message);
    return { error: { name: 'AdminClientError', message: err.message } as any };
  }
}
