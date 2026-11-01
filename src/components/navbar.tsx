

import { createClient } from '@/lib/supabase/server';
import { NavbarContent } from './navbar-content';
import { getProfile } from '@/app/profile/actions';
import type { Profile } from '@/lib/types';
import { differenceInCalendarDays, parseISO, startOfDay, isToday } from 'date-fns';
import { DEMO_USER_ID } from '@/lib/demo-mode';

/**
 * Calculates streak data based on the user's entry dates.
 * This is now the single source of truth for streak calculation.
 */
async function getStreakData(userId: string) {
    if (userId === DEMO_USER_ID) {
        return { streak: 5 };
    }
    const supabase = await createClient();
    
    // Fetch only entries from the last 31 days to calculate the current streak.
    // This is a massive performance win over fetching the entire history.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    if (error || !entries || entries.length === 0) {
        return { streak: 0 };
    }
    
    // Get unique calendar dates, sorted from oldest to newest
    const uniqueDates = [
        ...new Set(entries.map(e => startOfDay(parseISO(e.created_at)).toISOString())),
    ].map(d => parseISO(d));

    let currentStreak = 0;

    if (uniqueDates.length > 0) {
        const lastEntryDate = uniqueDates[uniqueDates.length - 1];
        const daysSinceLast = differenceInCalendarDays(new Date(), lastEntryDate);

        // If last entry was not today or yesterday, streak is broken
        if (daysSinceLast > 1) {
            currentStreak = 0;
        } else {
            currentStreak = 1;
            for (let i = uniqueDates.length - 2; i >= 0; i--) {
                const diff = differenceInCalendarDays(uniqueDates[i+1], uniqueDates[i]);
                if (diff === 1) {
                    currentStreak++;
                } else if (diff > 1) {
                    break; // Streak broken
                }
            }
        }
    }

    return { streak: currentStreak };
}


export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: (Pick<Profile, 'role'> & { streak?: number }) | null = null;
  if (user) {
    const userProfile = await getProfile();
    const streakData = await getStreakData(user.id);
    if (userProfile) {
        profile = {
            role: userProfile.role,
            streak: streakData.streak
        };
    }
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50 mx-4 md:mx-auto max-w-screen-xl border border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 rounded-full shadow-2xl transition-all duration-300">
      <NavbarContent user={user} profile={profile} />
    </header>
  );
}
