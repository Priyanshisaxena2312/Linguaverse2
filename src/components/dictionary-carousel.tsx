
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { JournalEntry, Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { DictionaryEntryView } from './dictionary-entry-view';
import Link from 'next/link';

type DictionaryCarouselProps = {
  entries: JournalEntry[];
  profile: Profile;
  initialSlide: number;
};

export function DictionaryCarousel({ entries, profile, initialSlide }: DictionaryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    startIndex: initialSlide,
  });
  const [selectedIndex, setSelectedIndex] = useState(initialSlide);
  const router = useRouter();

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const newIndex = emblaApi.selectedScrollSnap();
      setSelectedIndex(newIndex);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('initialSlide', String(newIndex));
      window.history.replaceState({}, '', currentUrl.toString());
    };
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, router]);

  const handleJumpToEntry = (indexValue: string) => {
    const index = Number(indexValue);
    if (!isNaN(index)) scrollTo(index);
  };
  
  if (!entries || entries.length === 0) return null;
  
  const currentEntryId = entries[selectedIndex]?.id;

  return (
    <div className="relative w-full h-full flex flex-col">
       <div className="absolute top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm z-10 space-y-2 ">
         <div className="flex flex-col sm:flex-row items-center gap-4 ">
            <div className="w-full sm:w-auto flex-shrink-0 ">
                 <Button asChild variant="outline" size="sm" className='border-2 border-solid border-#a47c5b-800'> 
                    <Link href="/journal?tab=dictionary">
                        <ArrowLeft className="mr-2 h-4 w-4 " />
                        Back to Dictionary
                    </Link>
                </Button>
            </div>
            <div className="flex-grow w-full">
              <Select value={String(selectedIndex)} onValueChange={handleJumpToEntry}>
                <SelectTrigger className="w-full border-2 border-solid border-#a47c5b-800">
                  <SelectValue placeholder="Jump to an entry..." />
                </SelectTrigger>
                <SelectContent>
                  {entries.map((entry, index) => (
                    <SelectItem key={entry.id} value={String(index)}>
                      {entry.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {selectedIndex + 1} of {entries.length}
                </p>
                <Button asChild size="sm">
                    <Link href={`/dictionary/practice/${currentEntryId}`}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Practice This Entry
                    </Link>
                </Button>
            </div>
        </div>
      </div>

      <div className="flex-grow pt-32 overflow-hidden relative">
        <div className="embla h-full" ref={emblaRef}>
          <div className="embla__container flex h-full">
            {entries.map((entry) => (
               <div key={entry.id} className="embla__slide flex-[0_0_100%] min-w-0 h-full p-2 md:p-4 lg:p-6 flex flex-col">
                <DictionaryEntryView entry={entry} />
              </div>
            ))}
          </div>
        </div>
        
        <Button variant="outline" size="icon" onClick={scrollPrev} disabled={!emblaApi?.canScrollPrev()} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full hidden md:flex">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={scrollNext} disabled={!emblaApi?.canScrollNext()} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full hidden md:flex">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
