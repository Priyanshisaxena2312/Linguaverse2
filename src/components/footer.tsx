
import { createClient } from '@/lib/supabase/server';
import { FooterContent } from './footer-content';

/**
 * This is the SERVER component wrapper for the footer.
 * Its sole purpose is to fetch the user session on the server
 * and then pass that data down to the client-safe FooterContent component.
 */
export async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <FooterContent user={user} />;
}
