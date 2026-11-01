

import { createClient } from '@/lib/supabase/server';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { getAnalyzedEntries } from '@/app/journal/actions';
import type { Plan } from '@/lib/types';

async function getAverageSentiment() {
    const entries = await getAnalyzedEntries();

    if (!entries || entries.length === 0) {
        return { average: null, count: 0 };
    }
    
    // THE FIX: Check for `e.analysis.personal` before accessing deeper properties.
    const entriesWithSentiment = entries.filter(e => e.analysis?.personal?.sentiment?.overallScore !== undefined);

    if (entriesWithSentiment.length === 0) {
        return { average: null, count: 0 };
    }

    const totalScore = entriesWithSentiment.reduce((sum, entry) => {
        return sum + (entry.analysis?.personal?.sentiment?.overallScore || 0);
    }, 0);

    const average = totalScore / entriesWithSentiment.length;

    return { average: Math.round(average), count: entriesWithSentiment.length };
}


export async function SentimentOverview() {
    const { average, count } = await getAverageSentiment();

    const getIcon = () => {
        if (average === null) return <Minus className="h-5 w-5 text-muted-foreground" />;
        if (average > 60) return <TrendingUp className="h-5 w-5 text-green-500" />;
        if (average < 40) return <TrendingDown className="h-5 w-5 text-red-500" />;
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    };

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Sentiment Score</CardTitle>
                {getIcon()}
            </CardHeader>
            <CardContent>
                {average !== null ? (
                    <>
                        <div className="text-2xl font-bold font-headline text-primary">{average} / 100</div>
                        <p className="text-xs text-muted-foreground">
                            Based on your last {count} analyzed entries.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold font-headline text-primary">-</div>
                        <p className="text-xs text-muted-foreground">
                           No sentiment data found yet.
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
