

'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';
import { 
    type Profile, 
    type JournalEntry, 
    type AnalyzeJournalEntryInput, 
    type AnalyzeJournalEntryOutput,
    type AnalyzeTextForLanguageOutput,
    type GrammarCorrection,
    type VocabularySuggestion,
    type DictionaryWord,
    type Assignment,
} from '@/lib/types';
import { getProfile } from '@/app/profile/actions';
import { getAIErrorMessage, getPlainTextFromTiptapJson } from '@/lib/utils';
import { encrypt, decrypt } from '@/lib/encryption';
import { z } from 'zod';
// Removed top-level AI flow imports to prevent client-side bundle leakage
// of Genkit dependencies (require.extensions).


const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateJournalChatResponseInputSchema = z.object({
  journalContent: z.string().describe('The full, plain text content of the journal entry serving as the context for this conversation.'),
  chatHistory: z.array(MessageSchema).describe('The ongoing chat history between the user and the assistant about this specific journal entry.'),
});

export async function addDictionaryWord(wordData: Omit<DictionaryWord, 'id' | 'created_at' | 'user_id'>) {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('Cannot add to dictionary: User not authenticated.');
        return;
    }
    
    const { data: existing, error: checkError } = await supabase
      .from('dictionary_words')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', encrypt(wordData.word))
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing dictionary word:', checkError);
        return;
    }

    if (existing) {
        console.log(`Word "${wordData.word}" already exists in dictionary. Skipping.`);
        return;
    }
    
    let pronunciation_url: string | null = null;
    if (wordData.type === 'written') {
      try {
          const suggestedWord = wordData.corrected_context;
          console.log(`[Pronunciation] Generating audio for: ${suggestedWord}`);
          const { generatePronunciation } = await import('@/ai/flows/generate-pronunciation');
          const pronunciationResult = await generatePronunciation({ word: suggestedWord, language: 'English' });
          if (pronunciationResult.audioDataUri) {
              const audioBuffer = Buffer.from(pronunciationResult.audioDataUri.split(',')[1], 'base64');
              const filePath = `${user.id}/pronunciations/${suggestedWord.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.wav`;
              const { error: uploadError } = await supabase.storage
                  .from('journal-media')
                  .upload(filePath, audioBuffer, { contentType: 'audio/wav' });

              if (uploadError) {
                  console.error('Error uploading pronunciation audio:', uploadError);
              } else {
                  pronunciation_url = filePath;
              }
          }
      } catch (e) {
          console.error("Failed to generate pronunciation for dictionary word:", getAIErrorMessage(e));
      }
    }


    const { error } = await supabase.from('dictionary_words').insert({
        user_id: user.id,
        word: encrypt(wordData.word),
        original_context: encrypt(wordData.original_context),
        corrected_context: encrypt(wordData.corrected_context),
        explanation: encrypt(wordData.explanation),
        type: wordData.type,
        pronunciation_url: pronunciation_url,
    });

    if (error) {
        console.error('Error adding word to dictionary:', error);
    } else {
        revalidatePath('/dictionary');
    }
}

export async function saveGrammarMistakes(entryId: string, entryCreatedAt: string, corrections: GrammarCorrection[], profile?: Profile | null) {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || corrections.length === 0) return;

    let userProfile = profile;
    if (!userProfile) {
        userProfile = await getProfile();
    }
    if (!userProfile) {
        console.error("Could not save grammar mistakes: profile not found.");
        return;
    }

    const mistakesToInsert = corrections.map(correction => ({
        user_id: user.id,
        journal_entry_id: entryId,
        mistake_category: correction.mistakeCategory,
        explanation: correction.explanation,
        created_at: entryCreatedAt,
        // Only include academic tracking if columns exist (defensive against older schema)
        ...((userProfile as any).branch ? { branch: (userProfile as any).branch } : {}),
        ...((userProfile as any).section ? { section: (userProfile as any).section } : {}),
    }));

    try {
        const { error } = await supabase.from('grammar_mistakes').insert(mistakesToInsert);
        if (error) {
            console.error('Error saving grammar mistakes (Database error):', error);
        }
    } catch (dbError) {
        console.error('Error saving grammar mistakes (Exception):', dbError);
    }
}


export async function getAndSaveFullAnalysis(
  entryId: string,
  plainTextContent: string,
  existingAnalysis: any,
  analysisType: 'personal' | 'language',
  proficiencyScore?: number
): Promise<JournalEntry | { error: string } | null> {
    if (!plainTextContent) return null;
  
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };
  
    const profile = await getProfile();
    if (!profile) return { error: 'Could not load user profile.' };
    
    if (!profile.ai_analysis_enabled) {
      return { error: 'AI analysis is disabled in your profile settings.' };
    }
    
    try {
      if (!plainTextContent) {
          return { error: "Cannot analyze an empty entry." };
      }
  
      const { analyzeJournalEntry } = await import('@/ai/flows/analyze-journal-entry');
      const analysisResult: AnalyzeJournalEntryOutput = await analyzeJournalEntry({ 
          journalContent: plainTextContent, 
          analysisType 
      });
      
      if (!analysisResult) {
        throw new Error('Analysis failed to return data.');
      }
      
      const newAnalysisData = {
          ...existingAnalysis,
          ...analysisResult,
      };

      const updatePayload: Partial<JournalEntry> = {
          analysis: newAnalysisData,
      };

      if (analysisType === 'language' && analysisResult.language) {
          const { analyzeTextForLanguage } = await import('@/ai/flows/analyze-text-for-language');
          const languageCorrections = await analyzeTextForLanguage({ text: plainTextContent, targetLanguage: 'English', proficiencyScore });
          if (languageCorrections) {
            updatePayload.language_analysis = languageCorrections;
            
            const { data: entry, error: fetchError } = await supabase.from('journal_entries').select('created_at').eq('id', entryId).single();
            if (fetchError) throw fetchError;
            
            await saveGrammarMistakes(entryId, entry.created_at, languageCorrections.grammarCorrections, profile);
            
            for (const item of languageCorrections.vocabularyEnhancements) {
                 await addDictionaryWord({
                    word: item.originalWord,
                    original_context: plainTextContent.substring(0, 500),
                    corrected_context: item.suggestedWord,
                    explanation: item.explanation,
                    type: 'written',
                    pronunciation_url: null,
                 });
            }
          }
          
          // New logic: Recalculate and update the average grammar score in the profile
          const { data: allAnalyzedEntries, error: entriesError } = await supabase
            .from('journal_entries')
            .select('analysis')
            .eq('user_id', user.id)
            .not('analysis->language->grammaticalAccuracy', 'is', null);

          if (entriesError) {
              console.error("Error fetching entries to update avg score:", entriesError);
          } else if (allAnalyzedEntries) {
              const scores = allAnalyzedEntries
                .map(e => e.analysis?.language?.grammaticalAccuracy)
                .filter((s): s is number => s !== undefined && s !== null);
              
              const newScore = analysisResult.language.grammaticalAccuracy;
              scores.push(newScore);

              const newAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
              
              await supabase
                .from('profiles')
                .update({ avg_grammar_score: newAverage })
                .eq('id', user.id);
          }
      }
    
      const { error: updateError } = await supabase
          .from('journal_entries')
          .update(updatePayload)
          .eq('id', entryId);
  
      if (updateError) throw updateError;
    
      revalidatePath('/profile');
      revalidatePath('/admin/users'); // Revalidate analytics page
  
      const { data: updatedEntry, error: fetchUpdatedError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
      
      if (fetchUpdatedError) throw fetchUpdatedError;

      return updatedEntry;
  
    } catch (error) {
      console.error('Error getting and saving full analysis:', error);
      return { error: getAIErrorMessage(error) };
    }
  }


export async function askJournalQuestion(
  entryId: string,
  messages: any[]
): Promise<{ newConversation?: any[]; error?: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const profile = await getProfile();
  if (!profile) return { error: 'Profile not found.' };

  const { data: entry, error: fetchError } = await supabase
    .from('journal_entries')
    .select('content')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !entry) return { error: 'Could not find the journal entry.' };

  try {
    const decryptedContent = decrypt(entry.content);
    const plainTextContent = getPlainTextFromTiptapJson(decryptedContent);

    const validatedInput = GenerateJournalChatResponseInputSchema.parse({
        journalContent: plainTextContent,
        chatHistory: messages
    });

    const { generateJournalChatResponse } = await import('@/ai/flows/generate-journal-chat-response');
    const result = await generateJournalChatResponse(validatedInput);

    const newConversation = [...messages, { role: 'assistant', content: result.assistantResponse }];
    
    const encryptedConversation = encrypt(JSON.stringify(newConversation));

    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({ conversation: encryptedConversation })
      .eq('id', entryId);

    if (updateError) throw updateError;
    
    revalidatePath(`/journal/${entryId}`);
    return { newConversation };

  } catch (e) {
    console.error("Error in askJournalQuestion:", e);
    return { error: getAIErrorMessage(e) };
  }
}

export async function submitToAssignment(entryId: string, assignmentId: string): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('journal_entries')
        .update({
            assignment_id: assignmentId,
            is_submitted: true,
            submitted_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('user_id', user.id);
    
    if (error) {
        console.error('Error submitting to assignment:', error);
        return { error: `Failed to submit to assignment. Please ensure RLS policies on 'journal_entries' allow updates.` };
    }
    
    revalidatePath(`/journal/${entryId}`);
    revalidatePath('/submissions');
    revalidatePath(`/admin/assignment/${assignmentId}`);
    return {};
}

// Kept for simple review submissions without a specific assignment
export async function submitEntry(entryId: string): Promise<{ error?: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('journal_entries')
    .update({ 
      is_submitted: true,
      submitted_at: new Date().toISOString(),
     })
    .eq('id', entryId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error submitting entry:', error);
    return { error: 'Failed to submit entry.' };
  }

  revalidatePath(`/journal/${entryId}`);
  revalidatePath('/submissions'); // a general path for user's own submissions
  return {};
}

export async function getSubmissionsForEntry(entryId: string): Promise<{ assignment_id: string; assignments: { title: string } | null; } | null | { error: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('journal_entries')
        .select(`
            assignment_id,
            assignments:assignments(title)
        `)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .eq('is_submitted', true)
        .not('assignment_id', 'is', null)
        .maybeSingle(); // Use maybeSingle to get one or null
        
    if (error) {
        console.error('Error fetching submissions for entry:', error);
        return { error: 'Failed to fetch submission details.' };
    }

    if (!data) return null;

    // Supabase can return an array or object for the join. Cast to ensure compatibility.
    return {
        assignment_id: data.assignment_id,
        assignments: Array.isArray(data.assignments) ? data.assignments[0] : (data.assignments as any)
    };
}

    
