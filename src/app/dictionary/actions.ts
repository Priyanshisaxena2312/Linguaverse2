
'use server';

import { createActionClient } from '@/lib/supabase/actions';
import type { DictionaryWord, JournalEntry, LogIteration } from '@/lib/types';
import { decrypt } from '@/lib/encryption';
import { getSignedUrls } from '../journal/actions';
import { sanitizeTiptapJson, getMediaPathsFromTiptapJson, ensureTiptapJson } from '@/lib/utils';
import { redirect } from 'next/navigation';


async function processEntriesForViewing(entries: any[]): Promise<JournalEntry[]> {
    if (!entries || entries.length === 0) return [];
    
    const decryptedAndSanitizedEntries = entries.map(entryData => {
        const decryptedContent = ensureTiptapJson(decrypt(entryData.content));
        const decryptedIterations = (entryData.iterations || []).map((iter: LogIteration) => ({
            ...iter,
            content: ensureTiptapJson(decrypt(iter.content)),
        }));
        let decryptedConversation = null;
        if (entryData.conversation) {
            try {
                decryptedConversation = JSON.parse(decrypt(entryData.conversation));
            } catch (e) {
                 if (typeof entryData.conversation === 'object') {
                    decryptedConversation = entryData.conversation;
                }
            }
        }
        return {
            ...entryData,
            content: sanitizeTiptapJson(decryptedContent),
            iterations: decryptedIterations.map((iter: any) => ({ ...iter, content: sanitizeTiptapJson(iter.content) })),
            conversation: decryptedConversation
        };
    });

    const allMediaPaths = decryptedAndSanitizedEntries.flatMap(entry => [
        ...getMediaPathsFromTiptapJson(entry.content),
        ...(entry.iterations || []).flatMap((iter: LogIteration) => getMediaPathsFromTiptapJson(iter.content))
    ]);
    
    if (allMediaPaths.length === 0) {
        return decryptedAndSanitizedEntries;
    }

    const signedUrls = await getSignedUrls(allMediaPaths);
    
    const traverseAndUpdate = (nodes: any[]) => {
        if (!nodes) return;
        nodes.forEach(node => {
            if (node.type === 'image' && node.attrs?.src && signedUrls[node.attrs.src]) {
                node.attrs.src = signedUrls[node.attrs.src];
            }
            if (node.content) {
                traverseAndUpdate(node.content);
            }
        });
    };
    
    return decryptedAndSanitizedEntries.map(entry => {
        const finalContent = JSON.parse(JSON.stringify(entry.content));
        if (finalContent.content) {
            traverseAndUpdate(finalContent.content);
        }

        const finalIterations = JSON.parse(JSON.stringify(entry.iterations));
        finalIterations.forEach((iter: any) => {
            if (iter.content?.content) {
                traverseAndUpdate(iter.content.content);
            }
        });

        return { ...entry, content: finalContent, iterations: finalIterations };
    });
}


export async function getEntriesWithCorrections(): Promise<JournalEntry[]> {
    const supabase = await createActionClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .not('language_analysis', 'is', null) // Only fetch entries that have language analysis
        .order('created_at', { ascending: false });

    if (error) {
        // If it's just no data found, don't log a scary error
        if (error.code !== 'PGRST116') {
            console.warn("No entries with corrections yet.");
        }
        return [];
    }

    return await processEntriesForViewing(entries);
}
