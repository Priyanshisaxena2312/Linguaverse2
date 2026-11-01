
'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Pie, PieChart, ResponsiveContainer, Cell, RadialBar, RadialBarChart } from 'recharts';
import type { AnalyzeJournalEntryOutput } from '@/lib/types';
import { Progress } from './ui/progress';

type AnalysisChartProps = {
  data: any[];
  type: 'sentiment' | 'mood' | 'productivity' | 'creativity';
  analysisData?: AnalyzeJournalEntryOutput | null;
};

export function AnalysisChart({ data, type, analysisData }: AnalysisChartProps) {
  const chartConfig: ChartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {});

  if (type === 'sentiment') {
    const overallSentimentScore = analysisData?.personal?.sentiment?.overallScore;

    return (
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
        <ResponsiveContainer>
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {overallSentimentScore !== undefined && overallSentimentScore !== null && (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-5xl font-headline">
                    {Math.round(overallSentimentScore)}
                </text>
            )}
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }
  
  if (type === 'mood') {
    return (
        <div className="flex flex-col gap-4 p-4">
            {data.map((item, index) => (
                <div key={`${item.name}-${index}`} className="grid gap-2">
                    <div className="flex items-baseline justify-between">
                        <span className="font-semibold" style={{ color: item.fill }}>{item.name}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{item.value}%</span>
                    </div>
                    <Progress value={item.value} style={{ backgroundColor: `${item.fill}33` }} indicatorClassName="bg-[var(--indicator-color)]" indicatorStyle={{'--indicator-color': item.fill} as React.CSSProperties} />
                </div>
            ))}
        </div>
    );
  }
  
  if (type === 'productivity' || type === 'creativity') {
    const singleData = data[0];
    if (!singleData) return null; // Guard against empty data
    
    const radialConfig: ChartConfig = {
      [singleData.name]: { label: singleData.name, color: singleData.fill },
    };
    return (
      <ChartContainer config={radialConfig} className="mx-auto aspect-square h-[250px]">
        <ResponsiveContainer>
          <RadialBarChart data={data} innerRadius="80%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }}>
                <Cell key={`cell-0`} fill={singleData.fill} />
            </RadialBar>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-5xl font-headline">
              {singleData.value}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  return null;
}
