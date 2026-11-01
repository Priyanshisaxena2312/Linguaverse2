


import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { JournalStreak } from '@/components/journal-streak';
import { SentimentOverview } from '@/components/sentiment-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { getIncompleteTasks } from '@/app/todo/actions';
import { Sparkles, Search } from 'lucide-react';
import { DashboardClient } from './client';
import { LookupDialog } from '@/components/lookup-dialog';
import { SpeedDialFab } from '@/components/speed-dial-fab';
import { WelcomeModal } from '@/components/welcome-modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


async function DictionaryStatCard() {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Dictionary</CardTitle>
                <Sparkles className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline text-primary">Review & Learn</div>
                <p className="text-xs text-muted-foreground">
                  Review corrections and practice with your saved words.
                </p>
                <div className="flex gap-2 mt-2 w-full">
                   <Button asChild className="w-full" size="sm">
                      <Link href="/journal?tab=dictionary">Go to Dictionary</Link>
                  </Button>
                  <LookupDialog>
                    <Button variant="outline" size="sm" className="w-full">
                      <Search className="mr-2 h-4 w-4" /> Look up
                    </Button>
                  </LookupDialog>
                </div>
            </CardContent>
        </Card>
    );
}


import { MotionWrapper, StaggerContainer, StaggerItem } from '@/components/motion-wrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  
  if (!supabase) {
    console.warn('Dashboard accessed but Supabase is not configured.');
    redirect('/login');
  }

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/login');
  }

  let initialTaskCount = 0;
  let profile = null;

  try {
    profile = await getProfile();
    
    if (!profile) {
       return (
         <div className="container mx-auto p-20 text-center">
           <h2 className="text-2xl font-bold">Profile not found</h2>
           <p className="text-muted-foreground mt-2">Please try logging in again.</p>
           <Button asChild className="mt-4"><Link href="/login">Back to Login</Link></Button>
         </div>
       );
    }

    if (profile && !profile.profile_setup_complete) {
       redirect('/profile');
    }

    const incompleteTasksResult = await getIncompleteTasks();
    initialTaskCount = (incompleteTasksResult && 'error' in incompleteTasksResult) ? 0 : (incompleteTasksResult?.length || 0);
  } catch (error) {
    console.error("CRITICAL: Dashboard data fetch failed:", error);
    // Continue rendering with defaults instead of 500ing
  }

  if (!profile) return null; // Fallback for type safety


  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      {!profile.profile_setup_complete && <WelcomeModal profile={profile} />}
      
      <StaggerContainer>
          <StaggerItem>
              <header className="w-full text-center mb-8">
                <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary">
                  Welcome, {(profile.full_name || 'User').split(' ')[0]}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">Choose your entry method below to get started.</p>
              </header>
          </StaggerItem>

          <StaggerItem>
             <DashboardClient profile={profile} />
          </StaggerItem>
          
          <StaggerItem>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 my-8">
                <Suspense fallback={<Skeleton className="h-[155px]" />}>
                  <SentimentOverview />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-[155px]" />}>
                  <JournalStreak />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-[155px]" />}>
                    <DictionaryStatCard />
                </Suspense>
              </div>
          </StaggerItem>
      </StaggerContainer>
      
      <SpeedDialFab initialTaskCount={initialTaskCount} />
    </div>
  );
}
