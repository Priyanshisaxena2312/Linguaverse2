
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { JournalEntryForm } from '@/components/journal-entry-form';
import { VoiceJournalForm } from '@/components/voice-journal-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenSquare, MessageSquare, Mic } from 'lucide-react';
import type { JournalEntryForCreate, Profile, LogIteration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage, convertSignedUrlsToStoragePaths, ensureTiptapJson } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

type AddIterationDialogProps = {
  children: React.ReactNode;
  profile: Profile;
  onEntryGenerated: (entry: JournalEntryForCreate) => Promise<void>;
  isEditing: boolean;
  iterationToEdit?: LogIteration | null;
  onEntryUpdated: (iterationId: string, entry: JournalEntryForCreate) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddIterationDialog({ 
    children, 
    profile, 
    onEntryGenerated,
    isEditing,
    iterationToEdit,
    onEntryUpdated,
    isOpen,
    onOpenChange
}: AddIterationDialogProps) {
  const { toast } = useToast();

  const handleEntryAction = async (entry: JournalEntryForCreate) => {
    try {
      const contentWithPermanentPaths = convertSignedUrlsToStoragePaths(entry.content);

      const entryToSave: JournalEntryForCreate = {
        title: entry.title || 'Log Update',
        content: contentWithPermanentPaths,
      };
      
      if (isEditing && iterationToEdit) {
          await onEntryUpdated(iterationToEdit.id, entryToSave);
      } else {
          await onEntryGenerated(entryToSave);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getAIErrorMessage(error),
      });
    }
  };
  
  const initialFormContent = isEditing && iterationToEdit 
    ? ensureTiptapJson(iterationToEdit.content) 
    : { type: 'doc', content: [] };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project Update' : 'Add New Project Update'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify the details of this iterative update.' : 'Add a new iterative update to your project log using your preferred method.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <Tabs defaultValue="direct-entry" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-primary/10 rounded-lg">
                <TabsTrigger value="direct-entry" className="py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner rounded-md">
                  <PenSquare className="mr-2 h-5 w-5 opacity-80" />
                  Direct Entry
                </TabsTrigger>
                <TabsTrigger value="voice-entry" className="py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner rounded-md">
                  <Mic className="mr-2 h-5 w-5 opacity-80" />
                  Voice Entry
                </TabsTrigger>
              </TabsList>
              <TabsContent value="direct-entry" className="mt-6">
                <JournalEntryForm 
                  onEntryGenerated={handleEntryAction} 
                  profile={profile} 
                  isIterationMode={true} 
                  initialContent={initialFormContent} 
                  isEditing={isEditing}
                  onEntryUpdated={handleEntryAction}
                />
              </TabsContent>
              <TabsContent value="voice-entry" className="mt-6">
                <VoiceJournalForm onEntryGenerated={(entry) => handleEntryAction(entry)} profile={profile} isIterationMode={true} />
              </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
