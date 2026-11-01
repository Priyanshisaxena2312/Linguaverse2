'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { JournalEntry } from '@/lib/types';
import { format, parseISO } from 'date-fns';

type LongTermAnalysisProps = {
  entries: Pick<JournalEntry, 'created_at' | 'analysis'>[];
};

type AnalysisType = 'grammaticalAccuracy' | 'vocabularyRichness' | 'fluencyAndCohesion' | 'sentiment';

const chartConfig: Record<AnalysisType, { label: string, color: string }> = {
  sentiment: { label: 'Sentiment', color: 'hsl(var(--chart-2))' },
  grammaticalAccuracy: { label: 'Grammar', color: 'hsl(var(--chart-1))' },
  vocabularyRichness: { label: 'Vocabulary', color: 'hsl(var(--chart-4))' },
  fluencyAndCohesion: { label: 'Fluency', color: 'hsl(var(--chart-5))' },
};

export function LongTermAnalysis({ entries }: LongTermAnalysisProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('grammaticalAccuracy');

  const chartData = useMemo(() => {
    if (!entries) return [];
    return entries.map(entry => {
      if (!entry.analysis) return null;
      
      const dataPoint: { date: string, value?: number } = {
        date: format(parseISO(entry.created_at), 'MMM d'),
      };
      
      if (analysisType === 'sentiment' && entry.analysis.personal?.sentiment) {
        dataPoint.value = entry.analysis.personal.sentiment.overallScore;
      } else if (analysisType !== 'sentiment' && entry.analysis.language) {
        dataPoint.value = entry.analysis.language[analysisType];
      }

      return dataPoint;
    }).filter(point => point && point.value !== undefined) as { date: string; value: number }[];
  }, [entries, analysisType]);

  const yDomain: [number, number] = [0, 100];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-2xl capitalize">Performance Trend</CardTitle>
          <CardDescription>Scores over time for the selected metric.</CardDescription>
        </div>
        <Select value={analysisType} onValueChange={(value: AnalysisType) => setAnalysisType(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select analysis type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grammaticalAccuracy">Grammar</SelectItem>
            <SelectItem value="vocabularyRichness">Vocabulary</SelectItem>
            <SelectItem value="fluencyAndCohesion">Fluency</SelectItem>
            <SelectItem value="sentiment">Sentiment</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={yDomain} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartConfig[analysisType].color}
                strokeWidth={2}
                dot={{ r: 4, fill: chartConfig[analysisType].color }}
                activeDot={{ r: 8 }}
                name={chartConfig[analysisType].label}
              />
            </LineChart>
          </ResponsiveContainer>
           ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Not enough data to display a trend for {chartConfig[analysisType].label}. You need at least two analyzed entries.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
