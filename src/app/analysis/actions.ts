

'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { generateInsights, GenerateInsightsOutput } from '@/ai/flows/generate-insights';
import { subDays, format } from 'date-fns';
import { getProfile } from '@/app/profile/actions';
import { revalidatePath } from 'next/cache';
import { getAIErrorMessage, getPlainTextFromTiptapJson } from '@/lib/utils';
import { analyzeJournalEntry } from '@/ai/flows/analyze-journal-entry';
import type { AnalyzeJournalEntryOutput } from '@/lib/types';
import { decrypt } from '@/lib/encryption';

export async function getInsightsForPeriod(period: 'week' | 'month', plainTextEntries: { createdAt: string; content: string }[]): Promise<GenerateInsightsOutput | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const profile = await getProfile();
  if (!profile) return { error: 'Could not load user profile.' };
  
  if (!plainTextEntries || plainTextEntries.length < 3) {
      return { error: `You need at least 3 personal entries in the last ${period === 'week' ? 7 : 30} days to generate insights.`};
  }

  try {
    const insights = await generateInsights({
        entries: plainTextEntries,
        timePeriod: `the past ${period}`
    });
    
    // No longer need to increment usage counter
    revalidatePath('/profile');

    return insights;
  } catch (aiError) {
      console.error('AI insight generation failed:', aiError);
      return { error: getAIErrorMessage(aiError) };
  }
}

export async function fetchEntriesForInsights(period: 'week' | 'month'): Promise<{ entries: { createdAt: string, content: string }[], error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entries: [], error: 'Not authenticated.' };

    const days = period === 'week' ? 7 : 30;
    const startDate = subDays(new Date(), days).toISOString();

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('created_at, content')
        .eq('user_id', user.id)
        .eq('is_project_log', false)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error(`Error fetching entries for insights:`, error);
        return { entries: [], error: 'Failed to fetch journal entries.' };
    }

    const formattedEntries = entries.map(e => ({
        createdAt: format(new Date(e.created_at), 'MMMM d, yyyy'),
        content: getPlainTextFromTiptapJson(decrypt(e.content))
    }));

    return { entries: formattedEntries };
}


/**
 * Finds all PERSONAL entries for a user that haven't been analyzed,
 * runs the analysis flow on them, and saves the results.
 * @returns An object with the count of analyzed entries or an error.
 */
export async function backfillEntryAnalysis(): Promise<{ count: number; error?: null } | { error: string }> {
  console.log('[ACTION] Starting backfillEntryAnalysis...');
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Fetch entries where analysis is null AND it is NOT a project log.
  const { data: unanalyzedEntries, error: fetchError } = await supabase
    .from('journal_entries')
    .select('id, content')
    .eq('user_id', user.id)
    .eq('is_project_log', false)
    .is('analysis', null);

  if (fetchError) {
    console.error('[ACTION_ERROR] Error fetching unanalyzed entries:', fetchError);
    return { error: 'Failed to retrieve entries for analysis.' };
  }

  if (!unanalyzedEntries || unanalyzedEntries.length === 0) {
    console.log('[ACTION] No unanalyzed entries found. Exiting backfill.');
    return { count: 0 };
  }
  
  console.log(`[ACTION] Found ${unanalyzedEntries.length} entries to analyze.`);

  let analyzedCount = 0;
  for (const entry of unanalyzedEntries) {
    try {
      console.log(`[ACTION] Analyzing entry ID: ${entry.id}`);
      const decryptedContent = decrypt(entry.content);
      const plainText = getPlainTextFromTiptapJson(decryptedContent);
      
      if (!plainText) {
        console.log(`[ACTION] Skipping entry ID: ${entry.id} because it has no text content.`);
        continue; // Skip empty entries
      }

      // We will only run personal analysis in the backfill.
      // Language analysis can be triggered on-demand from the entry view.
      const analysisResult: AnalyzeJournalEntryOutput = await analyzeJournalEntry({ 
          journalContent: plainText, 
          analysisType: 'personal' 
      });
      
      if (analysisResult) {
        // Here, we only update the 'personal' field in the analysis object
        // to avoid overwriting any existing language analysis.
        const { data: existingEntry, error: getError } = await supabase
            .from('journal_entries')
            .select('analysis')
            .eq('id', entry.id)
            .single();
        
        if (getError) throw getError;
        
        const newAnalysisData = {
            ...(existingEntry.analysis || {}),
            personal: analysisResult.personal
        };
        
        await supabase
          .from('journal_entries')
          .update({ analysis: newAnalysisData as any })
          .eq('id', entry.id);
          
        analyzedCount++;
        console.log(`[ACTION] Successfully analyzed and saved entry ID: ${entry.id}`);
      }
    } catch (e) {
      console.error(`[ACTION_ERROR] Failed to analyze entry ${entry.id}:`, getAIErrorMessage(e));
      // Continue to the next entry even if one fails
    }
  }

  if (analyzedCount > 0) {
    console.log(`[ACTION] Backfill complete. Revalidating /analysis path. Analyzed ${analyzedCount} entries.`);
    revalidatePath('/analysis'); // Revalidate the page to show new data
  } else {
    console.log('[ACTION] Backfill finished. No new entries were analyzed.');
  }

  return { count: analyzedCount };
}
