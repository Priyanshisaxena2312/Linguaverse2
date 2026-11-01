

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { UploadCloud, MessageSquareWarning, ArrowLeft } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';


async function getSubmittedEntriesForUser(): Promise<(JournalEntry & { assignments: { title: string } | null })[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('journal_entries')
        .select(`*, assignments (title)`)
        .eq('user_id', user.id)
        .eq('is_submitted', true)
        .order('submitted_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching submitted entries for user:", error);
        return [];
    }

    return data as (JournalEntry & { assignments: { title: string } | null })[];
}

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const submittedEntries = await getSubmittedEntriesForUser();

  const entriesWithFeedback = submittedEntries.filter(entry => entry.teacher_feedback);
  const entriesAwaitingFeedback = submittedEntries.filter(entry => !entry.teacher_feedback);

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8 space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary flex items-center gap-3">
            <UploadCloud className="h-10 w-10" />
            My Submissions
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Track your submitted work and view teacher feedback.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Submitted for Review</CardTitle>
          <CardDescription>A list of all your submitted entries and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {submittedEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                       <Link href={`/journal/${entry.id}`} className="hover:underline">{entry.title}</Link>
                    </TableCell>
                    <TableCell>{entry.assignments?.title || 'General Review'}</TableCell>
                    <TableCell>{entry.submitted_at ? format(new Date(entry.submitted_at), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        {entry.teacher_feedback 
                            ? <Link href={`/journal/${entry.id}`}><span className="text-green-600 font-semibold">Feedback Received</span></Link>
                            : <span className="text-muted-foreground">Awaiting Review</span>
                        }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>You have no submitted entries.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
