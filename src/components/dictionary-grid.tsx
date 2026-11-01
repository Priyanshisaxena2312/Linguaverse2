
'use client';

import { useState } from 'react';
import type { JournalEntry } from '@/lib/types';
import { EntryCard } from '@/app/journal/entry-card';

type DictionaryGridProps = {
  entries: JournalEntry[];
};

export function DictionaryGrid({ entries }: DictionaryGridProps) {

  // The selection logic isn't needed for the dictionary view, so we simplify.
  // We can pass dummy functions to EntryCard as it expects them.
  const handleSelect = () => {};

  return (
    <>
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry, index) => (
            <EntryCard 
              key={entry.id} 
              entry={entry} 
              index={index} 
              viewType="dictionary" 
              isSelected={false}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="mt-4 text-xl font-semibold">No Corrected Entries Yet</h2>
            <p className="mt-2 text-muted-foreground">Write some entries and use the language analysis to get language feedback that will appear here.</p>
        </div>
      )}
    </>
  );
}
