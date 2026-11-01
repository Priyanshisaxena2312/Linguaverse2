
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProfile } from '@/app/profile/actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DictionaryCarousel } from '@/components/dictionary-carousel';
import { getEntriesWithCorrections } from '../actions';

export default async function DictionaryViewPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const profile = await getProfile();
  if (!profile) {
    notFound();
  }

  const entries = await getEntriesWithCorrections();
  const initialSlide = resolvedParams.initialSlide ? parseInt(resolvedParams.initialSlide as string, 10) : 0;
  
  return (
    <div className="h-[calc(100vh-theme(space.14))]">
        <Suspense fallback={<Skeleton className="w-full h-full" />}>
           <DictionaryCarousel entries={entries} profile={profile} initialSlide={initialSlide} />
        </Suspense>
    </div>
  );
}
