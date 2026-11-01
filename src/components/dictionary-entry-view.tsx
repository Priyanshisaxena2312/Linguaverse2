
'use client';

import { useState } from 'react';
import type { JournalEntry, VocabularySuggestion, GrammarCorrection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lightbulb, Sparkles, BookOpenCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';


type Correction = (VocabularySuggestion | GrammarCorrection) & { type: 'vocab' | 'grammar' };

const CorrectionDetail = ({ correction }: { correction: Correction | null }) => {
    if (!correction) {
        return (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <ChevronRight className="h-10 w-10 mb-2" />
                <p className="font-semibold">Select an item to see details</p>
                <p className="text-sm">Choose a correction from the list.</p>
            </div>
        );
    }
    
    const isGrammar = correction.type === 'grammar';
    const Icon = isGrammar ? BookOpenCheck : Sparkles;
    const title = isGrammar ? 'Grammar Correction' : 'Vocabulary Suggestion';

    return (
        <div className="p-1 space-y-6">
            <h2 className="font-headline text-2xl text-primary flex items-center gap-3">
                <Icon className="h-6 w-6" />
                {title}
            </h2>
            
            <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Original:</p>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-lg line-through text-red-600 dark:text-red-400">
                    {isGrammar 
                        ? (correction as GrammarCorrection).originalPhrase 
                        : (correction as VocabularySuggestion).originalWord}
                    </p>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Suggested:</p>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                     <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {isGrammar 
                        ? (correction as GrammarCorrection).correctedPhrase 
                        : (correction as VocabularySuggestion).suggestedWord}
                    </p>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><Lightbulb className="h-4 w-4"/>Explanation:</p>
                <p className="text-base p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">{correction.explanation}</p>
            </div>
        </div>
    )
}

export function DictionaryEntryView({ entry }: { entry: JournalEntry }) {
    if (!entry.language_analysis) return null;

    const allCorrections: Correction[] = [
        ...(entry.language_analysis.vocabularyEnhancements || []).map(v => ({ ...v, type: 'vocab' as const })),
        ...(entry.language_analysis.grammarCorrections || []).map(g => ({ ...g, type: 'grammar' as const })),
    ];
    
    const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(allCorrections.length > 0 ? allCorrections[0] : null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
            {/* Left side (Desktop) / Accordion (Mobile) */}
            <Card className="flex flex-col min-h-0">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{entry.title}</CardTitle>
                    <CardDescription>{format(new Date(entry.created_at), 'PPP')}</CardDescription>
                </CardHeader>
                 <CardContent className="flex-1 overflow-y-auto">
                    {/* DESKTOP: List view */}
                    <div className="hidden lg:block space-y-2">
                        {allCorrections.length > 0 ? (
                            allCorrections.map((corr, index) => {
                                const isGrammar = corr.type === 'grammar';
                                const originalText = isGrammar ? (corr as GrammarCorrection).originalPhrase : (corr as VocabularySuggestion).originalWord;
                                const isSelected = selectedCorrection?.type === corr.type && (isGrammar ? (selectedCorrection as GrammarCorrection).originalPhrase === originalText : (selectedCorrection as VocabularySuggestion).originalWord === originalText);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedCorrection(corr)}
                                        className={cn(
                                            "w-full text-left p-3 border rounded-lg transition-all flex items-center gap-3",
                                            isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex-shrink-0">
                                            {isGrammar ? <BookOpenCheck className="h-5 w-5 text-blue-500"/> : <Sparkles className="h-5 w-5 text-amber-500" />}
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-medium truncate">{originalText}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{corr.type} suggestion</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </button>
                                )
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No specific corrections found for this entry.</p>
                        )}
                    </div>
                    {/* MOBILE: Accordion view */}
                    <div className="block lg:hidden">
                        <Accordion type="single" collapsible className="w-full">
                        {allCorrections.map((corr, index) => {
                            const isGrammar = corr.type === 'grammar';
                            const originalText = isGrammar ? (corr as GrammarCorrection).originalPhrase : (corr as VocabularySuggestion).originalWord;
                            const suggestedText = isGrammar ? (corr as GrammarCorrection).correctedPhrase : (corr as VocabularySuggestion).suggestedWord;

                            return (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex-grow text-left">
                                            <p className="text-sm font-medium line-through text-red-500">{originalText}</p>
                                            <p className="text-sm font-semibold text-green-600">{suggestedText}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-1 p-2 bg-muted/50 rounded-md">
                                            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><Lightbulb className="h-4 w-4"/>Explanation:</p>
                                            <p className="text-sm">{corr.explanation}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                        </Accordion>
                    </div>
                </CardContent>
            </Card>

            {/* Right side: Detailed View (Desktop only) */}
            <div className="hidden lg:block h-full min-h-0">
              <Card className="h-full flex flex-col">
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <CorrectionDetail correction={selectedCorrection} />
                  </CardContent>
              </Card>
            </div>
        </div>
    );
}
