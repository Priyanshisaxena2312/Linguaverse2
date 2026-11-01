import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { getEntriesWithCorrections } from './actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookMarked, Sparkles } from 'lucide-react';
import { EntryCard } from '@/app/journal/entry-card';

export default async function DictionaryGridPage() {
  const profile = await getProfile();
  if (!profile) {
    notFound();
  }

  const entries = await getEntriesWithCorrections();
  
  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary flex items-center gap-3">
            <BookMarked className="h-10 w-10" />
            My Dictionary
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Review language suggestions from your past entries.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/dictionary/practice">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Practice Arena
                </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
        </div>
      </header>
      
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry, index) => (
            <EntryCard key={entry.id} entry={entry} index={index} viewType="dictionary" />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Corrected Entries Found</h2>
          <p className="text-muted-foreground mt-2">Write some entries in "Creative Writing" mode to get language feedback.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Write a New Piece</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
