
'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { encrypt } from '@/lib/encryption';
import type { PracticeSession } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function savePracticeSession(sessionData: Omit<PracticeSession, 'id' | 'created_at' | 'user_id'>): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated.' };
    }

    const { error } = await supabase.from('practice_sessions').insert({
        user_id: user.id,
        journal_entry_id: sessionData.journal_entry_id,
        quiz_score: sessionData.quiz_score,
        chat_history: encrypt(JSON.stringify(sessionData.chat_history)),
        performance_report: encrypt(sessionData.performance_report),
    });

    if (error) {
        console.error('Error saving practice session:', error);
        return { error: 'Failed to save your practice session.' };
    }
    
    revalidatePath(`/dictionary/practice/${sessionData.journal_entry_id}`);

    return {};
}
