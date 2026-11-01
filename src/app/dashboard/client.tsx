
'use client';

import { useRouter } from 'next/navigation';
import { JournalEntryForm } from '@/components/journal-entry-form';
import { VoiceJournalForm } from '@/components/voice-journal-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Mic, MessageSquare } from 'lucide-react';
import { addEntry, analyzeVoiceEntry } from '@/app/journal/actions';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntryForCreate, Profile, JournalEntry } from '@/lib/types';
import { getAIErrorMessage, convertSignedUrlsToStoragePaths } from '@/lib/utils';
import { ReflectiveChat } from '@/components/reflective-chat';
import { SpeakingPracticeTab } from '@/components/speaking/speaking-practice-tab';
export function DashboardClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleWrittenEntry = async (entry: JournalEntryForCreate) => {
    try {
      const contentWithPermanentPaths = convertSignedUrlsToStoragePaths(entry.content);
      const entryToSave: JournalEntryForCreate = {
        ...entry,
        content: contentWithPermanentPaths,
        is_project_log: false,
        theme: entry.theme ?? 'default',
        page_style: entry.page_style ?? 'default',
        iterations: null,
      };

      const result = await addEntry(entryToSave, 'manual');

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to save entry.');
      }

      toast({ title: 'Success!', description: 'Your new entry has been saved.' });
      router.push(`/journal/${result.data.id}`);

    } catch (error) {
      console.error("Error creating written entry:", error);
      toast({ variant: 'destructive', title: 'Error Saving Entry', description: getAIErrorMessage(error) });
    }
  };

  const handleSpokenEntry = async (entry: Partial<JournalEntry>) => {
    try {
      const entryToSave: JournalEntryForCreate = {
        title: entry.title || `Spoken Entry - ${new Date().toLocaleString()}`,
        content: entry.content || { type: 'doc', content: [] },
        is_project_log: false,
        audio_url: entry.audio_url,
        audio_duration: entry.audio_duration,
        theme: 'default',
        page_style: 'default',
      };

      const result = await addEntry(entryToSave, 'voice');

      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to save spoken entry.');
      }

      toast({ title: 'Success!', description: 'Your recording has been saved. Analyzing your speech...' });
      
      // Trigger speaking analysis in the background
      analyzeVoiceEntry(result.data.id).then(() => {
          toast({ title: 'Analysis Complete!', description: 'Your speaking fluency and pronunciation report is ready.' });
          router.refresh();
      });

      router.push(`/journal/${result.data.id}`);

    } catch (error) {
      console.error("Error creating spoken entry:", error);
      toast({ variant: 'destructive', title: 'Error Saving Entry', description: getAIErrorMessage(error) });
    }
  };

  const handleChatEntry = async (entry: any) => {
      await handleWrittenEntry(entry);
  }

  return (
    <Tabs defaultValue="creative-writing" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="creative-writing" className="py-2.5">
          <Edit className="mr-2 h-5 w-5 opacity-80" />
          Creative Writing
        </TabsTrigger>
        <TabsTrigger value="reflective-chat" className="py-2.5">
          <MessageSquare className="mr-2 h-5 w-5 opacity-80" />
          Reflective Chat
        </TabsTrigger>
        <TabsTrigger value="speaking" className="py-2.5">
          <Mic className="mr-2 h-5 w-5 opacity-80" />
          Speaking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="creative-writing" className="mt-6 space-y-8">
        <JournalEntryForm onEntryGenerated={handleWrittenEntry} profile={profile} />
      </TabsContent>

      <TabsContent value="reflective-chat" className="mt-6">
        <ReflectiveChat profile={profile} onEntryCreated={handleChatEntry} />
      </TabsContent>

      <TabsContent value="speaking" className="mt-6">
        <Tabs defaultValue="voice-journal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="voice-journal">Voice Journal</TabsTrigger>
            <TabsTrigger value="speaking-practice">Speaking Practice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice-journal" className="mt-0">
            <VoiceJournalForm onEntryGenerated={handleSpokenEntry} profile={profile} />
          </TabsContent>
          
          <TabsContent value="speaking-practice" className="mt-0">
            <div className="bg-card w-full border rounded-2xl shadow-sm p-4 sm:p-6">
               <SpeakingPracticeTab userAge={profile.age} />
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
