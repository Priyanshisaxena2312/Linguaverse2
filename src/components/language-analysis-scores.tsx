
'use client';

import { Progress } from './ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from 'lucide-react';
import type { AnalyzeJournalEntryOutput } from '@/lib/types';


const scoreExplanations = {
  grammaticalAccuracy: "How correct is the grammar, punctuation, and sentence structure? (100 = flawless).",
  vocabularyRichness: "How diverse, advanced, and appropriately used is the vocabulary? (100 = native-level).",
  fluencyAndCohesion: "How naturally does the text flow? Are ideas connected logically? (100 = very smooth and cohesive).",
}

export function LanguageAnalysisScores({ analysis }: { analysis: AnalyzeJournalEntryOutput }) {
    if (!analysis.language) return null;
    
    const { grammaticalAccuracy, vocabularyRichness, fluencyAndCohesion } = analysis.language;
    
    const scores = [
        { label: "Grammar", value: grammaticalAccuracy, explanation: scoreExplanations.grammaticalAccuracy, color: "bg-blue-500" },
        { label: "Vocabulary", value: vocabularyRichness, explanation: scoreExplanations.vocabularyRichness, color: "bg-green-500" },
        { label: "Fluency", value: fluencyAndCohesion, explanation: scoreExplanations.fluencyAndCohesion, color: "bg-purple-500" },
    ];
    
    return (
        <TooltipProvider>
            <div className="space-y-4">
                {scores.map(score => (
                    <div key={score.label}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                {score.label}
                                 <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>{score.explanation}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </span>
                            <span className="text-sm font-semibold">{score.value.toFixed(0)}/100</span>
                        </div>
                        <Progress value={score.value} indicatorClassName={score.color} />
                    </div>
                ))}
            </div>
        </TooltipProvider>
    )
}
