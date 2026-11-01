
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Sparkles, BookText, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEntriesWithCorrections } from '@/app/dictionary/actions';
import { getHardWords, getComparedWords } from '@/app/todo/actions';
import { PracticeQuizGenerator } from '@/components/practice-quiz-generator';
import type { HardWord, ComparedWord } from '@/lib/types';
import { decrypt } from '@/lib/encryption';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


// --- Quiz Arena Components ---

async function CorrectionsTab() {
  const entries = await getEntriesWithCorrections();

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>You have no corrected entries to practice with.</p>
        <p className="text-sm">Write an entry and use the AI language analysis to generate corrections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <Card key={entry.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{entry.title}</CardTitle>
              <CardDescription>Practice the corrections from this entry.</CardDescription>
            </div>
            <Button asChild>
              <Link href={`/dictionary/practice/${entry.id}`}>Start Session</Link>
            </Button>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

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

const QuizArena = () => (
    <Tabs defaultValue="corrections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="corrections">Entry Corrections</TabsTrigger>
          <TabsTrigger value="hard-words">Hard Words</TabsTrigger>
          <TabsTrigger value="compared-words">Compared Words</TabsTrigger>
        </TabsList>
        <TabsContent value="corrections" className="mt-6">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <CorrectionsTab />
            </Suspense>
        </TabsContent>
        <TabsContent value="hard-words" className="mt-6">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <HardWordsTab />
            </Suspense>
        </TabsContent>
        <TabsContent value="compared-words" className="mt-6">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <ComparedWordsTab />
            </Suspense>
        </TabsContent>
      </Tabs>
);

// --- Main Page Component ---

export default async function PracticePage() {
  const profile = await getProfile();
  if (!profile) notFound();

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3">
            <Sparkles className="h-10 w-10" />
            Practice Arena
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Hone your language skills with custom quizzes.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </header>
      
      <div className="mb-10">
        <Card className="bg-primary/5 border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Speaking Studio
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Live roleplay, group discussions, and speech analysis with AI.
              </CardDescription>
            </div>
            <Button asChild size="lg" className="shrink-0 gap-2">
              <Link href="/dictionary/practice/speaking">
                Enter Studio <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
          </CardHeader>
        </Card>
      </div>

      <QuizArena />
    </div>
  );
}
