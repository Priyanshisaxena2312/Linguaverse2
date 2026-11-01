
export const dynamic = 'force-dynamic';


import { createClient } from '@/lib/supabase/server';
import { JournalView } from '@/components/journal-view';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { JournalEntry, Theme, PageStyle, LogIteration } from '@/lib/types';
import { getProfile } from '@/app/profile/actions';
import { sanitizeTiptapJson, getMediaPathsFromTiptapJson, ensureTiptapJson } from '@/lib/utils';
import { getSignedUrls, getAssignmentsForUser } from '../actions';
import { decrypt } from '@/lib/encryption';

type JournalEntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Fetches signed URLs for any media in the entry content and returns
 * a new content object with the updated URLs.
 * This function runs on the server.
 */
async function processContentForViewing(contentToProcess: any): Promise<any> {
    if (!contentToProcess) {
        return contentToProcess;
    }
    const mediaPaths = getMediaPathsFromTiptapJson(contentToProcess);
    if (mediaPaths.length === 0) {
        return contentToProcess;
    }

    const signedUrls = await getSignedUrls(mediaPaths, 'journal-media');
    // Deep clone the content to avoid mutating the original object
    const updatedContent = JSON.parse(JSON.stringify(contentToProcess));

    // Traverses the Tiptap JSON and replaces storage paths with signed URLs
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

// Same as above, but for an array of iterations
async function processIterationsForViewing(iterationsToProcess: any[] | null | undefined): Promise<any[]> {
    if (!iterationsToProcess) {
        return [];
    }
    const allMediaPaths = iterationsToProcess.flatMap(iter => getMediaPathsFromTiptapJson(iter.content));
    if (allMediaPaths.length === 0) {
        return iterationsToProcess;
    }
    
    const signedUrls = await getSignedUrls(allMediaPaths, 'journal-media');
    const updatedIterations = JSON.parse(JSON.stringify(iterationsToProcess));

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
    
    updatedIterations.forEach((iter: any) => {
        if (iter.content?.content) {
            traverseAndUpdate(iter.content.content);
        }
    });

    return updatedIterations;
}


export default async function JournalEntryPage(props: JournalEntryPageProps) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: entryData } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!entryData) {
    notFound();
  }
  
  const profile = await getProfile();
  if (!profile) {
    return <div className="text-center p-8">Could not load user profile. Please try logging in again.</div>
  }
  
  // Decrypt the main content and all iterations
  const decryptedJsonContent = ensureTiptapJson(decrypt(entryData.content));
  const decryptedIterations = (entryData.iterations || []).map((iter: LogIteration) => ({
      ...iter,
      // Ensure each iteration's content is valid Tiptap JSON
      content: ensureTiptapJson(decrypt(iter.content))
  }));

  // Decrypt conversation history
  let decryptedConversation = null;
  if (entryData.conversation) {
    try {
        if (typeof entryData.conversation === 'object' && entryData.conversation !== null) {
            decryptedConversation = entryData.conversation;
        } else if (typeof entryData.conversation === 'string') {
            const decryptedString = decrypt(entryData.conversation);
            if (decryptedString) {
                try {
                    decryptedConversation = JSON.parse(decryptedString);
                } catch (parseError) {
                    console.error("Failed to parse decrypted conversation:", parseError);
                    decryptedConversation = null;
                }
            }
        }
    } catch (e) {
        console.error("Failed to decrypt conversation history.", e);
    }
  }

  const decryptedTeacherFeedback = entryData.teacher_feedback ? decrypt(entryData.teacher_feedback) : null;


  // Sanitize the content first to fix any structural issues and ensure it's a plain object.
  const sanitizedContent = sanitizeTiptapJson(decryptedJsonContent);
  const sanitizedIterations = decryptedIterations.map((iter: any) => ({
    ...iter,
    content: sanitizeTiptapJson(iter.content),
  }));

  // Then, process it on the server to inject signed URLs for images.
  const finalContent = await processContentForViewing(sanitizedContent);
  const finalIterations = await processIterationsForViewing(sanitizedIterations);

  const assignments = await getAssignmentsForUser();

  // Ensure we have a valid entry object to pass to the client component
  const validEntry: JournalEntry = {
      id: entryData.id,
      user_id: entryData.user_id,
      created_at: entryData.created_at,
      title: entryData.title,
      content: finalContent, // Pass the fully processed content
      source: entryData.source || 'manual', // Add source
      analysis: entryData.analysis ? entryData.analysis as Partial<any> : null,
      language_analysis: entryData.language_analysis || null,
      theme: (entryData.theme as Theme) || 'default',
      page_style: (entryData.page_style as PageStyle) || 'default',
      is_project_log: entryData.is_project_log || false,
      iterations: finalIterations,
      conversation: decryptedConversation,
      tags: entryData.tags || [],
      teacher_feedback: decryptedTeacherFeedback,
      is_submitted: entryData.is_submitted,
      submitted_at: entryData.submitted_at,
  }

  const formattedDate = new Date(entryData.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Specifying a timezone ensures consistency between server and client.
  });

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/journal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </Link>
        </Button>
      </div>
      <JournalView entry={validEntry} profile={profile} plan={profile.plan} formattedDate={formattedDate} assignments={assignments} />
    </div>
  );
}
