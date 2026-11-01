'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileDown, BookHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EntryCard } from '@/app/journal/entry-card';
import type { JournalEntry } from '@/lib/types';
import { JournalSearch } from '@/components/journal-search';
import { JournalSortControl } from '@/components/journal-sort-control';
import { JournalTagFilter } from '@/components/journal-tag-filter';
import { getPlainTextFromTiptapJson } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getProfile } from '@/app/profile/actions';
import { setCachedData } from '@/lib/idb-cache';
import { generateJournalPDF } from '@/lib/pdf-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Loader2 } from 'lucide-react';


type JournalGridProps = {
  entries: JournalEntry[];
  allTags: string[];
  initialSelectedIds?: string[];
};

export function JournalGrid({ entries, allTags, initialSelectedIds = [] }: JournalGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (entries && entries.length > 0) {
      setCachedData('student_journals', 'latest_list', entries);
    }
  }, [entries]);

  const handleSelect = (entryId: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(entryId);
      } else {
        newSet.delete(entryId);
      }
      return newSet;
    });
  };

  const handleDownloadSelected = async () => {
    const selectedEntries = entries.filter(entry => selectedIds.has(entry.id));
    if (selectedEntries.length === 0) return;

    toast({
      title: 'Generating PDF...',
      description: `Processing ${selectedEntries.length} entries. Please wait...`,
    });

    try {
      const userProfile = await getProfile();
      await generateJournalPDF(selectedEntries, {
        authorName: userProfile?.full_name || 'Unknown Author',
        authorEmail: userProfile?.email || '',
      });

      toast({
        title: 'PDF Generated',
        description: 'Your export is being downloaded.',
      });

    } catch (error) {
      console.error("PDF Generation Error", error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: "destructive"
      });
    }
  };



  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow"><JournalSearch /></div>
        <div className="w-full md:w-auto"><JournalSortControl /></div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={handleDownloadSelected} variant="outline" className="flex-grow md:flex-grow-0">
              <FileDown className="mr-2 h-4 w-4" /> Download ({selectedIds.size})
            </Button>

          </div>
        )}
      </div>



      <div className="mb-8">
        <JournalTagFilter tags={allTags} />
      </div>

      {entries.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <EntryCard
                  entry={entry}
                  index={index}
                  viewType="journal"
                  isSelected={selectedIds.has(entry.id)}
                  onSelect={handleSelect}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BookHeart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No entries found</h2>
          <p className="mt-2 text-muted-foreground">Try adjusting your search or filter, or create a new entry.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Create New Entry</Link>
          </Button>
        </div>
      )}
    </>
  );
}
