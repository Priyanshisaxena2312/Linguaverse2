

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Lightbulb, TrendingUp, Tags, Star } from 'lucide-react';
import { getInsightsForPeriod, fetchEntriesForInsights } from '@/app/analysis/actions';
import type { GenerateInsightsOutput } from '@/ai/flows/generate-insights';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Profile } from '@/lib/types';
import Link from 'next/link';

type InsightsGeneratorProps = {
  profile: Profile;
};

export function InsightsGenerator({ profile }: InsightsGeneratorProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<GenerateInsightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setInsights(null);
    setError(null);

    const { entries, error: fetchError } = await fetchEntriesForInsights(period);
    if (fetchError) {
        setError(fetchError);
        toast({
            variant: 'destructive',
            title: 'Insight Generation Failed',
            description: fetchError,
        });
        setIsLoading(false);
        return;
    }

    const result = await getInsightsForPeriod(period, entries);
    if ('error' in result) {
      setError(result.error);
      toast({
          variant: 'destructive',
          title: 'Insight Generation Failed',
          description: result.error,
      });
    } else {
      setInsights(result);
    }
    setIsLoading(false);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">AI-Powered Insights</CardTitle>
        <CardDescription>
          Generate a summary of your thoughts, themes, and emotional trends over a selected period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-background/50">
          <Select value={period} onValueChange={(value: 'week' | 'month') => setPeriod(value)} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto flex-grow">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Generate Insights</>
            )}
          </Button>
        </div>

        {error && !isLoading && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {insights && !isLoading && (
          <div className="p-4 border rounded-lg space-y-4 animate-in fade-in duration-500">
            <h3 className="font-headline text-xl text-primary">{insights.title}</h3>
            <p className="text-muted-foreground">{insights.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Tags className="h-4 w-4 text-primary" /> Key Themes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {insights.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                         <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" /> Emotional Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{insights.emotionalTrend}</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
