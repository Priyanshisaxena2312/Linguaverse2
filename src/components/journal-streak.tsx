
import { createClient } from '@/lib/supabase/server';
import { differenceInCalendarDays, parseISO, startOfDay, isToday } from 'date-fns';
import { JournalStreakClient } from './developer-journal-form';
import type { Profile, JournalEntry } from '@/lib/types';
import { getProfile } from '@/app/profile/actions';
import { DEMO_USER_ID, DEMO_ENTRIES } from '@/lib/demo-mode';

/**
 * Calculates streak data based on the user's entry dates.
 * This is now the single source of truth for streak calculation.
 */
async function getStreakData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { streak: 0, todayInStreak: false, highestStreak: 0, analyzedEntries: [] };
    }

    // Fetch all of the user's entries with analysis data
    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('created_at, analysis')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error || !entries || entries.length === 0) {
        if (user.id === DEMO_USER_ID) {
            return {
                streak: 5,
                todayInStreak: true,
                highestStreak: 14,
                analyzedEntries: DEMO_ENTRIES.map(e => ({ created_at: e.created_at, analysis: e.analysis as JournalEntry['analysis'] })),
            };
        }
        return { streak: 0, todayInStreak: false, highestStreak: 0, analyzedEntries: [] };
    }
    
    // Get unique calendar dates, sorted from oldest to newest
    const uniqueDates = [
        ...new Set(entries.filter(e => e.created_at).map(e => {
            try {
                return startOfDay(parseISO(e.created_at)).toISOString();
            } catch {
                return null;
            }
        }).filter(Boolean)),
    ].map(d => parseISO(d as string));

    let currentStreak = 0;
    let highestStreak = 0;

    if (uniqueDates.length > 0) {
        currentStreak = 1;
        highestStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const diff = differenceInCalendarDays(uniqueDates[i], uniqueDates[i-1]);
            if (diff === 1) {
                // The day is consecutive
                currentStreak++;
            } else if (diff > 1) {
                // The streak is broken
                highestStreak = Math.max(highestStreak, currentStreak);
                currentStreak = 1;
            }
            // if diff is 0, it's the same day, so do nothing to currentStreak
        }
        highestStreak = Math.max(highestStreak, currentStreak);
    }

    const lastEntryDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;
    const todayInStreak = lastEntryDate ? isToday(lastEntryDate) : false;

    // If the last entry wasn't today or yesterday, the current streak is broken.
    if (lastEntryDate && differenceInCalendarDays(new Date(), lastEntryDate) > 1) {
        currentStreak = 0;
    }
    
    // Fetch and update the highest streak in the database if the new calculation is greater
    const profile = await getProfile();
    const dbHighestStreak = profile?.highest_streak ?? 0;
    if (highestStreak > dbHighestStreak) {
        await supabase
            .from('profiles')
            .update({ highest_streak: highestStreak })
            .eq('id', user.id);
    }
    
    const finalHighest = Math.max(dbHighestStreak, highestStreak);
    
    const analyzedEntries = entries.map(e => ({ created_at: e.created_at, analysis: e.analysis as JournalEntry['analysis'] }));

    return { 
        streak: currentStreak, 
        todayInStreak, 
        highestStreak: finalHighest, 
        analyzedEntries,
    };
}


export async function JournalStreak() {
    const data = await getStreakData();
    return <JournalStreakClient {...data} />;
}
