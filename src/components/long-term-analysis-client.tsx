
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

type AnalysisType = 'sentiment' | 'productivity' | 'creativity';

const chartColors = {
  sentiment: 'hsl(var(--chart-2))',
  productivity: 'hsl(var(--chart-3))',
  creativity: 'hsl(var(--chart-5))',
};

export function LongTermAnalysisClient({ entries }: LongTermAnalysisProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('sentiment');

  const chartData = useMemo(() => {
    if (!entries) return [];
    return entries.map(entry => {
      // THE FIX: Check for `entry.analysis.personal` before trying to access its properties.
      if (!entry.analysis?.personal) return null;
      
      const dataPoint: { date: string, sentiment?: number, productivity?: number, creativity?: number } = {
        date: format(parseISO(entry.created_at), 'MMM d'),
      };
      
      if (entry.analysis.personal.sentiment) {
        dataPoint.sentiment = entry.analysis.personal.sentiment.overallScore;
      }
      if (entry.analysis.personal.productivity !== undefined) {
        dataPoint.productivity = entry.analysis.personal.productivity;
      }
      if (entry.analysis.personal.creativity !== undefined) {
        dataPoint.creativity = entry.analysis.personal.creativity;
      }

      return dataPoint;
    }).filter(point => point && point[analysisType] !== undefined);
  }, [entries, analysisType]);

  const yDomain: [number, number] = [0, 100];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-2xl capitalize">{analysisType} Trend</CardTitle>
          <CardDescription>Your {analysisType} scores over time.</CardDescription>
        </div>
        <Select value={analysisType} onValueChange={(value: AnalysisType) => setAnalysisType(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select analysis type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sentiment">Sentiment</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="creativity">Creativity</SelectItem>
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
                    fontFamily: 'var(--font-body)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={analysisType}
                stroke={chartColors[analysisType]}
                strokeWidth={2}
                dot={{ r: 4, fill: chartColors[analysisType] }}
                activeDot={{ r: 8 }}
                name={analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}
              />
            </LineChart>
          </ResponsiveContainer>
           ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Not enough data to display a trend for {analysisType}. You need at least two analyzed entries.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
