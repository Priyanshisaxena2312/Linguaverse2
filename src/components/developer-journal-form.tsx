
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarView } from '@/components/calendar-view';
import { format, isSameDay, parseISO, startOfDay, subDays, isBefore } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JournalEntry } from '@/lib/types';


type JournalStreakClientProps = {
  streak: number;
  todayInStreak: boolean;
  analyzedEntries: Pick<JournalEntry, 'created_at' | 'analysis'>[];
  highestStreak: number;
};

function StreakPreview({ entryDates }: { entryDates: string[] }) {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
    const entryDatesParsed = entryDates.map(d => startOfDay(parseISO(d)));

    const weeklyActivity = last7Days.map(day => {
        const hasEntry = entryDatesParsed.some(entryDate => isSameDay(day, entryDate));
        const isPast = isBefore(day, today);
        return {
            date: day,
            status: hasEntry ? 'made' : (isPast ? 'missed' : 'future')
        };
    });

    return (
        <TooltipProvider>
            <div className="flex justify-end items-center gap-1 mt-2">
                {weeklyActivity.map(({ date, status }) => (
                     <Tooltip key={date.toISOString()} delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "h-2.5 w-2.5 rounded-full border",
                                status === 'made' && 'bg-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]',
                                status === 'missed' && 'bg-[hsl(var(--destructive))] border-[hsl(var(--destructive))]',
                                status === 'future' && 'bg-muted border-border'
                            )}></div>
                        </TooltipTrigger>
                        <TooltipContent>
                             <p>{format(date, 'MMM d')}: {status === 'made' ? "Entry made" : (status === 'missed' ? "Entry missed" : "Upcoming")}</p>
                        </TooltipContent>
                     </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}


export function JournalStreakClient({ streak, todayInStreak, analyzedEntries, highestStreak }: JournalStreakClientProps) {
  const [activeTab, setActiveTab] = useState('journal');
  
  // Filter for entries that have the necessary analysis data for the mood calendar.
  const moodModeEntries = analyzedEntries.filter(e => e.analysis?.personal?.mood?.breakdown);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="block transition-transform hover:scale-105 cursor-pointer" aria-label="View your journal calendar">
            <Card className="bg-primary/5 border-primary/20 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Journaling Streak</CardTitle>
                    <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Highest: {highestStreak}</p>
                    <div className="text-2xl font-bold font-headline text-primary">{streak} days</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {todayInStreak ? "You've written today. Keep the flame alive!" : streak > 0 ? "Write today to continue your streak!" : "Write an entry to start your streak!"}
                    </p>
                    <StreakPreview entryDates={analyzedEntries.map(e => e.created_at)} />
                </CardContent>
            </Card>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-min p-2">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <DialogHeader className="p-4">
              <DialogTitle className="font-headline text-2xl text-primary">Your Calendar</DialogTitle>
                <DialogDescription>
                    View your journaling history or your daily mood timeline.
                </DialogDescription>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                    <TabsTrigger value="journal">Journal Calendar</TabsTrigger>
                    <TabsTrigger value="mood">Mood Calendar</TabsTrigger>
                </TabsList>
            </DialogHeader>
            <TabsContent value="journal">
              <CalendarView analyzedEntries={analyzedEntries} mode="journal" />
            </TabsContent>
            <TabsContent value="mood">
               <CalendarView analyzedEntries={moodModeEntries} mode="mood" />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
