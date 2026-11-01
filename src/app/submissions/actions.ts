

'use server';

import { createActionClient } from '@/lib/supabase/actions';
import type { JournalEntry } from '@/lib/types';
import { decrypt } from '@/lib/encryption';

export async function getSubmittedEntries(): Promise<JournalEntry[]> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, assignments (title)')
    .eq('user_id', user.id)
    .eq('is_submitted', true)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching submitted entries:', error);
    return [];
  }

  return data.map(entry => ({
      ...entry,
      content: decrypt(entry.content),
      teacher_feedback: entry.teacher_feedback ? decrypt(entry.teacher_feedback) : null,
  })) as JournalEntry[];
}
