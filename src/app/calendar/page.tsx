export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarView } from '@/components/calendar-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';

async function getJournalDates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('created_at')
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error fetching journal dates:', error);
    return [];
  }

  return data.map(entry => entry.created_at);
}

export default async function CalendarPage() {
  const journalDates = await getJournalDates();

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3">
            <CalendarDays className="h-10 w-10" />
            Your Journal Calendar
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">A visual timeline of your reflections.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </header>

      <CalendarView entryDates={journalDates} />
    </div>
  );
}
