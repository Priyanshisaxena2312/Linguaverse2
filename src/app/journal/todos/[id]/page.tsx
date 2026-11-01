
export const dynamic = 'force-dynamic';

import { getTodoListById } from '@/app/todo/actions';
import { PriorityWeaverClient } from '@/components/priority-weaver-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function TodoListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listResult = await getTodoListById(id);

  if ('error' in listResult || !listResult) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/journal?tab=todos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Lists
          </Link>
        </Button>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{listResult.name}</CardTitle>
                <CardDescription>Drag and drop tasks to update their status.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
                <PriorityWeaverClient initialTasks={listResult.tasks} listId={listResult.id} />
            </div>
        </Card>
    </div>
  );
}
