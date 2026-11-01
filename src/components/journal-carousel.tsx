
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { JournalView } from '@/components/journal-view';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { LongTermAnalysis } from './long-term-analysis';
import { getAnalyzedEntries } from '@/app/journal/actions';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import type { JournalEntry, Profile, Assignment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type JournalCarouselProps = {
  entries: JournalEntry[];
  profile: Profile;
  initialSlide: number;
  assignments: Assignment[];
  isAdminView?: boolean;
  backLink?: string;
  classStudents?: any[];
  currentClassName?: string;
  initialAnalysisData?: Pick<JournalEntry, 'created_at' | 'analysis'>[];
};

export function JournalCarousel({ entries, profile, initialSlide, assignments, isAdminView = false, backLink, classStudents = [], currentClassName, initialAnalysisData }: JournalCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    startIndex: initialSlide,
  });
  const [selectedIndex, setSelectedIndex] = useState(initialSlide);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[] | null>(initialAnalysisData || null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(!initialAnalysisData);
  const router = useRouter();

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

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
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, router]);

  useEffect(() => {
    if (!isPerformanceModalOpen || performanceData) return;

    setIsLoadingPerformance(true);
    getAnalyzedEntries().then(data => {
      setPerformanceData(data);
      setIsLoadingPerformance(false);
    });
  }, [isPerformanceModalOpen, performanceData]);


  const handleJumpToEntry = (indexValue: string) => {
    const index = Number(indexValue);
    if (!isNaN(index)) {
      scrollTo(index);
    }
  };

  const hasEntries = entries && entries.length > 0;
  const finalBackLink = backLink || (isAdminView ? (currentClassName ? `/admin/users/class/${currentClassName}` : '/admin?tab=students') : '/journal');

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 p-2 sm:p-4 border-b bg-background/95 backdrop-blur-sm z-20 space-y-2 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-primary/5 p-2 rounded-xl border border-primary/10">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            {!isAdminView && (
              <Button asChild variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/10">
                <Link href={finalBackLink}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            )}

            {isAdminView && classStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-px bg-border mx-1" />
                <Select value={profile.id} onValueChange={(id) => window.location.href = `/admin/users/${id}/feedback?fromClass=${currentClassName}`}>
                  <SelectTrigger className="h-8 w-[140px] sm:w-[180px] border-none bg-transparent hover:bg-primary/5 font-bold text-primary/80 focus:ring-0">
                    <SelectValue placeholder="Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {classStudents.map(s => (
                      <SelectItem key={s.id} value={s.id} className="font-medium">
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <Dialog open={isPerformanceModalOpen} onOpenChange={setIsPerformanceModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 border border-primary/20 shadow-sm transition-all transform hover:scale-105 active:scale-95">
                  <BarChart3 className="mr-2 h-3.5 w-3.5" /> Performance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl sm:text-3xl flex items-center gap-3 text-primary">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <span>{profile.full_name}'s Analytics</span>
                  </DialogTitle>
                  <CardDescription className="text-sm font-medium opacity-70">Comprehensive progress tracking and metric performance.</CardDescription>
                </DialogHeader>
                <ScrollArea className="h-full max-h-[60vh] py-4 pr-4">
                  {isLoadingPerformance ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                      <p className="font-medium animate-pulse">Analyzing the data cloud...</p>
                    </div>
                  ) : performanceData && performanceData.length > 1 ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <LongTermAnalysis entries={performanceData} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-primary/10 rounded-3xl bg-primary/5">
                      <div className="p-4 bg-muted/50 rounded-full mb-4">
                        <BarChart3 className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="font-semibold text-lg">Growth takes time</p>
                      <p className="text-sm opacity-60">Not enough data yet for a deep performance analysis.</p>
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <div className="flex items-center gap-2 bg-muted/50 p-1 px-3 rounded-full border border-border/50">
              <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Slide</span>
              <p className="text-xs font-bold text-primary">
                {selectedIndex + 1} <span className="opacity-30">/</span> {entries.length}
              </p>
            </div>
          </div>
        </div>

        {hasEntries && (
          <div className="w-full">
            <Select value={String(selectedIndex)} onValueChange={handleJumpToEntry}>
              <SelectTrigger className="w-full h-9 border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all rounded-xl focus:ring-1 focus:ring-primary/20">
                <SelectValue placeholder="Jump to an entry..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {entries.map((entry, index) => (
                  <SelectItem key={entry.id} value={String(index)} className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-[300px]">{entry.title || 'Untitled Entry'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black opacity-60">{format(new Date(entry.created_at), 'PPP')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-hidden relative bg-muted/5">
        {hasEntries ? (
          <>
            <div className="embla h-full" ref={emblaRef}>
              <div className="embla__container flex h-full">
                {entries.map((entry, index) => (
                  <div key={entry.id} className={cn("embla__slide flex-[0_0_100%] min-w-0 h-full max-w-full overflow-hidden", index === selectedIndex && 'is-selected')}>
                    <div className="w-full h-full overflow-y-auto overflow-x-hidden p-2 md:p-4 lg:p-6 max-w-full">
                      <JournalView
                        entry={entry}
                        profile={profile}
                        plan={profile.plan}
                        formattedDate={new Date(entry.created_at).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
                        })}
                        assignments={assignments}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry navigation is now swipe-only as per user request */}
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-md text-center">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold">No Journal Entries</h3>
                <p className="text-muted-foreground mt-2">You haven't created any entries yet.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
