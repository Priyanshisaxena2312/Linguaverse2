

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import type { JournalEntry, LogIteration } from '@/lib/types';
import { JournalCarousel } from '@/components/journal-carousel';
import { decrypt } from '@/lib/encryption';
import { ensureTiptapJson, sanitizeTiptapJson, getMediaPathsFromTiptapJson } from '@/lib/utils';
import { getSignedUrls, getAssignmentsForUser } from '../actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function processEntriesForViewing(entries: any[]): Promise<JournalEntry[]> {
    if (!entries || entries.length === 0) return [];

    // 1. Decrypt and Sanitize all entries first
    const decryptedAndSanitizedEntries = entries.map(entryData => {
        const decryptedContent = ensureTiptapJson(decrypt(entryData.content));
        const decryptedIterations = (entryData.iterations || []).map((iter: LogIteration) => ({
            ...iter,
            content: ensureTiptapJson(decrypt(iter.content)),
        }));
        let decryptedConversation = null;
        if (entryData.conversation) {
            try {
                const decryptedString = decrypt(entryData.conversation);
                // THE FIX: Only parse if the decrypted string is not empty.
                if (decryptedString) {
                    decryptedConversation = JSON.parse(decryptedString);
                }
            } catch (e) {
                if (typeof entryData.conversation === 'object') {
                    decryptedConversation = entryData.conversation;
                }
            }
        }
        const decryptedTeacherFeedback = entryData.teacher_feedback ? decrypt(entryData.teacher_feedback) : null;
        return {
            ...entryData,
            content: sanitizeTiptapJson(decryptedContent),
            iterations: decryptedIterations.map((iter: any) => ({ ...iter, content: sanitizeTiptapJson(iter.content) })),
            conversation: decryptedConversation,
            teacher_feedback: decryptedTeacherFeedback,
        };
    });

    // 2. Gather all media paths from all entries and their iterations
    const allMediaPaths = decryptedAndSanitizedEntries.flatMap(entry => [
        ...getMediaPathsFromTiptapJson(entry.content),
        ...(entry.iterations || []).flatMap((iter: LogIteration) => getMediaPathsFromTiptapJson(iter.content))
    ]);

    if (allMediaPaths.length === 0) {
        return decryptedAndSanitizedEntries;
    }

    // 3. Get all signed URLs in a single batch call
    const signedUrls = await getSignedUrls(allMediaPaths);

    // 4. Inject signed URLs into the content
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

async function fetchAllJournalEntries() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch entries for carousel:", error);
        return [];
    }

    return await processEntriesForViewing(entries);
}

export default async function JournalViewPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const profile = await getProfile();
    if (!profile) {
        notFound();
    }

    const entries = await fetchAllJournalEntries();
    const assignments = await getAssignmentsForUser();
    const initialSlide = searchParams.initialSlide ? parseInt(searchParams.initialSlide as string, 10) : 0;

    return (
        <div className="h-[calc(100vh-theme(space.14))]">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <JournalCarousel entries={entries} profile={profile} initialSlide={initialSlide} assignments={assignments} />
            </Suspense>
        </div>
    );
}
