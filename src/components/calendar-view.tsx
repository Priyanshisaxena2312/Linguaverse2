
'use client';

import { useState, useMemo } from 'react';
import { parseISO, startOfDay, isBefore, isSameDay, getDate } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { JournalEntry } from '@/lib/types';
import { DayContent, DayContentProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

type CalendarViewProps = {
  analyzedEntries?: Pick<JournalEntry, 'created_at' | 'analysis'>[];
  entryDates?: string[];
  mode?: 'journal' | 'mood';
};

const getMoodEmoji = (moods: { mood: string, percentage: number }[] | undefined): string => {
    if (!moods || !Array.isArray(moods) || moods.length === 0) {
        return '😐'; // Return a default emoji if the data is invalid.
    }

    const dominantMood = moods.reduce((prev, current) => (prev.percentage > current.percentage) ? prev : current);
    const moodLower = dominantMood.mood.toLowerCase();

    // Comprehensive emoji mapping
    if (moodLower.includes('joy') || moodLower.includes('happy') || moodLower.includes('elated')) return '😊';
    if (moodLower.includes('sad') || moodLower.includes('depressed')) return '😢';
    if (moodLower.includes('angry') || moodLower.includes('frustrated')) return '😠';
    if (moodLower.includes('anxious') || moodLower.includes('stressed') || moodLower.includes('nervous')) return '😟';
    if (moodLower.includes('surprised')) return '😮';
    if (moodLower.includes('content') || moodLower.includes('calm') || moodLower.includes('peaceful')) return '😌';
    if (moodLower.includes('grateful')) return '🙏';
    if (moodLower.includes('love')) return '❤️';
    if (moodLower.includes('excited')) return '🎉';
    if (moodLower.includes('tired') || moodLower.includes('exhausted')) return '😴';
    if (moodLower.includes('confused')) return '🤔';
    if (moodLower.includes('proud')) return '🥲';
    if (moodLower.includes('optimistic')) return '😃';
    if (moodLower.includes('creative')) return '💡';
    if (moodLower.includes('productive')) return '🚀';

    return '😐'; // Default neutral face
};


export function CalendarView({ analyzedEntries = [], entryDates = [], mode = 'journal' }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const today = startOfDay(new Date());

  const entryDataByDate = useMemo(() => {
    const map = new Map<string, { hasEntry: boolean, moodEmoji: string }>();
    analyzedEntries.forEach(entry => {
        const day = startOfDay(parseISO(entry.created_at)).toISOString();
        const moodEmoji = getMoodEmoji(entry.analysis?.personal?.mood?.breakdown || (entry.analysis as any)?.mood?.breakdown);
        map.set(day, { hasEntry: true, moodEmoji });
    });
    entryDates.forEach(dateStr => {
        const day = startOfDay(parseISO(dateStr)).toISOString();
        if (!map.has(day)) {
          map.set(day, { hasEntry: true, moodEmoji: '📝' });
        }
    });
    return map;
  }, [analyzedEntries, entryDates]);
  
  const allEntryDates = useMemo(() => Array.from(entryDataByDate.keys()).map(d => parseISO(d)), [entryDataByDate]);

  const DayWithMood = (props: DayContentProps) => {
    const dayISO = startOfDay(props.date).toISOString();
    const data = entryDataByDate.get(dayISO);
    
    // Use the default DayContent to render the date number
    const defaultDay = <DayContent {...props} />;

    if (data?.moodEmoji) {
        return (
            <div className="relative w-full h-full flex items-center justify-center">
                {defaultDay}
                <span className="absolute bottom-0 text-lg -mb-1">{data.moodEmoji}</span>
            </div>
        );
    }
    
    return defaultDay;
  };

  const modifiers = {
    hasEntry: allEntryDates,
    missedEntry: (day: Date) => {
      if (mode === 'mood') return false; // Don't show missed days on mood calendar
      const dayStart = startOfDay(day);
      const hasEntry = allEntryDates.some(entryDate => isSameDay(dayStart, entryDate));
      return isBefore(dayStart, today) && !hasEntry;
    },
  };

  const modifiersClassNames = {
    hasEntry: 'day-with-entry-green',
    missedEntry: 'day-with-entry-red',
  };

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border p-2 sm:p-4"
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      components={{
        DayContent: mode === 'mood' ? DayWithMood : DayContent,
      }}
    />
  );
}
