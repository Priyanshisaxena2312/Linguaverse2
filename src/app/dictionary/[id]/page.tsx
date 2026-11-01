

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { createClient } from '@/lib/supabase/server';
import type { JournalEntry } from '@/lib/types';
import { getPlainTextFromTiptapJson, ensureTiptapJson, sanitizeTiptapJson, getMediaPathsFromTiptapJson } from '@/lib/utils';
import { getSignedUrls } from '@/app/journal/actions';
import { decrypt } from '@/lib/encryption';
import { DictionaryEntryView } from '@/components/dictionary-entry-view';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

async function getEntryForCorrection(entryId: string): Promise<JournalEntry | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data: entryData, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (error || !entryData) {
        return null;
    }
    
    const decryptedContent = ensureTiptapJson(decrypt(entryData.content));
    const sanitizedContent = sanitizeTiptapJson(decryptedContent);
    const finalContent = await processContentForViewing(sanitizedContent);

    return {
      ...entryData,
      content: finalContent,
    } as JournalEntry;
}

async function processContentForViewing(contentToProcess: any): Promise<any> {
    if (!contentToProcess) {
        return contentToProcess;
    }
    const mediaPaths = getMediaPathsFromTiptapJson(contentToProcess);
    if (mediaPaths.length === 0) {
        return contentToProcess;
    }

    const signedUrls = await getSignedUrls(mediaPaths, 'journal-media');
    const updatedContent = JSON.parse(JSON.stringify(contentToProcess));

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

    if (updatedContent.content) {
        traverseAndUpdate(updatedContent.content);
    }
    return updatedContent;
}


export default async function DictionaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile) {
        notFound();
    }
    
    const entry = await getEntryForCorrection(id);

    if (!entry) {
        notFound();
    }
    
    return (
        <div className="h-[calc(100vh-theme(space.14))] flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b gap-4">
                <Button asChild variant="outline">
                    <Link href="/dictionary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dictionary
                    </Link>
                </Button>
            </header>
            <div className="flex-grow overflow-hidden">
                <DictionaryEntryView entry={entry} />
            </div>
        </div>
    );
}
