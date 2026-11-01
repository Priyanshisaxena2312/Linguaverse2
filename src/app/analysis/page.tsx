
'use client';

import { useEffect, useState } from 'react';
import { LongTermAnalysis } from '@/components/long-term-analysis';
import { getAnalyzedEntries } from '@/app/journal/actions';
import { backfillEntryAnalysis } from './actions';
import { BookHeart, Wand2, Star, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getProfile } from '@/app/profile/actions';
import { InsightsGenerator } from '@/components/insights-generator';
import type { Profile, JournalEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AnalysisPageClientState = {
  isLoading: boolean;
  profile: (Profile & { email: string | null; db_plan: Profile['plan']; trial_days_remaining: number | null }) | null;
  entries: Pick<JournalEntry, 'created_at' | 'analysis'>[];
  error: string | null;
};

export default function AnalysisPage() {
  const [state, setState] = useState<AnalysisPageClientState>({
    isLoading: true,
    profile: null,
    entries: [],
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      console.log('[PAGE] Analysis page useEffect triggered. Starting data load.');
      try {
        const userProfile = await getProfile();
        console.log('[PAGE] Fetched profile:', userProfile?.id, 'Plan:', userProfile?.plan, 'Opt-in:', userProfile?.ai_analysis_enabled);
        if (!userProfile) {
          throw new Error('Could not load user profile.');
        }

        // Check if AI analysis is enabled.
        if (!userProfile.ai_analysis_enabled) {
          console.log('[PAGE] User has opted out of AI analysis.');
          setState({
            isLoading: false,
            profile: userProfile,
            entries: [],
            error: "opted_out"
          });
          return;
        }
        
        // If opted-in, try to backfill old entries.
        console.log('[PAGE] Starting backfill process...');
        const backfillResult = await backfillEntryAnalysis();
        console.log('[PAGE] Backfill process finished. Result:', backfillResult);

        if (backfillResult.error) {
          toast({ variant: 'destructive', title: 'Analysis Error', description: backfillResult.error });
        } else if ('count' in backfillResult && typeof backfillResult.count === 'number' && backfillResult.count > 0) {
          toast({ title: 'Analysis Complete', description: `Analyzed ${backfillResult.count} of your past entries.` });
        }

        console.log('[PAGE] Fetching all analyzed entries for charts...');
        const analyzedEntries = await getAnalyzedEntries();
        console.log(`[PAGE] Fetched ${analyzedEntries.length} entries with analysis data.`);

        setState({
          isLoading: false,
          profile: userProfile,
          entries: analyzedEntries,
          error: null
        });

      } catch (e: any) {
        console.error('[PAGE_ERROR] An error occurred during data loading:', e);
        setState(s => ({ ...s, isLoading: false, error: e.message }));
      }
    }

    loadData();
  }, [toast]);

  const { isLoading, profile, entries, error } = state;
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8 space-y-8">
        <header className="text-center mb-8">
            <Skeleton className="h-14 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
        </header>
        <div className="flex items-center justify-center flex-col gap-4 text-primary">
            <Loader2 className="h-12 w-12 animate-spin"/>
            <p className="text-lg font-semibold">Loading your analysis...</p>
            <p className="text-sm text-muted-foreground">Please wait while we gather your insights.</p>
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }
  
  if (error === "opted_out") {
     return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
          <header className="text-center mb-8">
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">Track Your Progress</h1>
            <p className="mt-2 text-lg text-muted-foreground">Visualize your emotional and cognitive trends over time.</p>
          </header>
          <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>AI Analysis is Disabled</AlertTitle>
              <AlertDescription>
                  You've opted out of AI analysis in your profile settings. To view your trends and generate insights, you'll need to enable it.
              </AlertDescription>
              <div className="mt-4">
                  <Button asChild>
                    <Link href="/profile">Go to Profile</Link>
                  </Button>
              </div>
          </Alert>
        </div>
     );
  }

  if (error) {
      return <div className="text-center p-8 text-destructive">{error}</div>;
  }
  
  if (!profile) {
      return <div className="text-center p-8">Could not load user profile.</div>
  }
  
  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">Track Your Progress</h1>
          <p className="mt-2 text-lg text-muted-foreground">Visualize your emotional and cognitive trends over time.</p>
      </header>
      
        <div className="space-y-8">
            {entries && entries.length > 1 ? (
                <LongTermAnalysis entries={entries} />
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <BookHeart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">Not Enough Data For Trends</h2>
                    <p className="mt-2 text-muted-foreground">You need at least two analyzed entries to see your trends here.</p>
                    <Button asChild className="mt-6">
                        <Link href="/journal">View Your Journal</Link>
                    </Button>
                </div>
            )}
            
            <InsightsGenerator profile={profile} />
        </div>
    </div>
  );
}
