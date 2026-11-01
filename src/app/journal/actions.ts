'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';
import type { JournalEntry, JournalEntryForCreate, Profile, LogIteration, AnalyzeJournalEntryOutput, Assignment, Submission, GrammarCorrection, ChatBasedJournalingInput, ChatBasedJournalingOutput } from '@/lib/types';
import { getProfile } from '@/app/profile/actions';
import { getHashtagsFromTiptapJson, cn, getAIErrorMessage, getPlainTextFromTiptapJson, convertSignedUrlsToStoragePaths, markdownToTiptapJson, tiptapJsonToHtml, ensureTiptapJson, sanitizeTiptapJson } from "@/lib/utils";
import { encrypt, decrypt } from '@/lib/encryption';
import { createClient } from '@/lib/supabase/server';
import type { GenerateLogReportOutput } from "@/ai/flows/generate-log-report";
import type { GenerateChatResponseInput, GenerateChatResponseOutput } from '@/ai/flows/generate-chat-response';
import type { GenerateJournalEntryInput, GenerateJournalEntryOutput } from '@/ai/flows/generate-journal-entry';
import { DEMO_USER_ID, DEMO_ENTRIES } from '@/lib/demo-mode';


export async function generateChatResponseAction(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput | { error: string }> {
    try {
        const { generateChatResponse } = await import('@/ai/flows/generate-chat-response');
        return await generateChatResponse(input);
    } catch (e) {
        console.error("AI Chat Error:", e);
        return { error: getAIErrorMessage(e) };
    }
}

export async function generateJournalFromChatAction(input: ChatBasedJournalingInput): Promise<ChatBasedJournalingOutput | { error: string }> {
    try {
        const { chatBasedJournaling } = await import('@/ai/flows/chat-based-journaling');
        return await chatBasedJournaling(input);
    } catch (e) {
        console.error("AI Journaling Error:", e);
        return { error: getAIErrorMessage(e) };
    }
}

export async function generateJournalEntryAction(input: GenerateJournalEntryInput): Promise<GenerateJournalEntryOutput | { error: string }> {
    try {
        const { generateJournalEntry } = await import('@/ai/flows/generate-journal-entry');
        return await generateJournalEntry(input);
    } catch (e) {
        console.error("AI Journal Generation Error:", e);
        return { error: getAIErrorMessage(e) };
    }
}


type AddEntryResult = {
  data?: JournalEntry | null;
  error?: string | null;
}

export async function addEntry(entry: JournalEntryForCreate, source: 'manual' | 'chat' | 'voice'): Promise<AddEntryResult> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  const profile = await getProfile();
  if (!profile) {
      return { error: 'Could not load user profile.' };
  }

  const sanitizedJsonContent = ensureTiptapJson(entry.content);
  const encryptedContent = encrypt(JSON.stringify(sanitizedJsonContent));

  let finalIterations: any = null;
  if (entry.is_project_log) {
    if (entry.iterations && Array.isArray(entry.iterations)) {
      finalIterations = entry.iterations.map(it => ({
        ...it,
        content: encrypt(JSON.stringify(ensureTiptapJson(it.content))),
      }));
    } else {
      finalIterations = [];
    }
  }
  
  const entryToInsert = {
    title: entry.title!,
    user_id: user.id,
    content: encryptedContent,
    source: source,
    // Ensure no analysis data is saved on initial creation
    analysis: null,
    language_analysis: null,
    theme: entry.theme || 'default',
    page_style: entry.page_style || 'default',
    is_project_log: entry.is_project_log || false,
    tags: [], // Tags will be generated on-demand later
    conversation: entry.conversation || null,
    iterations: finalIterations,
    audio_url: entry.audio_url || null,
    audio_duration: entry.audio_duration || null,
  };


  const { data, error } = await supabase
    .from('journal_entries')
    .insert([entryToInsert])
    .select()
    .single();

  if (error) {
    console.error('Error adding entry:', error);
    return { error: 'Database error while saving entry.' };
  }
  
  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  return { data };
}

export async function saveSpeakingSessionAction(input: {
    practiceType: string;
    topic: string;
    chatHistory: { role: string, content: string }[];
    report: any;
}) {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const title = `Speaking Practice: ${input.practiceType} (${input.topic})`;
    
    // Convert history to a readable display format for the journal content
    const chatContent = input.chatHistory
        .filter(m => m.content !== 'Hello! I am ready to start.')
        .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
        .join('\n\n');

    const entryToInsert = {
        title: title,
        user_id: user.id,
        content: encrypt(JSON.stringify(markdownToTiptapJson(chatContent))),
        source: 'speaking_studio',
        analysis: null,
        speaking_analysis: input.report,
        theme: 'default',
        page_style: 'default',
        is_project_log: false,
        tags: ['speaking', input.practiceType.toLowerCase().replace(' ', '_')],
        conversation: input.chatHistory,
    };

    const { data, error } = await supabase
        .from('journal_entries')
        .insert([entryToInsert])
        .select()
        .single();

    if (error) {
        console.error('Error saving session:', error);
        return { error: 'Database error while saving session.' };
    }
    
    revalidatePath('/journal');
    revalidatePath('/dashboard');
    return { data };
}

export async function updateEntry(entry: Partial<JournalEntry> & { id: string }) {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const entryToUpdate: Partial<JournalEntry> & { id: string } = { ...entry };

    if (entryToUpdate.content) {
        const sanitizedJsonContent = ensureTiptapJson(entryToUpdate.content);
        entryToUpdate.content = encrypt(JSON.stringify(sanitizedJsonContent));
        
        // Reset analysis when content changes
        entryToUpdate.analysis = null;
        entryToUpdate.language_analysis = null;
    }


    const { data, error } = await supabase
        .from('journal_entries')
        .update(entryToUpdate)
        .eq('id', entry.id)
        .eq('user_id', user.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating entry:', error);
        return null;
    }

    revalidatePath(`/journal/${entry.id}`);
    revalidatePath('/journal');
    revalidatePath('/profile');
    revalidatePath('/analysis');
    return data;
}

export async function deleteEntry(id: string) {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // 1. Fetch entry to check for audio
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('audio_url')
    .eq('id', id)
    .single();

  // 2. Delete audio file from storage if it exists
  if (entry?.audio_url) {
    try {
      await supabase.storage.from('journal-media').remove([entry.audio_url]);
    } catch (storageError) {
      console.error('Error deleting audio file from storage:', storageError);
      // We continue to delete the database entry even if storage deletion fails
    }
  }

  // 3. Delete entry from database
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting entry:', error.message);
    return { error: `Database error: ${error.message}` };
  }
  
  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/analysis');
  revalidatePath('/analysis');
  revalidatePath('/profile');
}

export async function getAnalyzedEntries(): Promise<Pick<JournalEntry, 'created_at' | 'analysis'>[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  if (user.id === DEMO_USER_ID) {
    return DEMO_ENTRIES.map(e => ({ created_at: e.created_at, analysis: e.analysis }));
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('created_at, analysis')
    .eq('user_id', user.id)
    .not('analysis', 'is', null)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    if (user.id === DEMO_USER_ID) {
      return DEMO_ENTRIES.map(e => ({ created_at: e.created_at, analysis: e.analysis }));
    }
    if (error) console.error('Error fetching analyzed entries:', error);
    return [];
  }

  return data.filter(item => item.analysis !== null) as Pick<JournalEntry, 'created_at' | 'analysis'>[];
}

export async function uploadMedia(formData: FormData): Promise<{ filePath?: string, fileName?: string, signedUrl?: string, error?: string, bucket?: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const profile = await getProfile();
  if (!profile) {
    return { error: 'Could not load user profile.' };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { error: 'No file provided.' };
  }
  
  const isAudio = file.type.startsWith('audio/');
  // Fix: All journal media, including audio recordings, should go to 'journal-media'
  const bucket = 'journal-media';

  const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { error: `Failed to upload file to storage: ${uploadError.message}` };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hour URL

  if (signedUrlError) {
    console.error('Signed URL creation error:', signedUrlError);
    return { error: `File uploaded, but preview URL could not be created: ${signedUrlError.message}` };
  }

  if (!signedUrlData?.signedUrl) {
    return { error: 'File uploaded, but an invalid preview URL was returned.' };
  }

  return { filePath, fileName: file.name, signedUrl: signedUrlData.signedUrl, bucket };
}

export async function analyzeVoiceEntry(entryId: string, audioDataUri?: string) {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  let finalAudioDataUri = audioDataUri;

  try {
    // 1. Storage Fallback: If no Data URI provided, fetch from storage
    if (!finalAudioDataUri) {
        console.log(`[AI Analysis] No Data URI provided for ${entryId}. Fetching from storage...`);
        const { data: entry, error: fetchError } = await supabase
            .from('journal_entries')
            .select('audio_url')
            .eq('id', entryId)
            .single();
        
        if (fetchError || !entry?.audio_url) {
            throw new Error("Could not find audio record for analysis.");
        }

        // 1.1 Robust Path & Bucket Handling: Extract from full URL if stored
        let storagePath = entry.audio_url;
        let bucketName = 'journal-media';

        if (storagePath.startsWith('http')) {
            // URL format: .../object/[bucket]/[relative/path]
            const parts = storagePath.split('/object/');
            if (parts.length > 1) {
                const pathParts = parts[1].split('/');
                bucketName = pathParts[0]; // The first part after /object/ is the bucket
                storagePath = pathParts.slice(1).join('/').split('?')[0]; // The rest is the path
            }
        }

        // Use service role for internal download to ensure reliability
        let downloadClient = supabase;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            downloadClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
        }

        const { data, error: downloadError } = await downloadClient.storage
            .from(bucketName)
            .download(storagePath);
        
        if (downloadError || !data) {
            throw new Error(`Failed to download audio from storage: ${downloadError?.message}`);
        }

        // Convert Blob to Base64 Data URI
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = data.type || 'audio/webm';
        finalAudioDataUri = `data:${mimeType};base64,${base64}`;
    }

    const { analyzeSpokenAudio } = await import('@/ai/flows/analyze-spoken-audio');
    
    // Get user profile for personalization
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const firstName = profile?.full_name?.split(' ')[0] || 'Student';

    console.log(`[AI Analysis] Starting spoken performance analysis for entry: ${entryId} as teacher`);
    const analysis = await analyzeSpokenAudio({
      audioDataUri: finalAudioDataUri,
      targetLanguage: 'English',
      userName: firstName
    });

    if (!analysis) {
        throw new Error("AI analysis returned empty data.");
    }

    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        content: encrypt(JSON.stringify(markdownToTiptapJson(analysis.transcribedText))),
        speaking_analysis: analysis,
        language_analysis: {
          grammarCorrections: analysis.grammarCorrections || [],
          vocabularyEnhancements: analysis.vocabularyEnhancements || [],
        }
      })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (updateError) {
        console.error(`[DB Update Error] Failed to save analysis for ${entryId}:`, updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
    }

    revalidatePath(`/journal/${entryId}`);
    return { success: true, analysis };

  } catch (e) {
    console.error(`[AI Analysis Error] Critical failure for entry ${entryId}:`, e);
    return { error: getAIErrorMessage(e) };
  }
}




function appendAudioDebugLog(message: string) {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'audio_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    // Fail silently in production but we are in dev
  }
}

export async function getSignedUrls(paths: string[], bucket: string = 'journal-media'): Promise<Record<string, string>> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || paths.length === 0) {
    appendAudioDebugLog(`getSignedUrls: Empty paths or no user. User: ${user?.id}`);
    return {};
  }

  appendAudioDebugLog(`--- NEW SIGNING REQUEST ---`);
  appendAudioDebugLog(`User ID: ${user.id}`);

  // Use Service Role Client for all signing to bypass RLS issues during playback.
  // The app has already verified the user's rights to these entries/paths in previous steps.
  let signingClient = supabase;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceKey && serviceKey !== '') {
      appendAudioDebugLog(`Service Role Key: FOUND (Length: ${serviceKey.length})`);
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      signingClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
      });
  } else {
      appendAudioDebugLog(`Service Role Key: MISSING! Falling back to user session.`);
      console.warn("getSignedUrls: SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to user-session signing (RLS restricted).");
  }

  const urlMap: Record<string, string> = {};

  for (const path of paths) {
    if (!path) continue;
    
    let actualPath = path;
    let actualBucket = bucket;

    // Handle full URLs by extracting bucket and relative path
    if (path.startsWith('http')) {
        const parts = path.split('/object/');
        if (parts.length > 1) {
            const urlParts = parts[1].split('/');
            // urlParts format: [type (sign/public/authenticated), bucket, ...path]
            if (urlParts.length >= 3) {
                actualBucket = urlParts[1];
                actualPath = urlParts.slice(2).join('/').split('?')[0];
            } else if (urlParts.length === 2) {
                // Fallback for simple object URLs
                actualBucket = urlParts[0];
                actualPath = urlParts[1].split('?')[0];
            }
        }
    } else {
        // Handle relative paths. Remove any bucket prefix if present.
        // e.g. "journal-media/user_id/file.webm" -> "user_id/file.webm"
        if (path.startsWith(`${actualBucket}/`)) {
            actualPath = path.substring(actualBucket.length + 1);
        }
    }

    // Safety: ensure no leading slashes
    actualPath = actualPath.replace(/^\/+/, '');

    appendAudioDebugLog(`Processing Path: ${path}`);
    appendAudioDebugLog(`-> Resolved Bucket: ${actualBucket}`);
    appendAudioDebugLog(`-> Resolved Path: ${actualPath}`);

    const { data, error } = await signingClient.storage
      .from(actualBucket)
      .createSignedUrl(actualPath, 3600); // 1 hour URL

    if (!error && data?.signedUrl) {
      appendAudioDebugLog(`-> SUCCESS: ${data.signedUrl.substring(0, 60)}...`);
      urlMap[path] = data.signedUrl;
    } else {
      appendAudioDebugLog(`-> ERROR: ${JSON.stringify(error)}`);
      console.error(`[getSignedUrls] ERROR signing path: ${path} | Resolved Bucket: ${actualBucket} | Resolved Path: ${actualPath} | Error:`, error);
    }
  }

  appendAudioDebugLog(`--- SIGNING REQUEST END ---`);

  return urlMap;
}

export async function addLogIteration(entryId: string, content: any): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('iterations')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (fetchError) return { error: 'Failed to find the journal entry.' };

    const newIteration: LogIteration = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        content: encrypt(JSON.stringify(ensureTiptapJson(content))),
        source: 'manual', // Iterations are always manual
    };

    const decryptedIterations = (existingEntry.iterations || []).map((iter: any) => ({
        ...iter,
        content: decrypt(iter.content) 
    }));

    const updatedIterations = [...decryptedIterations, { ...newIteration, content: decrypt(newIteration.content) }];

    const finalEncryptedIterations = updatedIterations.map(it => ({
        ...it,
        content: encrypt(JSON.stringify(ensureTiptapJson(it.content)))
    }));

    const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ iterations: finalEncryptedIterations })
        .eq('id', entryId);

    if (updateError) {
        return { error: 'Failed to save the iteration.' };
    }
    revalidatePath(`/journal/${entryId}`);
    return {};
}

export async function updateLogIteration(entryId: string, iterationId: string, content: any): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('iterations')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (fetchError) return { error: 'Failed to find the journal entry.' };

    const iterations = (existingEntry.iterations || []).map((iter: any) => ({
        ...iter,
        content: decrypt(iter.content)
    })) as LogIteration[];
    
    const iterationIndex = iterations.findIndex(it => it.id === iterationId);
    if (iterationIndex === -1) {
        return { error: 'Iteration not found.' };
    }
    iterations[iterationIndex].content = ensureTiptapJson(content);
    
    const finalEncryptedIterations = iterations.map(it => ({
        ...it,
        content: encrypt(JSON.stringify(it.content))
    }));
    
    const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ iterations: finalEncryptedIterations })
        .eq('id', entryId);

    if (updateError) {
        return { error: 'Failed to update the iteration.' };
    }
    revalidatePath(`/journal/${entryId}`);
    return {};
}

export async function deleteLogIteration(entryId: string, iterationId: string): Promise<{ error?: string }> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated.' };

    const { data: existingEntry, error: fetchError } = await supabase
        .from('journal_entries')
        .select('iterations')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (fetchError) return { error: 'Failed to find the journal entry.' };

    const iterations = (existingEntry.iterations || []).map((iter: any) => ({
        ...iter,
        content: decrypt(iter.content)
    })) as LogIteration[];

    const updatedIterations = iterations.filter(it => it.id !== iterationId);

    const finalEncryptedIterations = updatedIterations.map(it => ({
        ...it,
        content: encrypt(JSON.stringify(ensureTiptapJson(it.content)))
    }));

    const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ iterations: finalEncryptedIterations })
        .eq('id', entryId);

    if (updateError) {
        return { error: 'Failed to delete the iteration.' };
    }
    revalidatePath(`/journal/${entryId}`);
    return {};
}

export async function getProjectReport(entry: JournalEntry): Promise<GenerateLogReportOutput | { error: string }> {
  const supabase = await createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await getProfile();
  if (!profile) return { error: 'Could not load user profile.' };
  
  try {
    const { generateLogReport } = await import('@/ai/flows/generate-log-report');
    const { generateTags } = await import('@/ai/flows/generate-tags');
    const report = await generateLogReport({
      title: entry.title,
      mainGoal: entry.content,
      iterations: entry.iterations || [],
    });
    
    revalidatePath('/profile');
    
    return report;
  } catch (aiError) {
    console.error('AI report generation failed:', aiError);
    return { error: getAIErrorMessage(aiError) };
  }
}

export async function getAssignmentsForUser(): Promise<Assignment[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
       .from('assignments')
       .select('*')
       .order('created_at', { ascending: false });

   if (error) {
       console.error("Error fetching assignments for user:", error);
       return [];
   }
   return data;
}


