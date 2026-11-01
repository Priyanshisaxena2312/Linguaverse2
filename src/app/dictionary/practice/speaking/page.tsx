import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mic2, MessageSquareText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeechAnalysisTab } from '@/components/speaking/speech-analysis-tab';
import { SpeakingPracticeTab } from '@/components/speaking/speaking-practice-tab';

export const dynamic = 'force-dynamic';

export default async function SpeakingPracticePage() {
    const profile = await getProfile();
    if (!profile) notFound();

    return (
        <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8 pt-24 sm:pt-28 md:pt-32">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3">
                        <Mic2 className="h-10 w-10 sm:h-12 sm:w-12" />
                        Speaking Studio
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground w-full max-w-2xl">
                        Improve your fluency with real-time AI feedback and dynamic, multi-voice practice sessions.
                    </p>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                    <Link href="/dictionary/practice">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Arena
                    </Link>
                </Button>
            </header>
            
            <main className="bg-card w-full border rounded-2xl shadow-sm p-4 sm:p-6">
                <Tabs defaultValue="practice" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto h-12">
                        <TabsTrigger value="practice" className="text-sm md:text-base h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Mic2 className="w-4 h-4 mr-2" /> Live Practice
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="text-sm md:text-base h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <MessageSquareText className="w-4 h-4 mr-2" /> Speech Analysis
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="practice" className="animate-in fade-in zoom-in-95 duration-300 outline-none">
                        <SpeakingPracticeTab userAge={profile.age} />
                    </TabsContent>
                    
                    <TabsContent value="analysis" className="animate-in fade-in zoom-in-95 duration-300 outline-none">
                        <SpeechAnalysisTab />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
