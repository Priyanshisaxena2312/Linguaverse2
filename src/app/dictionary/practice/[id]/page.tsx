
export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/app/profile/actions';
import type { JournalEntry, VocabularySuggestion, GrammarCorrection, GeneratePracticeQuizOutput, PracticeSession } from '@/lib/types';
import { decrypt } from '@/lib/encryption';
import { ensureTiptapJson, tiptapJsonToHtml, markdownToTiptapJson, sanitizeHtml } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChatPracticeClient } from '@/components/chat-practice-client';
import { generatePracticeQuiz } from '@/ai/flows/generate-practice-quiz';
import { PracticeQuiz } from '@/components/practice-quiz';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type Correction = (VocabularySuggestion | GrammarCorrection);

type PracticeData = {
  entry: JournalEntry;
  corrections: Correction[];
  quiz: GeneratePracticeQuizOutput | null;
  pastSessions: PracticeSession[];
}

async function getPracticeData(entryId: string): Promise<PracticeData | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();
    
    if (entryError || !entryData || !entryData.language_analysis) {
        return null;
    }
    
    const languageAnalysis = entryData.language_analysis as any;
    const corrections: Correction[] = [
        ...(languageAnalysis.grammarCorrections || []),
        ...(languageAnalysis.vocabularyEnhancements || []),
    ];

    let quiz: GeneratePracticeQuizOutput | null = null;
    if (corrections.length > 0) {
        try {
            const quizInput = {
                corrections: corrections.map(c => ({
                    original: 'originalPhrase' in c ? c.originalPhrase : c.originalWord,
                    suggestion: 'correctedPhrase' in c ? c.correctedPhrase : ('suggestedWord' in c ? c.suggestedWord : ''),
                    explanation: c.explanation
                }))
            };
            quiz = await generatePracticeQuiz(quizInput);
        } catch (e) {
            console.error("Failed to generate practice quiz:", e);
        }
    }
    
    const { data: pastSessionsData, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('journal_entry_id', entryId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error("Failed to fetch past sessions:", sessionsError);
    }
    
    const pastSessions: PracticeSession[] = (pastSessionsData || []).map(s => ({
        ...s,
        chat_history: s.chat_history ? JSON.parse(decrypt(s.chat_history)) : [],
        performance_report: s.performance_report ? decrypt(s.performance_report) : '',
    }));

    return {
      entry: {
        ...entryData,
        content: ensureTiptapJson(decrypt(entryData.content)),
      } as JournalEntry,
      corrections,
      quiz,
      pastSessions,
    };
}

const PastSessionsDialog = ({ sessions }: { sessions: PracticeSession[] }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="secondary"><RotateCcw className="mr-2 h-4 w-4" /> Past Sessions</Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Past Practice Sessions</DialogTitle>
        <DialogDescription>Review your previous practice sessions and reports for this entry.</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[70vh] pr-4">
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map(session => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Session from {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</CardTitle>
                  <CardDescription>Quiz Score: {session.quiz_score || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent>
                   <div
                    className={cn('prose dark:prose-invert max-w-none text-sm p-3 border rounded-md bg-muted/50')}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(tiptapJsonToHtml(markdownToTiptapJson(session.performance_report))) }}
                   />
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground p-8">No past practice sessions found for this entry.</p>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);


export default async function PracticeSessionPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: 'chat' | 'voice' }> }) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const profile = await getProfile();
    if (!profile) redirect('/login');
    
    const practiceData = await getPracticeData(id);
    if (!practiceData) notFound();
    
    const { entry, corrections, quiz, pastSessions } = practiceData;
    const initialTab = resolvedSearchParams?.mode || 'quiz';

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary flex items-center gap-3 capitalize">
                         <Sparkles/> Practice Session
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">For: "{entry.title}"</p>
                </div>
                <div className="flex items-center gap-2">
                    <PastSessionsDialog sessions={pastSessions} />
                    <Button asChild variant="outline">
                        <Link href="/journal?tab=dictionary">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dictionary
                        </Link>
                    </Button>
                </div>
            </header>
            
            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quiz"><Sparkles className="mr-2 h-4 w-4" />Quick Quiz</TabsTrigger>
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat Practice</TabsTrigger>
                </TabsList>
                 <TabsContent value="quiz" className="mt-6">
                     <PracticeQuiz quiz={quiz} corrections={corrections} />
                </TabsContent>
                <TabsContent value="chat" className="mt-6">
                     <ChatPracticeClient entry={entry} corrections={corrections} quizScore={quiz ? `${quiz.questions.length}/${quiz.questions.length}`: null} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
