
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BookText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getHardWords, getComparedWords } from '@/app/todo/actions';
import { PracticeQuizGenerator } from '@/components/practice-quiz-generator';
import type { HardWord, ComparedWord } from '@/lib/types';
import { decrypt } from '@/lib/encryption';
import type { CompareWordsOutput } from '@/ai/flows/compare-words';
import { Suspense } from 'react';

async function HardWordsTab() {
  const words = await getHardWords();
  return <PracticeQuizGenerator items={words} itemType="hard-word" />;
}

async function ComparedWordsTab() {
    const words = await getComparedWords();
    const decryptedComparisons = words.map(c => ({
        ...c,
        comparison_details_obj: JSON.parse(decrypt(c.comparison_details))
    }));
    return <PracticeQuizGenerator items={decryptedComparisons} itemType="compared-word" />;
}


export default async function QuizPracticePage() {
  const profile = await getProfile();
  if (!profile) notFound();

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3">
            <BookText className="h-10 w-10" />
            Quiz Arena
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Select items to start a quiz.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dictionary/practice">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Practice Arena
          </Link>
        </Button>
      </header>
      
      <Tabs defaultValue="hard-words" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hard-words">My Hard Words</TabsTrigger>
          <TabsTrigger value="compared-words">Compared Words</TabsTrigger>
        </TabsList>
        <TabsContent value="hard-words" className="mt-6">
            <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading words...</div>}>
                <HardWordsTab />
            </Suspense>
        </TabsContent>
        <TabsContent value="compared-words" className="mt-6">
             <Suspense fallback={<div className="text-center p-8 text-muted-foreground">Loading comparisons...</div>}>
                <ComparedWordsTab />
            </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
